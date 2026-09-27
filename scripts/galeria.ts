/**
 * Gera a galeria de fotos a partir das pastas entregues pela organização.
 *
 *   yarn galeria <pasta> [<pasta> ...] [--forcar]
 *
 * Lê JPEG e CR3 (inclusive CR3 com extensão .jpg, como sai do Google Drive),
 * descarta duplicatas, escreve a foto ampliada e a miniatura em WebP sob
 * `public/images/galeria/<ano>/` e regrava `contents/galeria/index.json`.
 *
 * Rodar de novo com mais pastas é seguro: o nome de cada arquivo sai do horário
 * e do conteúdo da foto, e não da posição na lista, então endereço publicado não
 * muda. `alt`, `destaque` e `capa` escritos à mão no JSON são preservados. Sem
 * `--forcar`, WebP que já existe não é recodificado.
 */

import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, extname, join, relative } from "node:path";
import sharp, { type Sharp } from "sharp";
import { site } from "../src/lib/site";

// Rodado pelo `yarn galeria`, sempre da raiz do repositório.
const RAIZ = process.cwd();
const CONTEUDO = join(RAIZ, "contents/galeria/index.json");
const SETTINGS = join(RAIZ, "contents/settings/index.json");

const AMPLIADA = 2048;
// Pela altura, não pela largura: a grade justificada fixa a altura da fileira,
// e uma panorâmica de 2,2:1 com largura fixa sairia borrada na linha dela.
const MINIATURA_ALTURA = 600;

// Rajada: o mesmo quadro repetido segundos depois, com um gesto de diferença.
// Os limites saíram de conferir os pares no olho: acima de 60 bits ou de 15
// segundos começam a aparecer fotos distintas de uma mesma cena, como o plano
// aberto e o fechado da mesma palestrante. Sem data dos dois lados só a imagem
// decide, e então com folga bem menor.
const DISTANCIA_RAJADA = 60;
const SEGUNDOS_RAJADA = 15;
const DISTANCIA_SEM_DATA = 10;

// Início do SHA-1 de arquivos que chegaram no pacote e não são foto do evento.
const IGNORAR: Record<string, string> = {
  "5e9ce4": "logotipo do estúdio de fotografia, reenviado por WhatsApp",
  f1497e: "logotipo do estúdio de fotografia, versão em fundo escuro",
};

type Fonte = {
  caminho: string;
  sha: string;
  jpeg: Buffer;
  cr3: boolean;
  orientacao: number;
  /** `AAAA:MM:DD HH:MM:SS` do EXIF, no relógio local de quem fotografou. */
  data: string;
};

type Analise = Fonte & { largura: number; altura: number; hash: string; nitidez: number };

// `id`, e não `slug`: o nextjs-studio indexa item de lista pelo campo `slug`, e
// o watcher do dev, ao recarregar o arquivo, remove só as entradas nomeadas pelo
// arquivo. Com `slug`, cada rodada somaria a lista nova à antiga até reiniciar.
type Foto = {
  id: string;
  arquivo: string;
  miniatura: string;
  largura: number;
  altura: number;
  capturadaEm: string;
  alt: string;
  destaque: boolean;
  capa: boolean;
  order: number;
};

function arquivosDe(pasta: string): string[] {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) return arquivosDe(caminho);
    return /\.(jpe?g|cr3)$/i.test(nome) ? [caminho] : [];
  });
}

const primeiraData = (texto: string) =>
  (texto.match(/\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}/g) ?? []).sort()[0] ?? "";

/** Orientação na IFD0 de um bloco TIFF. É onde o CR3 guarda a do sensor. */
function orientacaoTiff(buf: Buffer, inicio: number): number {
  const le = buf.toString("latin1", inicio, inicio + 2) === "II";
  const u16 = (o: number) => (le ? buf.readUInt16LE(o) : buf.readUInt16BE(o));
  const u32 = (o: number) => (le ? buf.readUInt32LE(o) : buf.readUInt32BE(o));
  const ifd = inicio + u32(inicio + 4);
  for (let i = 0; i < u16(ifd); i++) {
    const entrada = ifd + 2 + i * 12;
    if (u16(entrada) === 0x0112) return u16(entrada + 8);
  }
  return 1;
}

/**
 * O CR3 carrega três JPEG: miniatura, prévia de 1620px e um de resolução total,
 * já revelado pela câmera. É esse o usado, e não uma revelação do RAW: é a foto
 * como quem fotografou viu no visor, com o estilo de imagem da câmera.
 */
async function jpegDoCr3(buf: Buffer): Promise<Buffer> {
  const marca = Buffer.from([0xff, 0xd8, 0xff]);
  let melhor = { inicio: -1, largura: 0 };
  for (let i = buf.indexOf(marca); i !== -1 && i < 4_000_000; i = buf.indexOf(marca, i + 1)) {
    const meta = await sharp(buf.subarray(i), { failOn: "none" })
      .metadata()
      .catch(() => null);
    if (meta?.width && meta.width > melhor.largura) melhor = { inicio: i, largura: meta.width };
  }
  if (melhor.inicio === -1) throw new Error("CR3 sem JPEG embutido");
  return buf.subarray(melhor.inicio);
}

async function lerFonte(caminho: string): Promise<Fonte> {
  const buf = readFileSync(caminho);
  const sha = createHash("sha1").update(buf).digest("hex");

  if (buf.toString("latin1", 4, 11) !== "ftypcrx") {
    const meta = await sharp(buf).metadata();
    const exif = meta.exif?.toString("latin1") ?? "";
    return {
      caminho,
      sha,
      jpeg: buf,
      cr3: false,
      orientacao: meta.orientation ?? 1,
      data: primeiraData(exif),
    };
  }

  const cabeca = buf.subarray(0, 400_000);
  const cmt1 = cabeca.indexOf("CMT1");
  return {
    caminho,
    sha,
    jpeg: await jpegDoCr3(buf),
    cr3: true,
    orientacao: cmt1 > 0 ? orientacaoTiff(cabeca, cmt1 + 4) : 1,
    data: primeiraData(cabeca.toString("latin1")),
  };
}

// O JPEG de dentro do CR3 não tem EXIF: a rotação vem da tag lida no CMT1.
function orientada(fonte: Fonte): Sharp {
  const img = sharp(fonte.jpeg, { failOn: "none" });
  if (!fonte.cr3) return img.rotate();
  const graus: Record<number, number> = { 3: 180, 6: 90, 8: 270 };
  return graus[fonte.orientacao] ? img.rotate(graus[fonte.orientacao]) : img;
}

/** dHash de 256 bits: sobrevive a recompressão e redimensionamento do WhatsApp. */
async function hashPerceptual(fonte: Fonte): Promise<string> {
  const { data } = await orientada(fonte)
    .grayscale()
    .resize(17, 16, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  let bits = "";
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) bits += data[y * 17 + x] > data[y * 17 + x + 1] ? "1" : "0";
  return bits;
}

/** Desvio do laplaciano: entre quadros de uma rajada, o maior é o menos tremido. */
async function nitidez(fonte: Fonte): Promise<number> {
  const stats = await orientada(fonte)
    .resize(1200, 1200, { fit: "inside" })
    .grayscale()
    .convolve({ width: 3, height: 3, kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0], offset: 128 })
    .stats();
  return stats.channels[0].stdev;
}

async function analisar(caminho: string): Promise<Analise> {
  const fonte = await lerFonte(caminho);
  const { info } = await orientada(fonte).toBuffer({ resolveWithObject: true });
  return {
    ...fonte,
    largura: info.width,
    altura: info.height,
    hash: await hashPerceptual(fonte),
    nitidez: await nitidez(fonte),
  };
}

const distancia = (a: string, b: string) => [...a].filter((bit, i) => bit !== b[i]).length;

// Lido como UTC de propósito: o EXIF não tem fuso, e ler no fuso da máquina
// deslocaria o horário reconstruído por `corrigirDataPelaSequencia`.
const segundos = (data: string) =>
  Date.parse(`${data.replace(/^(\d{4}):(\d{2}):(\d{2}) /, "$1-$2-$3T")}Z`) / 1000;

function duplicadas(a: Analise, b: Analise): boolean {
  if (a.sha === b.sha) return true;
  const d = distancia(a.hash, b.hash);
  if (d <= DISTANCIA_SEM_DATA) return true;
  if (!a.data || !b.data) return false;
  return d <= DISTANCIA_RAJADA && Math.abs(segundos(a.data) - segundos(b.data)) <= SEGUNDOS_RAJADA;
}

/**
 * Agrupa por união: se A repete B e B repete C, os três são um quadro só. Fica a
 * de maior resolução, que separa o original da cópia de WhatsApp, e depois a
 * mais nítida, que separa os quadros de uma rajada.
 */
function deduplicar(fotos: Analise[]): { ficam: Analise[]; saem: Array<[Analise, Analise]> } {
  const pai = fotos.map((_, i) => i);
  const raiz = (i: number): number => (pai[i] === i ? i : (pai[i] = raiz(pai[i])));
  for (let i = 0; i < fotos.length; i++)
    for (let j = i + 1; j < fotos.length; j++)
      if (duplicadas(fotos[i], fotos[j])) pai[raiz(i)] = raiz(j);

  const grupos = new Map<number, Analise[]>();
  fotos.forEach((foto, i) => grupos.set(raiz(i), [...(grupos.get(raiz(i)) ?? []), foto]));

  const ficam: Analise[] = [];
  const saem: Array<[Analise, Analise]> = [];
  for (const grupo of grupos.values()) {
    const [melhor, ...resto] = grupo.sort(
      (a, b) => b.largura * b.altura - a.largura * a.altura || b.nitidez - a.nitidez,
    );
    ficam.push(melhor);
    resto.forEach((foto) => saem.push([foto, melhor]));
  }
  return { ficam, saem };
}

const numeroDaCamera = (caminho: string) => /^([A-Z]+_)(\d+)/i.exec(basename(caminho));

/**
 * Foto reexportada depois do evento perde a data da câmera e fica com a da
 * edição, no dia seguinte. A numeração do arquivo continua a da câmera, então o
 * horário real sai dos vizinhos de sequência: entre o IMG_8686 das 12h12 e o
 * IMG_8688 das 12h27, o IMG_8687 foi tirado nesse intervalo.
 */
function corrigirDataPelaSequencia(fotos: Analise[], dia: string) {
  const doDia = (foto: Analise) => foto.data.startsWith(dia);
  const numerada = fotos
    .map((foto) => ({ foto, m: numeroDaCamera(foto.caminho) }))
    .filter((item) => item.m)
    .map(({ foto, m }) => ({ foto, prefixo: m![1], n: Number(m![2]) }));

  for (const alvo of numerada.filter((item) => item.foto.data && !doDia(item.foto))) {
    const irmas = numerada
      .filter((item) => item.prefixo === alvo.prefixo && doDia(item.foto))
      .sort((a, b) => a.n - b.n);
    const antes = irmas.filter((item) => item.n < alvo.n).at(-1);
    const depois = irmas.find((item) => item.n > alvo.n);
    if (!antes && !depois) continue;

    let t = segundos((antes ?? depois)!.foto.data);
    if (antes && depois) {
      const fracao = (alvo.n - antes.n) / (depois.n - antes.n);
      t += (segundos(depois.foto.data) - segundos(antes.foto.data)) * fracao;
    }
    const data = new Date(Math.round(t) * 1000).toISOString().slice(0, 19).replace("T", " ");
    console.log(
      `  horário pela sequência: ${basename(alvo.foto.caminho)} ${alvo.foto.data} → ${data}`,
    );
    alvo.foto.data = data.replaceAll("-", ":");
  }
}

function slugDe(foto: Analise, ano: string): string {
  const hora = foto.data ? foto.data.slice(11).replaceAll(":", "") : "000000";
  return `${site.siteShortName.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()}-${ano}-${hora}-${foto.sha.slice(0, 6)}`;
}

function escaparXml(texto: string): string {
  return texto.replace(
    /[<>&"]/g,
    (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c] ?? c,
  );
}

/**
 * Crédito e endereço do site gravados no arquivo, em EXIF e em XMP. EXIF é o que
 * o sistema operacional mostra nas propriedades; XMP é o que buscador de imagem,
 * Lightroom e agência leem. GPS, modelo e número de série da câmera não saem:
 * a gravação parte de metadado vazio.
 */
function metadados(foto: Analise, capturadaEm: string, ano: string) {
  const autor = site.siteShortName;
  const url = site.siteUrl;
  const direitos = `© ${ano} ${autor}. ${url.replace(/^https?:\/\//, "")}`;
  const descricao = `${site.siteName}, ${site.city}/${site.region}. ${url}`;

  const exif: Record<"IFD0" | "IFD2", Record<string, string>> = {
    IFD0: { Artist: autor, Copyright: direitos, ImageDescription: descricao },
    IFD2: foto.data
      ? { DateTimeOriginal: foto.data, OffsetTimeOriginal: capturadaEm.slice(-6) }
      : {},
  };

  const x = escaparXml;
  const xmp = `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/"
    xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"
    xmlns:Iptc4xmpCore="http://iptc.org/std/Iptc4xmpCore/1.0/xmlns/"
    xmlns:xmp="http://ns.adobe.com/xap/1.0/">
   <dc:creator><rdf:Seq><rdf:li>${x(autor)}</rdf:li></rdf:Seq></dc:creator>
   <dc:rights><rdf:Alt><rdf:li xml:lang="x-default">${x(direitos)}</rdf:li></rdf:Alt></dc:rights>
   <dc:description><rdf:Alt><rdf:li xml:lang="x-default">${x(descricao)}</rdf:li></rdf:Alt></dc:description>
   <dc:source>${x(url)}</dc:source>
   <xmpRights:Marked>True</xmpRights:Marked>
   <xmpRights:WebStatement>${x(url)}</xmpRights:WebStatement>
   <photoshop:Credit>${x(autor)}</photoshop:Credit>
   <photoshop:Source>${x(url)}</photoshop:Source>
   <photoshop:City>${x(site.city)}</photoshop:City>
   <photoshop:State>${x(site.regionName)}</photoshop:State>
   <Iptc4xmpCore:CreatorContactInfo rdf:parseType="Resource">
    <Iptc4xmpCore:CiUrlWork>${x(url)}</Iptc4xmpCore:CiUrlWork>
   </Iptc4xmpCore:CreatorContactInfo>${capturadaEm ? `\n   <xmp:CreateDate>${capturadaEm}</xmp:CreateDate>` : ""}
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;

  return { exif, xmp };
}

async function emParalelo<T, R>(
  itens: T[],
  limite: number,
  fn: (item: T, i: number) => Promise<R>,
) {
  const saida: R[] = new Array(itens.length);
  let proximo = 0;
  await Promise.all(
    Array.from({ length: limite }, async () => {
      while (proximo < itens.length) {
        const i = proximo++;
        saida[i] = await fn(itens[i], i);
      }
    }),
  );
  return saida;
}

async function main() {
  const args = process.argv.slice(2);
  const forcar = args.includes("--forcar");
  const pastas = args.filter((arg) => !arg.startsWith("--"));
  if (pastas.length === 0) {
    console.error("uso: yarn galeria <pasta> [<pasta> ...] [--forcar]");
    process.exit(1);
  }

  const settings = JSON.parse(readFileSync(SETTINGS, "utf8"));
  const inicio: string = settings.eventStartDate;
  const ano = inicio.slice(0, 4);
  // EXIF não traz fuso. A foto é do dia do evento, então o fuso é o dele.
  const fuso = inicio.slice(-6);

  const publico = `/images/galeria/${ano}`;
  const saida = join(RAIZ, "public", publico);
  const saidaMini = join(saida, "miniaturas");
  mkdirSync(saidaMini, { recursive: true });

  const caminhos = pastas.flatMap(arquivosDe);
  console.log(`${caminhos.length} arquivos de imagem`);

  const analises = await emParalelo(caminhos, 4, async (caminho, i) => {
    const analise = await analisar(caminho);
    if ((i + 1) % 50 === 0) console.log(`  analisadas ${i + 1}`);
    return analise;
  });

  for (const foto of analises.filter((item) => IGNORAR[item.sha.slice(0, 6)]))
    console.log(`  ignorada: ${basename(foto.caminho)} (${IGNORAR[foto.sha.slice(0, 6)]})`);
  const validas = analises.filter((item) => !IGNORAR[item.sha.slice(0, 6)]);
  corrigirDataPelaSequencia(validas, inicio.slice(0, 10).replaceAll("-", ":"));

  // Sem horário a foto não tem lugar numa galeria contada pelas horas do dia. As
  // que chegaram assim eram reenvios de WhatsApp em baixa resolução, e a
  // organização decidiu deixá-las de fora.
  const semHorario = validas.filter((item) => !item.data);
  for (const foto of semHorario) console.log(`  sem horário: ${basename(foto.caminho)}`);
  const datadas = validas.filter((item) => item.data);

  const { ficam, saem } = deduplicar(datadas);
  for (const [foto, mantida] of saem)
    console.log(`  duplicata: ${relative(RAIZ, foto.caminho)} → ${basename(mantida.caminho)}`);
  console.log(`${ficam.length} fotos únicas, ${saem.length} duplicatas descartadas`);

  const anteriores = new Map<string, Foto>(
    (existsSync(CONTEUDO) ? (JSON.parse(readFileSync(CONTEUDO, "utf8")) as Foto[]) : []).map(
      (foto) => [foto.id, foto],
    ),
  );

  // Sem horário vão para o fim, pelo nome de arquivo: é o que sobra de ordem.
  ficam.sort((a, b) =>
    a.data && b.data
      ? a.data.localeCompare(b.data)
      : a.data
        ? -1
        : b.data
          ? 1
          : basename(a.caminho).localeCompare(basename(b.caminho)),
  );

  const fotos = await emParalelo(ficam, 3, async (foto, i): Promise<Foto> => {
    const slug = slugDe(foto, ano);
    const capturadaEm = foto.data
      ? `${foto.data.slice(0, 10).replaceAll(":", "-")}T${foto.data.slice(11)}${fuso}`
      : "";
    const { exif, xmp } = metadados(foto, capturadaEm, ano);

    const destino = join(saida, `${slug}.webp`);
    const destinoMini = join(saidaMini, `${slug}.webp`);

    // Os pixels passam crus de um sharp para outro porque o `withExif` herda a
    // IFD1 do original: no iPhone são 7 KB de miniatura JPEG dentro de cada foto.
    const escrever = async (img: Sharp, arquivo: string, quality: number) => {
      const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
      const { width, height, channels } = info;
      return sharp(data, { raw: { width, height, channels } })
        .withIccProfile("srgb")
        .withExif(exif)
        .withXmp(xmp)
        .webp({ quality, effort: 6, smartSubsample: true })
        .toFile(arquivo);
    };

    if (forcar || !existsSync(destino))
      await escrever(
        orientada(foto).resize(AMPLIADA, AMPLIADA, { fit: "inside", withoutEnlargement: true }),
        destino,
        82,
      );
    if (forcar || !existsSync(destinoMini))
      await escrever(
        orientada(foto).resize({ height: MINIATURA_ALTURA, withoutEnlargement: true }),
        destinoMini,
        74,
      );

    const meta = await sharp(destino).metadata();
    const anterior = anteriores.get(slug);
    if ((i + 1) % 50 === 0) console.log(`  gravadas ${i + 1}`);

    return {
      id: slug,
      arquivo: `${publico}/${slug}.webp`,
      miniatura: `${publico}/miniaturas/${slug}.webp`,
      largura: meta.width ?? 0,
      altura: meta.height ?? 0,
      capturadaEm,
      alt: anterior?.alt ?? "",
      destaque: anterior?.destaque ?? false,
      capa: anterior?.capa ?? false,
      order: i + 1,
    };
  });

  // Foto que saiu da seleção não deixa arquivo órfão publicado.
  const vivos = new Set(fotos.map((foto) => `${foto.id}.webp`));
  for (const pasta of [saida, saidaMini])
    for (const nome of readdirSync(pasta))
      if (extname(nome) === ".webp" && !vivos.has(nome)) rmSync(join(pasta, nome));

  mkdirSync(join(RAIZ, "contents/galeria"), { recursive: true });
  writeFileSync(CONTEUDO, `${JSON.stringify(fotos, null, 2)}\n`);

  // Prévia de link de `/galeria`: JPEG em 1200×630 pelo mesmo motivo da OG da
  // home, o WhatsApp descarta imagem acima de ~600 KB.
  const capa = fotos.find((foto) => foto.capa) ?? fotos.find((foto) => foto.destaque) ?? fotos[0];
  if (capa) {
    await sharp(join(RAIZ, "public", capa.arquivo))
      .resize(site.ogImageWidth, site.ogImageHeight, { fit: "cover", position: "attention" })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(join(saida, "og.jpg"));
  }

  const total = [saida, saidaMini]
    .flatMap((pasta) => readdirSync(pasta).map((nome) => join(pasta, nome)))
    .filter((arquivo) => statSync(arquivo).isFile())
    .reduce((soma, arquivo) => soma + statSync(arquivo).size, 0);
  console.log(`${fotos.length} fotos em ${publico}, ${(total / 1024 / 1024).toFixed(1)} MB`);
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
