import "server-only";
import { queryCollection } from "nextjs-studio/server";
import type {
  AgendaItem,
  Alternativa,
  Arquetipo,
  Beneficio,
  Chamada,
  Cota,
  Ctf,
  Destaque,
  Duvida,
  Edicao,
  Fato,
  Hero,
  IconeBeneficio,
  Ingresso,
  Materia,
  NavItem,
  Organizacao,
  Palestrante,
  Patrocinador,
  Pergunta,
  Pesos,
  Privacidade,
  Quiz,
  QuizCopy,
  Secao,
  SectionKey,
  Settings,
  Sobre,
  TimeCor,
  TerminalKind,
  TipoImprensa,
  Tom,
  Trilha,
} from "./content-types";
import { formatDate, formatHour, formatPrice, lowestPrice } from "./content-types";
import { PALESTRANTES_PATH, absoluteUrl, site } from "./site";

export * from "./content-types";

/**
 * Única porta de entrada do conteúdo. Nenhum componente chama `queryCollection`
 * direto — trocar o backend de conteúdo é um refactor deste arquivo.
 *
 * O gerador de tipos do studio (`.studio/studio.d.ts`) não é usado: TypeScript
 * ignora diretórios iniciados por ponto, e o arquivo gerado ainda traz uma
 * interface com sintaxe inválida para a coleção de código de conduta. Em vez de
 * um `as unknown as X` que anula a checagem, cada registro é lido campo a campo
 * pelos acessores abaixo, que também dão o valor de repouso quando o campo está
 * vazio — que é o estado normal enquanto a organização não entrega o dado.
 */

type Row = Record<string, unknown>;

function rows(collection: string): Row[] {
  return queryCollection(collection).all() as Row[];
}

function singleton(collection: string): Row {
  return (queryCollection(collection).first() ?? {}) as Row;
}

const str = (row: Row, key: string, fallback = ""): string =>
  typeof row[key] === "string" ? (row[key] as string) : fallback;

const num = (row: Row, key: string, fallback = 0): number =>
  typeof row[key] === "number" ? (row[key] as number) : fallback;

const bool = (row: Row, key: string): boolean => row[key] === true;

const byOrder = <T extends { order: number }>(a: T, b: T) => a.order - b.order;

// ── Configuração ─────────────────────────────────────────────────────────────

const SECTION_KEYS: SectionKey[] = [
  "fatos",
  "sobre",
  "edicoes",
  "agenda",
  "ctf",
  "palestrantes",
  "ingressos",
  "participe",
  "patrocinio",
  "local",
  "imprensa",
  "faq",
];

export function getSettings(): Settings {
  const row = singleton("settings");
  const raw = (row.sections ?? {}) as Record<string, unknown>;

  const sections = Object.fromEntries(
    SECTION_KEYS.map((key) => [key, raw[key] === true]),
  ) as Record<SectionKey, boolean>;

  return {
    eventStartDate: str(row, "eventStartDate"),
    eventEndDate: str(row, "eventEndDate"),
    eventDisplayDate: str(row, "eventDisplayDate"),
    venueName: str(row, "venueName"),
    venueAddress: str(row, "venueAddress"),
    venueMapUrl: str(row, "venueMapUrl"),
    ticketsUrl: str(row, "ticketsUrl"),
    volunteersDeadline: str(row, "volunteersDeadline"),
    cfpDeadline: str(row, "cfpDeadline"),
    nextEditionDate: str(row, "nextEditionDate"),
    nextEditionDisplayDate: str(row, "nextEditionDisplayDate"),
    sections,
  };
}

export function getNavegacao(): NavItem[] {
  return rows("navegacao").map((row) => ({
    label: str(row, "label"),
    href: str(row, "href"),
    secao: str(row, "secao"),
    grupo: str(row, "grupo"),
    noMenu: bool(row, "noMenu"),
  }));
}

// ── Copy de seção ────────────────────────────────────────────────────────────

const TONS: Tom[] = ["orange", "mint", "dim"];

function tom(row: Row, key: string): Tom {
  const value = str(row, key) as Tom;
  return TONS.includes(value) ? value : "orange";
}

export function getHero(): Hero {
  const row = singleton("hero");
  const lugares = Array.isArray(row.lugares) ? (row.lugares as Row[]) : [];

  return {
    tituloLinha: str(row, "tituloLinha"),
    tituloDestaque: str(row, "tituloDestaque"),
    lede: str(row, "lede"),
    ctaPrimario: str(row, "ctaPrimario"),
    ctaSecundario: str(row, "ctaSecundario"),
    horario: str(row, "horario"),
    lugares: lugares.map((item) => str(item, "nome")).filter(Boolean),
  };
}

/** Cabeçalhos indexados pela chave da seção. Chave ausente devolve o repouso. */
export function getSecoes(): Record<string, Secao> {
  const entries = rows("secoes").map((row): [string, Secao] => {
    const chave = str(row, "chave");
    return [
      chave,
      {
        chave,
        eyebrow: str(row, "eyebrow"),
        eyebrowTom: tom(row, "eyebrowTom"),
        titulo: str(row, "titulo"),
        lede: str(row, "lede"),
        nota: str(row, "nota"),
        notaLinkLabel: str(row, "notaLinkLabel"),
        notaLinkUrl: str(row, "notaLinkUrl"),
        cta: str(row, "cta"),
        ctaUrl: str(row, "ctaUrl"),
      },
    ];
  });

  return Object.fromEntries(entries);
}

export function getDestaque(chave: string): Destaque | undefined {
  return rows("destaques")
    .map((row) => ({
      chave: str(row, "chave"),
      flag: str(row, "flag"),
      eyebrow: str(row, "eyebrow"),
      titulo: str(row, "titulo"),
      texto: str(row, "texto"),
    }))
    .find((item) => item.chave === chave);
}

const ICONES: IconeBeneficio[] = ["exposicao", "ctf", "palestras", "certificado"];

export function getBeneficios(): Beneficio[] {
  return rows("beneficios")
    .map((row) => {
      const icone = str(row, "icone") as IconeBeneficio;
      return {
        icone: ICONES.includes(icone) ? icone : "exposicao",
        texto: str(row, "texto"),
        order: num(row, "order"),
      };
    })
    .sort(byOrder);
}

export function getChamadas(): Chamada[] {
  return rows("chamadas")
    .map((row) => ({
      chave: str(row, "chave"),
      eyebrow: str(row, "eyebrow"),
      eyebrowTom: str(row, "eyebrowTom") === "mint" ? ("mint" as const) : ("orange" as const),
      titulo: str(row, "titulo"),
      texto: str(row, "texto"),
      prazoPrefixo: str(row, "prazoPrefixo"),
      ctaLabel: str(row, "ctaLabel"),
      ctaUrl: str(row, "ctaUrl"),
      ctaVariante: str(row, "ctaVariante") === "mint" ? ("mint" as const) : ("primary" as const),
      order: num(row, "order"),
    }))
    .sort(byOrder);
}

// ── Seções ───────────────────────────────────────────────────────────────────

export function getSobre(): Sobre {
  const row = singleton("sobre");
  return {
    titulo: str(row, "titulo"),
    texto: str(row, "texto"),
    origemTitulo: str(row, "origemTitulo"),
    origemTexto: str(row, "origemTexto"),
  };
}

export function getFatos(): Fato[] {
  return rows("fatos").map((row) => ({
    valor: str(row, "valor"),
    label: str(row, "label"),
  }));
}

export function getIngressos(): Ingresso[] {
  return rows("ingressos")
    .map((row) => ({
      nome: str(row, "nome"),
      slug: str(row, "slug"),
      lote: num(row, "lote"),
      preco: num(row, "preco"),
      parcelas: num(row, "parcelas"),
      validThrough: str(row, "validThrough"),
      ctaUrl: str(row, "ctaUrl"),
      featured: bool(row, "featured"),
      order: num(row, "order"),
    }))
    .sort(byOrder);
}

const TRILHAS: Trilha[] = ["tecnica", "gerencial", "geral", "ctf"];

export function getAgenda(): AgendaItem[] {
  return rows("agenda")
    .map((row) => {
      const trilha = str(row, "trilha") as Trilha;
      return {
        titulo: str(row, "titulo"),
        slug: str(row, "slug"),
        palestrante: str(row, "palestrante"),
        speakerSlug: str(row, "speakerSlug"),
        descricao: str(row, "descricao"),
        startsAt: str(row, "startsAt"),
        endsAt: str(row, "endsAt"),
        trilha: TRILHAS.includes(trilha) ? trilha : "geral",
        tipo: str(row, "tipo"),
        status:
          str(row, "status") === "em-definicao"
            ? ("em-definicao" as const)
            : ("confirmado" as const),
        order: num(row, "order"),
      };
    })
    .sort(byOrder);
}

/** Array de objetos do CMS achatado em lista de texto, sem item vazio. */
function textos(value: unknown, key: string): string[] {
  if (!Array.isArray(value)) return [];
  return (value as Row[]).map((item) => str(item, key)).filter(Boolean);
}

/**
 * Palestrantes anunciados, na ordem em que a organização os divulgou. Registro
 * sem nome ou sem slug fica de fora: o slug é a rota `/palestrantes/<slug>`, e
 * sem ele a página não teria endereço.
 */
export function getPalestrantes(): Palestrante[] {
  return rows("palestrantes")
    .map((row) => ({
      nome: str(row, "nome"),
      slug: str(row, "slug"),
      cargo: str(row, "cargo"),
      empresa: str(row, "empresa"),
      cidade: str(row, "cidade"),
      resumo: str(row, "resumo"),
      experiencia: str(row, "experiencia"),
      palestraTitulo: str(row, "palestraTitulo"),
      palestraResumo: str(row, "palestraResumo"),
      temas: textos(row.temas, "tema"),
      certificacoes: textos(row.certificacoes, "sigla"),
      palcos: textos(row.palcos, "nome"),
      linkedin: str(row, "linkedin"),
      github: str(row, "github"),
      twitter: str(row, "twitter"),
      site: str(row, "site"),
      bio: str(row, "body").trim(),
      destaque: bool(row, "destaque"),
      order: num(row, "order"),
    }))
    .filter((palestrante) => palestrante.nome && palestrante.slug)
    .sort(byOrder);
}

export function getPalestrante(slug: string): Palestrante | undefined {
  return getPalestrantes().find((palestrante) => palestrante.slug === slug);
}

export function getCtf(): Ctf {
  const row = singleton("ctf");
  const linhas = Array.isArray(row.linhas) ? (row.linhas as Row[]) : [];
  const kinds: TerminalKind[] = ["cmd", "ok", "warn", "plain"];

  return {
    titulo: str(row, "titulo"),
    texto: str(row, "texto"),
    formato: str(row, "formato"),
    incluso: str(row, "incluso"),
    linhas: linhas.map((line) => {
      const kind = str(line, "kind") as TerminalKind;
      return {
        kind: kinds.includes(kind) ? kind : "plain",
        texto: str(line, "texto"),
      };
    }),
  };
}

export function getEdicoes(): Edicao[] {
  return rows("edicoes")
    .map((row) => ({
      ano: num(row, "ano"),
      tema: str(row, "tema"),
      local: str(row, "local"),
      endereco: str(row, "endereco"),
      startsAt: str(row, "startsAt"),
      endsAt: str(row, "endsAt"),
      // Número de público existe mas ainda não foi fornecido. Nulo é o estado
      // correto — nunca estimar. Ver PRODUCT.md.
      publico: typeof row.publico === "number" ? row.publico : null,
      resumo: str(row, "resumo"),
      foto: str(row, "foto"),
      albumUrl: str(row, "albumUrl"),
      status:
        str(row, "status") === "confirmado" ? ("confirmado" as const) : ("a-conferir" as const),
    }))
    .sort((a, b) => a.ano - b.ano);
}

/** A edição de um ano, para a rota `/2023`. */
export function getEdicao(ano: number): Edicao | undefined {
  return getEdicoes().find((edicao) => edicao.ano === ano);
}

export function getCotas(): Cota[] {
  return rows("cotas")
    .map((row) => ({
      nome: str(row, "nome"),
      label: str(row, "label"),
      disponivel: bool(row, "disponivel"),
      apoio: bool(row, "apoio"),
      order: num(row, "order"),
    }))
    .sort(byOrder);
}

export function getPatrocinadores(): Patrocinador[] {
  return rows("patrocinadores")
    .map((row) => ({
      nome: str(row, "nome"),
      slug: str(row, "slug"),
      logo: str(row, "logo"),
      url: str(row, "url"),
      cota: str(row, "cota"),
      order: num(row, "order"),
    }))
    .sort(byOrder);
}

/** Marcas na cota de apoio, que não é cota vendida. */
export function getApoiadores(): Patrocinador[] {
  const apoio = getCotas()
    .filter((cota) => cota.apoio)
    .map((cota) => cota.nome);
  return getPatrocinadores().filter((item) => apoio.includes(item.cota));
}

/** Patrocinadores confirmados, agrupados pela cota — na ordem das cotas. */
export function getPatrocinadoresPorCota(): Array<{ cota: Cota; patrocinadores: Patrocinador[] }> {
  const patrocinadores = getPatrocinadores();
  return getCotas()
    .map((cota) => ({
      cota,
      patrocinadores: patrocinadores.filter((item) => item.cota === cota.nome),
    }))
    .filter((group) => group.patrocinadores.length > 0);
}

const TIPOS_IMPRENSA: TipoImprensa[] = [
  "materia",
  "analise",
  "entrevista",
  "release",
  "agenda",
  "institucional",
];

/**
 * Clipping. Registro sem `url` é descartado aqui mesmo: a seção existe para
 * apontar a fonte, e uma linha sem link é uma afirmação sem prova.
 */
export function getImprensa(): Materia[] {
  return rows("imprensa")
    .map((row) => {
      const tipo = str(row, "tipo") as TipoImprensa;
      return {
        veiculo: str(row, "veiculo"),
        slug: str(row, "slug"),
        titulo: str(row, "titulo"),
        url: str(row, "url"),
        data: str(row, "data"),
        tipo: TIPOS_IMPRENSA.includes(tipo) ? tipo : "materia",
        trecho: str(row, "trecho"),
        logo: str(row, "logo"),
        order: num(row, "order"),
      };
    })
    .filter((materia) => materia.url && materia.veiculo)
    .sort(byOrder);
}

const listaPtBr = new Intl.ListFormat("pt-BR", { style: "long", type: "conjunction" });

/**
 * Valores que uma resposta cita por token. Preço, prazo e lote viram outros na
 * primeira virada de lote, e resposta que os escreve por extenso passa a mentir
 * sem ninguém perceber — o dado continua morando na coleção que o governa.
 */
function valoresDaFaq(): Record<string, string> {
  const settings = getSettings();
  const ingressos = getIngressos();
  const lote = ingressos[0];
  const menor = lowestPrice(ingressos);

  // Estado do anúncio, não frase fixa: a grade sai aos poucos, e uma resposta
  // que escreve "nada foi anunciado" passa a mentir no primeiro nome publicado.
  // Mesma condição que governa a rota, para os dois nunca discordarem.
  const palestrantes = getPalestrantes();
  const nomesAnunciados =
    palestrantes.length > 0
      ? // A URL nunca fecha a frase: um ponto colado nela quebra o link ao copiar.
        `Os nomes saem aos poucos, e quem já está confirmado aparece em ${absoluteUrl(PALESTRANTES_PATH)}/ conforme a organização anuncia`
      : "Nenhum palestrante de 2026 foi anunciado até aqui";

  return {
    palestrantes: nomesAnunciados,
    grade: settings.sections.agenda
      ? "A grade com horários já está publicada"
      : "A grade com horários segue em definição",
    data: settings.eventDisplayDate,
    horaInicio: formatHour(settings.eventStartDate),
    horaFim: formatHour(settings.eventEndDate),
    local: settings.venueName,
    endereco: settings.venueAddress,
    cidade: site.city,
    estado: site.regionName,
    sympla: settings.ticketsUrl,
    lote: lote ? String(lote.lote) : "",
    parcelas: lote ? String(lote.parcelas) : "",
    prazoLote: lote ? formatDate(lote.validThrough) : "",
    precoMinimo: menor === null ? "" : formatPrice(menor),
    precos: listaPtBr.format(
      ingressos.map(
        (ticket) =>
          `${ticket.nome.replace(/^Lote \d+ · /, "").toLowerCase()} a ${formatPrice(ticket.preco)}`,
      ),
    ),
    // Marcador de lista, não frase corrida: o mesmo texto vira `<ul>` na página
    // e lista nativa no espelho em Markdown.
    incluso: getBeneficios()
      .map((beneficio) => `- ${beneficio.texto}`)
      .join("\n"),
  };
}

/** Dúvidas frequentes. Alimenta o accordion da página e o `FAQPage` do JSON-LD. */
export function getFaq(): Duvida[] {
  const valores = valoresDaFaq();
  // Token sem valor sai da frase: campo em branco no CMS não vira `{lote}` cru
  // no HTML, no JSON-LD e no espelho em Markdown, que leem todos daqui.
  const resolver = (texto: string) =>
    texto.replace(/\{(\w+)\}/g, (_, chave: string) => valores[chave] ?? "");

  return rows("faq")
    .map((row) => ({
      pergunta: resolver(str(row, "pergunta")),
      resposta: resolver(str(row, "resposta")),
      order: num(row, "order"),
    }))
    .filter((item) => item.pergunta && item.resposta)
    .sort(byOrder);
}

// ── Quiz ─────────────────────────────────────────────────────────────────────

/**
 * O studio varre `contents/quiz/` recursivamente e entrega tudo numa coleção
 * só — subdiretório não vira coleção própria, e o array de `arquetipos/` é
 * expandido em um registro por item. Sobra o `slug` para separar: pergunta
 * mantém o prefixo do diretório, a copy da rota é `index`, arquétipo é o resto.
 */
const ehPergunta = (row: Row) => str(row, "slug").startsWith("perguntas/");
const ehCopy = (row: Row) => str(row, "slug") === "index";

/** Aceita só peso numérico: campo livre no CMS pode chegar como string. */
function pesos(value: unknown): Pesos {
  if (typeof value !== "object" || value === null) return {};

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(
      (entry): entry is [string, number] => typeof entry[1] === "number",
    ),
  );
}

function getQuizCopy(): QuizCopy {
  const row = rows("quiz").find(ehCopy) ?? {};
  return {
    eyebrow: str(row, "eyebrow"),
    titulo: str(row, "titulo"),
    lede: str(row, "lede"),
    nomeLabel: str(row, "nomeLabel"),
    nomePlaceholder: str(row, "nomePlaceholder"),
    nomeAjuda: str(row, "nomeAjuda"),
    ctaComecar: str(row, "ctaComecar"),
    ctaVoltar: str(row, "ctaVoltar"),
    ctaRefazer: str(row, "ctaRefazer"),
    progressoPrefixo: str(row, "progressoPrefixo"),
    resultadoEyebrow: str(row, "resultadoEyebrow"),
    resultadoTimeLabel: str(row, "resultadoTimeLabel"),
    resultadoCorLabel: str(row, "resultadoCorLabel"),
    resultadoAreaLabel: str(row, "resultadoAreaLabel"),
    resultadoFerramentaLabel: str(row, "resultadoFerramentaLabel"),
    resultadoSiglaLabel: str(row, "resultadoSiglaLabel"),
    resultadoRaridadeLabel: str(row, "resultadoRaridadeLabel"),
    cartaLabel: str(row, "cartaLabel"),
    cartaRodapeEsquerda: str(row, "cartaRodapeEsquerda"),
    cartaRodapeDireita: str(row, "cartaRodapeDireita"),
    fotoTrocar: str(row, "fotoTrocar"),
    verVerso: str(row, "verVerso"),
    verFrente: str(row, "verFrente"),
    fotoRemover: str(row, "fotoRemover"),
    fotoAjuda: str(row, "fotoAjuda"),
    fotoAjustando: str(row, "fotoAjustando"),
    zoomLabel: str(row, "zoomLabel"),
    recorteLabel: str(row, "recorteLabel"),
    recorteBaixando: str(row, "recorteBaixando"),
    recorteProcessando: str(row, "recorteProcessando"),
    baixar: str(row, "baixar"),
    compartilhar: str(row, "compartilhar"),
    desafiar: str(row, "desafiar"),
    desafiarCopiado: str(row, "desafiarCopiado"),
    desafioTexto: str(row, "desafioTexto"),
    compartilharTexto: str(row, "compartilharTexto"),
    gerando: str(row, "gerando"),
    erroExportar: str(row, "erroExportar"),
    avisoSafariTitulo: str(row, "avisoSafariTitulo"),
    avisoSafariTexto: str(row, "avisoSafariTexto"),
    semJsTitulo: str(row, "semJsTitulo"),
    semJsTexto: str(row, "semJsTexto"),
    indiceTitulo: str(row, "indiceTitulo"),
    indiceLede: str(row, "indiceLede"),
    ctaEvento: str(row, "ctaEvento"),
    fechoTitulo: str(row, "fechoTitulo"),
    fechoTexto: str(row, "fechoTexto"),
  };
}

function getPerguntas(): Pergunta[] {
  return rows("quiz")
    .filter(ehPergunta)
    .map((row) => {
      const lista = Array.isArray(row.alternativas) ? (row.alternativas as Row[]) : [];
      return {
        chave: str(row, "chave"),
        enunciado: str(row, "enunciado"),
        order: num(row, "order"),
        alternativas: lista
          .map((item): Alternativa => ({
            chave: str(item, "chave"),
            texto: str(item, "texto"),
            pesos: pesos(item.pesos),
          }))
          .filter((item) => item.chave && item.texto),
      };
    })
    .filter((item) => item.chave && item.alternativas.length > 0)
    .sort(byOrder);
}

const TIMES: TimeCor[] = ["red", "blue", "purple", "yellow", "orange", "white"];

function getArquetipos(): Arquetipo[] {
  return rows("quiz")
    .filter((row) => !ehPergunta(row) && !ehCopy(row))
    .map((row) => {
      const trilha = str(row, "trilha") as Trilha;
      const timeCor = str(row, "timeCor") as TimeCor;
      return {
        slug: str(row, "slug"),
        nome: str(row, "nome"),
        sigla: str(row, "sigla"),
        time: str(row, "time"),
        timeCor: TIMES.includes(timeCor) ? timeCor : "blue",
        timeCorNome: str(row, "timeCorNome"),
        timePapel: str(row, "timePapel"),
        area: str(row, "area"),
        ferramenta: str(row, "ferramenta"),
        trilha: TRILHAS.includes(trilha) ? trilha : "geral",
        raridade: str(row, "raridade"),
        raridadeLabel: str(row, "raridadeLabel"),
        resumo: str(row, "resumo"),
        texto: str(row, "texto"),
        noEvento: str(row, "noEvento"),
        order: num(row, "order"),
      };
    })
    .filter((item) => item.slug && item.nome)
    .sort(byOrder);
}

export function getQuiz(): Quiz {
  return { copy: getQuizCopy(), perguntas: getPerguntas(), arquetipos: getArquetipos() };
}

export function getPrivacidade(): Privacidade {
  const row = singleton("privacidade");
  const destaque = (row.destaque ?? {}) as Row;
  const oposicao = (row.oposicao ?? {}) as Row;
  const blocos = Array.isArray(row.blocos) ? (row.blocos as Row[]) : [];

  return {
    titulo: str(row, "titulo"),
    atualizadoEm: str(row, "atualizadoEm"),
    lede: str(row, "lede"),
    destaque: {
      titulo: str(destaque, "titulo"),
      texto: str(destaque, "texto"),
    },
    blocos: blocos.map((bloco) => ({
      titulo: str(bloco, "titulo"),
      texto: str(bloco, "texto"),
    })),
    oposicao: {
      titulo: str(oposicao, "titulo"),
      texto: str(oposicao, "texto"),
      botaoDesligar: str(oposicao, "botaoDesligar"),
      botaoLigar: str(oposicao, "botaoLigar"),
      estadoDesligado: str(oposicao, "estadoDesligado"),
    },
  };
}

export function getEquipe(): Organizacao[] {
  return rows("equipe")
    .map((row) => ({
      nome: str(row, "nome"),
      papel: str(row, "papel"),
      url: str(row, "url"),
      logo: str(row, "logo"),
      order: num(row, "order"),
    }))
    .sort(byOrder)
    .map(({ nome, papel, url, logo }) => ({ nome, papel, url, logo }));
}
