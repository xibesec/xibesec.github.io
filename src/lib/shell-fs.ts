import "server-only";
import {
  credencial,
  formatDate,
  formatPrice,
  getAgenda,
  getEdicoes,
  getIngressos,
  getPalestrantes,
  getParceiros,
  getPatrocinadores,
  getSettings,
  type Settings,
} from "./cms";
import { edicaoPath, site } from "./site";

/** Diretório é objeto; arquivo é lista de linhas. */
export type ShellNode = string[] | { [name: string]: ShellNode };

const hora = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Belem",
});

const dia = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Belem" });

/** Distribui os nomes em colunas de largura fixa, como o `ls` faz. */
function emColunas(nomes: string[], colunas: number, largura: number): string[] {
  const linhas: string[] = [];
  for (let i = 0; i < nomes.length; i += colunas) {
    linhas.push(
      nomes
        .slice(i, i + colunas)
        .map((nome, indice) => (indice === colunas - 1 ? nome : nome.padEnd(largura)))
        .join("")
        .trimEnd(),
    );
  }
  return linhas;
}

/**
 * Sistema de arquivos do terminal do rodapé.
 *
 * Os dados vêm de `contents/` — preço, horário, endereço e parceiros não podem
 * divergir do resto da página, senão o easter egg vira uma segunda fonte de
 * verdade que ninguém lembra de atualizar. As piadas e os textos de prêmio são
 * do próprio shell e ficam aqui.
 */
export function buildShellFs(): ShellNode {
  const settings: Settings = getSettings();
  const ingressos = getIngressos();
  const agenda = getAgenda();
  const parceiros = getParceiros();
  const patrocinadores = getPatrocinadores();
  const palestrantes = getPalestrantes();
  const edicoes = getEdicoes();

  const inicio = settings.eventStartDate ? hora.format(new Date(settings.eventStartDate)) : "";
  const fim = settings.eventEndDate ? hora.format(new Date(settings.eventEndDate)) : "";
  const janela = inicio && fim ? `das ${inicio} às ${fim}` : "";
  const prazoLote = ingressos[0]?.validThrough
    ? dia.format(new Date(ingressos[0].validThrough))
    : "";

  return {
    "evento.txt": [
      `${site.siteName} — 4ª edição.`,
      `Encontro de cibersegurança em ${site.city} do ${site.regionName}.`,
      [settings.eventDisplayDate, janela].filter(Boolean).join(", ") + ".",
      "",
      `${site.siteTagline}.`,
    ],

    "programacao.txt": agenda.length
      ? agenda.map(
          (item) =>
            `${hora.format(new Date(item.startsAt))}  ${item.titulo.toLowerCase()}` +
            (item.status === "em-definicao" ? " (em definição)" : ""),
        )
      : ["Grade em definição."],

    "ingressos.txt": [
      `Lote ${ingressos[0]?.lote ?? ""}${prazoLote ? `, vendas até ${prazoLote}` : ""}:`,
      "",
      ...ingressos.map(
        (t) =>
          "  " +
          t.nome
            .replace(/^Lote \d+ · /, "")
            .toLowerCase()
            .padEnd(15) +
          formatPrice(t.preco).padEnd(11) +
          `em até ${t.parcelas}x`,
      ),
      "",
      "Venda pelo Sympla.",
    ],

    // Diretório sem arquivo dentro é um `ls` que não responde nada: enquanto
    // ninguém foi anunciado, a pasta não existe.
    ...(palestrantes.length > 0
      ? {
          palestrantes: Object.fromEntries(
            palestrantes.map((p) => [
              `${p.slug}.txt`,
              [
                p.nome,
                credencial(p),
                ...(p.experiencia ? [p.experiencia] : []),
                "",
                p.palestraTitulo || "Palestra em definição.",
                "",
                `Perfil: /palestrantes/${p.slug}/`,
              ],
            ]),
          ),
        }
      : {}),

    ctf: {
      "regras.txt": [
        "Modalidade  captura de flags (jeopardy)",
        "Formato     individual",
        "Acesso      incluso em qualquer ingresso",
        "Premiação   para os melhores colocados",
        "Desafios    em preparação",
      ],
      ".flag": [
        "XIBESEC{f4r1nh4_d3_m4nd10c4_3_4gu4}",
        "",
        "Achou sem ninguém mandar. Leve essa energia para setembro.",
      ],
    },

    // Uma edição, um arquivo, nomeado pelo ano: o mesmo nome do último segmento
    // da página, e assim o que o shell conta não descola do que o site publica.
    edicoes: {
      ...Object.fromEntries(
        edicoes.map((edicao) => [
          `${edicao.ano}.txt`,
          [
            `${edicao.tema}${edicao.startsAt ? `, ${formatDate(edicao.startsAt)}` : ""}.`,
            ...(edicao.local ? [`${edicao.local}, ${site.city} do ${site.regionName}.`] : []),
            ...(edicao.publico === null ? ["Público em curadoria."] : []),
            "",
            `Página: ${edicaoPath(edicao.ano)}/`,
          ],
        ]),
      ),
      [`${new Date(settings.eventStartDate).getFullYear()}.txt`]: [
        `Quarta edição. ${settings.eventDisplayDate}${janela ? `, ${janela}` : ""}.`,
        `${settings.venueName}, ${site.city} do ${site.regionName}.`,
        "",
        "Dez horas de programação, duas trilhas e CTF presencial.",
      ],
      ".notas": [
        "Os números de público das edições anteriores estão",
        "em curadoria. Entram aqui quando chegarem.",
      ],
    },

    trilhas: {
      "tecnica.txt": [
        "Ofensiva, defesa, forense, nuvem e pesquisa aplicada.",
        "Grade em definição.",
      ],
      "gerencial.txt": [
        "Liderança, riscos, governança, estratégia e tomada de decisão",
        "em Segurança da Informação.",
        "",
        "Novidade de 2026, rodando em paralelo à trilha técnica.",
      ],
    },

    parceiros: {
      "organizacoes.txt": [
        `${parceiros.length} organizações parceiras, de todo o Brasil:`,
        "",
        ...emColunas(
          parceiros.map((p) => p.nome),
          3,
          22,
        ),
      ],
      "patrocinio.txt": [
        ...patrocinadores.map((p) => `${p.cota.padEnd(13)}${p.nome} (confirmado)`),
        "",
        "Demais cotas: falar com a organização.",
        `Contato: ${site.contactEmail}`,
      ],
    },

    local: {
      "endereco.txt": [settings.venueName, ...settings.venueAddress.split(/,\s*(?=[A-ZÁ-Ú])/)],
      "agenda.txt": [
        `${settings.eventDisplayDate}${janela ? `, ${janela}` : ""}.`,
        "Como chegar: seção Local da página.",
      ],
    },
  };
}
