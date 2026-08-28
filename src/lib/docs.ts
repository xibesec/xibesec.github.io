import "server-only";
import type { Metadata } from "next";
import { rotaPublicada, rotasDeEdicoes, rotasPublicadas } from "./rotas";
import type { Edicao, Materia, Palestrante } from "./content-types";
import {
  formatDate,
  formatPrice,
  getAgenda,
  getBeneficios,
  getChamadas,
  getCotas,
  getCtf,
  getDestaque,
  getEdicoes,
  getEquipe,
  getFaq,
  getFatos,
  getHero,
  getImprensa,
  getIngressos,
  getPalestrantes,
  getParceiros,
  getPatrocinadores,
  getPrivacidade,
  getQuiz,
  getSecoes,
  getSettings,
  getSobre,
  type SectionKey,
  type Settings,
} from "./cms";
import { buildShellFs } from "./shell-fs";
import {
  PALESTRANTES_PATH,
  absoluteUrl,
  canonicalUrl,
  edicaoPath,
  pageMetadata,
  palestrantePath,
  site,
} from "./site";

/**
 * Espelho do site em Markdown, para assistentes de IA e agentes.
 *
 * O HTML é para gente; estes arquivos são a mesma informação em texto puro,
 * anunciados no `<head>` por `<link rel="alternate" type="text/markdown">` e
 * indexados em `/llms.txt`. Não é conteúdo paralelo: **tudo** sai de
 * `contents/`, pela fachada de `cms.ts`, e um documento só existe enquanto a
 * seção correspondente estiver ligada em `settings.sections` — publicar em
 * Markdown o que a página ainda não mostra criaria uma segunda verdade.
 *
 * Os rótulos estruturais daqui ("Data", "Local", "Ingresso") são rotulagem de
 * dado, não copy editorial — mesma natureza dos textos de `shell-fs.ts`.
 */

// ── Montagem de Markdown ─────────────────────────────────────────────────────

/** Junta partes não vazias com linha em branco entre elas. */
function bloco(...partes: Array<string | null | undefined | false>): string {
  return partes.filter((parte): parte is string => Boolean(parte)).join("\n\n");
}

function lista(itens: string[]): string {
  return itens.map((item) => `- ${item}`).join("\n");
}

function tabela(cabecalho: string[], linhas: string[][]): string {
  const escapa = (celula: string) => celula.replace(/\|/g, "\\|").replace(/\n+/g, " ");
  return [
    `| ${cabecalho.join(" | ")} |`,
    `| ${cabecalho.map(() => "---").join(" | ")} |`,
    ...linhas.map((linha) => `| ${linha.map(escapa).join(" | ")} |`),
  ].join("\n");
}

/** Tabela de duas colunas para pares dado/valor. Par sem valor é descartado. */
function fichaTecnica(pares: Array<[string, string]>): string {
  return tabela(
    ["Campo", "Valor"],
    pares.filter(([, valor]) => Boolean(valor)).map(([campo, valor]) => [campo, valor]),
  );
}

function link(rotulo: string, url: string): string {
  return `[${rotulo}](${url})`;
}

const hora = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Belem",
});

function horario(inicio: string, fim: string): string {
  if (!inicio) return "";
  const abre = hora.format(new Date(inicio));
  return fim ? `${abre}–${hora.format(new Date(fim))}` : abre;
}

/** Enumeração em prosa: "a, b e c". Resposta canônica não sai em bullet. */
const emProsa = new Intl.ListFormat("pt-BR", { style: "long", type: "conjunction" });

/** Data do build. Sinal de atualidade — LLM despreza documento sem data. */
const ATUALIZADO_EM = new Date().toISOString().slice(0, 10);

// ── Vocabulário de estado ────────────────────────────────────────────────────

const EM_DEFINICAO = "em definição";
const A_CONFERIR = "a conferir";

const TRILHA_LABEL: Record<string, string> = {
  tecnica: "trilha técnica",
  gerencial: "trilha gerencial",
  ctf: "CTF",
  geral: "geral",
};

// ── Blocos de conteúdo ───────────────────────────────────────────────────────

/**
 * Janela do dia em prosa. Vem do `horario` do hero — é a forma como o evento
 * escreve o próprio horário ("09h às 19h"); o formato derivado das datas ISO só
 * entra se o campo estiver vazio.
 */
function janelaDoEvento(settings: Settings): string {
  return getHero().horario || horario(settings.eventStartDate, settings.eventEndDate);
}

/** Frase-definição do evento. É o trecho que um assistente cita literalmente. */
function definicao(settings: Settings): string {
  const janela = janelaDoEvento(settings);
  return [
    `**${site.siteName}** é a 4ª edição do XibéSec, encontro presencial de cibersegurança`,
    `realizado em ${site.city} do ${site.regionName}, no Norte do Brasil.`,
    settings.eventDisplayDate &&
      `Acontece em ${settings.eventDisplayDate}${janela ? `, das ${janela}` : ""},`,
    settings.venueName && `no ${settings.venueName},`,
    "com duas trilhas simultâneas — técnica e gerencial — e competição CTF presencial.",
    `Realização da ${site.organizationName}`,
  ]
    .filter(Boolean)
    .join(" ");
}

function blocoEvento(): string {
  const settings = getSettings();
  const sobre = getSobre();
  const fatos = getFatos();
  const edicoes = getEdicoes();
  const gerencial = getDestaque("trilha-gerencial");
  const equipe = getEquipe();
  const janela = janelaDoEvento(settings);

  const numeros = fatos.length
    ? bloco(
        "### Em números",
        tabela(
          ["Número", "O que é"],
          fatos.map((f) => [f.valor, f.label]),
        ),
      )
    : "";

  const comPagina = new Set(rotasDeEdicoes().map((rota) => rota.path));

  const anteriores = edicoes.length
    ? bloco(
        "### Edições anteriores",
        tabela(
          ["Ano", "Edição", "Data", "Local", "Público", "Página"],
          edicoes.map((e) => [
            String(e.ano),
            e.tema,
            formatDate(e.startsAt) || (e.status === "confirmado" ? "" : A_CONFERIR),
            e.local || (e.status === "confirmado" ? "" : A_CONFERIR),
            e.publico === null ? EM_DEFINICAO : String(e.publico),
            comPagina.has(edicaoPath(e.ano)) ? canonicalUrl(edicaoPath(e.ano)) : "",
          ]),
        ),
        `Os números de público das edições anteriores existem e estão ${EM_DEFINICAO} para publicação. Não estimar.`,
      )
    : "";

  return bloco(
    "## O evento",
    definicao(settings),
    fichaTecnica([
      ["Nome", site.siteName],
      ["Edição", "4ª"],
      ["Data", settings.eventDisplayDate],
      ["Horário", janela ? `${janela}, fuso America/Belem` : ""],
      ["Início (ISO 8601)", settings.eventStartDate],
      ["Fim (ISO 8601)", settings.eventEndDate],
      ["Local", settings.venueName],
      ["Endereço", settings.venueAddress],
      ["Cidade", `${site.city}, ${site.regionName}, Brasil`],
      ["Formato", "presencial"],
      ["Idioma", "português do Brasil"],
      ["Realização", equipe.map((org) => org.nome).join(", ") || site.organizationName],
      ["Site oficial", canonicalUrl("/")],
      ["Ingressos", settings.ticketsUrl],
    ]),
    sobre.titulo && `### ${sobre.titulo}`,
    sobre.texto,
    numeros,
    gerencial && bloco(`### ${gerencial.titulo}`, `**${gerencial.eyebrow}.** ${gerencial.texto}`),
    sobre.origemTitulo && `### ${sobre.origemTitulo}`,
    sobre.origemTexto,
    anteriores,
  );
}

function blocoProgramacao(): string {
  const secao = getSecoes()["programacao"];
  const agenda = getAgenda();

  if (agenda.length === 0) {
    return bloco("## Programação", `A grade de 2026 está ${EM_DEFINICAO}.`);
  }

  return bloco(
    "## Programação",
    secao?.lede,
    tabela(
      ["Horário", "Atividade", "Trilha", "Situação"],
      agenda.map((item) => [
        horario(item.startsAt, item.endsAt),
        item.titulo,
        TRILHA_LABEL[item.trilha] ?? item.trilha,
        item.status === "em-definicao" ? EM_DEFINICAO : "confirmado",
      ]),
    ),
    agenda.map((item) => `**${item.titulo}** — ${item.descricao}`).join("\n\n"),
    `Horários e atrações finais ainda estão ${EM_DEFINICAO}: a estrutura acima descreve como um dia de XibéSec se organiza, não a grade confirmada.`,
  );
}

/**
 * Quem já foi anunciado. Vazio devolve string vazia, e não uma nota de
 * pendência: é `docsAtivos()` que decide publicar, e documento que existe só
 * para dizer "ainda não há nada" vira um endereço sem assunto. O que o site não
 * anunciou continua declarado em `/docs/agents.md`, na lista do que não afirmar.
 */
function blocoPalestrantes(): string {
  const palestrantes = getPalestrantes();
  if (palestrantes.length === 0) return "";

  const secao = getSecoes()["palestrantes"];

  return bloco(
    "## Palestrantes",
    secao?.lede,
    tabela(
      ["Nome", "Cargo", "Palestra", "Página"],
      palestrantes.map((p) => [
        p.nome,
        [p.cargo, p.empresa].filter(Boolean).join(", "),
        p.palestraTitulo || EM_DEFINICAO,
        canonicalUrl(palestrantePath(p.slug)),
      ]),
    ),
    palestrantes
      .map((p) =>
        bloco(
          `### ${p.nome}`,
          p.resumo,
          fichaTecnica([
            ["Cargo", [p.cargo, p.empresa].filter(Boolean).join(", ")],
            ["De", p.cidade],
            ["Experiência", p.experiencia],
            ["Temas", p.temas.join(", ")],
            ["Certificações", p.certificacoes.join(", ")],
            ["Já palestrou em", p.palcos.join(", ")],
            ["Perfil", canonicalUrl(palestrantePath(p.slug))],
            ["Perfil em Markdown", absoluteUrl(docPath(docDoPalestrante(p.slug)))],
          ]),
          p.palestraTitulo && bloco(`**${p.palestraTitulo}**`, p.palestraResumo),
        ),
      )
      .join("\n\n"),
    `A grade completa e os horários de 2026 seguem ${EM_DEFINICAO}. Os nomes acima são os anunciados até aqui, não a programação final.`,
  );
}

function blocoCtf(): string {
  const ctf = getCtf();
  return bloco(
    "## CTF",
    ctf.texto,
    fichaTecnica([
      ["Modalidade", "captura de flags (jeopardy)"],
      ["Formato", ctf.formato],
      ["Acesso", "incluso em qualquer ingresso"],
      ["Premiação", "para os melhores colocados"],
      ["Desafios", EM_DEFINICAO],
    ]),
    ctf.incluso,
    `Número de desafios e valor da premiação estão ${EM_DEFINICAO}.`,
  );
}

function blocoIngressos(): string {
  const ingressos = getIngressos();
  const beneficios = getBeneficios();
  const settings = getSettings();

  if (ingressos.length === 0) {
    return bloco("## Ingressos", `Lote ${EM_DEFINICAO}.`);
  }

  const lote = ingressos[0];
  const prazo = formatDate(lote.validThrough);

  return bloco(
    "## Ingressos",
    `Lote ${lote.lote}, com vendas até ${prazo}. Venda exclusiva pelo Sympla; não há outro canal oficial.`,
    tabela(
      ["Ingresso", "Preço", "Parcelamento", "Vendas até"],
      ingressos.map((t) => [
        t.nome.replace(/^Lote \d+ · /, ""),
        formatPrice(t.preco),
        `em até ${t.parcelas}x`,
        formatDate(t.validThrough),
      ]),
    ),
    beneficios.length > 0 &&
      bloco("A inscrição dá direito a:", lista(beneficios.map((b) => b.texto))),
    bloco(
      "### Trocas e cancelamento",
      lista([
        "Cancelamento aceito até 7 dias após a compra, desde que solicitado até 48h antes do evento.",
        "Edição dos dados do participante: uma vez, até 24h antes do evento.",
      ]),
    ),
    settings.ticketsUrl && `Compra: ${settings.ticketsUrl}`,
  );
}

function blocoParticipe(): string {
  const chamadas = getChamadas();
  const settings = getSettings();

  if (chamadas.length === 0) return "";

  const prazo = (chave: string) =>
    chave === "voluntarios" && settings.volunteersDeadline
      ? formatDate(`${settings.volunteersDeadline}T23:59:00-03:00`)
      : "";

  return bloco(
    "## Chamadas abertas",
    chamadas
      .map((chamada) => {
        const limite = prazo(chamada.chave);
        return bloco(
          `### ${chamada.titulo}`,
          chamada.texto,
          limite && `Inscrições até ${limite}.`,
          chamada.ctaUrl && `${chamada.ctaLabel}: ${chamada.ctaUrl}`,
        );
      })
      .join("\n\n"),
  );
}

/** Frase única do contato comercial: formulário quando publicado, e-mail como reserva. */
function contatoPatrocinio(): string {
  const formulario = getSecoes()["patrocinio-kit"]?.ctaUrl;
  return formulario
    ? `O contato para patrocínio é pelo formulário em ${formulario}.`
    : `O contato para patrocínio é ${site.contactEmail}.`;
}

function blocoPatrocinio(): string {
  const cotas = getCotas();
  const patrocinadores = getPatrocinadores();

  const confirmados = patrocinadores.length
    ? tabela(
        ["Patrocinador", "Cota", "Site"],
        patrocinadores.map((p) => [
          p.nome,
          cotas.find((c) => c.nome === p.cota)?.label ?? p.cota,
          p.url,
        ]),
      )
    : `Nenhum patrocinador confirmado até aqui.`;

  const disponiveis = cotas.filter((cota) => cota.disponivel);

  return bloco(
    "## Patrocínio",
    "Patrocínio é negociado por cotas, a partir do mídia kit da edição.",
    "### Patrocinadores confirmados",
    confirmados,
    disponiveis.length > 0 &&
      bloco("### Cotas disponíveis", lista(disponiveis.map((cota) => cota.label))),
    `${contatoPatrocinio()} A realização é da ${site.organizationName} (${site.organizationUrl}).`,
  );
}

function blocoParceiros(): string {
  const parceiros = getParceiros();
  if (parceiros.length === 0) return "";

  return bloco(
    "## Organizações parceiras",
    `${parceiros.length} organizações parceiras de todo o Brasil — conferências, coletivos técnicos, editoras e empresas — integram o ecossistema da edição.`,
    tabela(
      ["Organização", "Site"],
      parceiros.map((p) => [p.nome, p.url]),
    ),
  );
}

function blocoLocal(): string {
  const settings = getSettings();
  const janela = janelaDoEvento(settings);

  return bloco(
    "## Local",
    fichaTecnica([
      ["Espaço", settings.venueName],
      ["Endereço", settings.venueAddress],
      ["Cidade", `${site.city}, ${site.regionName}, Brasil`],
      ["Data", settings.eventDisplayDate],
      ["Horário", janela],
      ["Como chegar", settings.venueMapUrl],
    ]),
  );
}

function blocoImprensa(): string {
  const materias = getImprensa();
  if (materias.length === 0) return "";

  return bloco(
    "## Na imprensa",
    "Cobertura de veículos de imprensa e de referências do setor de segurança, desde a primeira edição.",
    tabela(
      ["Veículo", "Publicação", "Data", "Link"],
      materias.map((m) => [m.veiculo, m.titulo, m.data, m.url]),
    ),
    materias
      .filter((m) => m.trecho)
      .map((m) => `> ${m.trecho}\n>\n> — ${m.veiculo}, ${m.data}`)
      .join("\n\n"),
  );
}

function blocoFaq(): string {
  const duvidas = getFaq();
  if (duvidas.length === 0) return "";

  return bloco(
    "## Dúvidas frequentes",
    duvidas.map((item) => bloco(`### ${item.pergunta}`, item.resposta)).join("\n\n"),
  );
}

/**
 * O quiz é peça de divulgação, e o que interessa a um agente é o mapa de
 * arquétipos — não as perguntas, que só fazem sentido respondidas na página.
 */
function blocoQuiz(): string {
  const { copy, perguntas, arquetipos } = getQuiz();
  if (arquetipos.length === 0) return "";

  return bloco(
    `## ${copy.titulo}`,
    copy.lede,
    `Disponível em ${link("/quiz", absoluteUrl("/quiz"))}. São ${perguntas.length} perguntas, respondidas no navegador; ao final a pessoa recebe um arquétipo e uma imagem para compartilhar. Nada é enviado ao servidor — o site é estático e não coleta resposta, nome ou foto.`,
    "### Arquétipos",
    tabela(
      ["Arquétipo", "Time", "Área", "Resumo"],
      arquetipos.map((item) => [item.nome, item.time, item.area, item.resumo]),
    ),
    "As porcentagens de raridade mostradas na página são rótulo editorial, não medição: o site é estático e não registra resposta.",
  );
}

/**
 * O terminal em prosa. A árvore sai do próprio `shell-fs.ts`, e só o primeiro
 * nível: o que está oculto no `ls` continua oculto aqui — a flag é o segredo do
 * desafio, e um documento que a lista entrega o brinquedo antes da brincadeira.
 */
function blocoTerminal(): string {
  const secao = getSecoes()["terminal"];
  if (!secao?.lede) return "";

  const raiz = buildShellFs();
  const arvore = (Array.isArray(raiz) ? [] : Object.entries(raiz))
    .filter(([nome]) => nome[0] !== ".")
    .map(([nome, no]) => (Array.isArray(no) ? nome : `${nome}/`))
    .sort((a, b) => a.localeCompare(b, "pt-BR"));

  return bloco(
    `## ${secao.titulo || "Terminal"}`,
    secao.lede,
    `Disponível em ${link("/terminal", absoluteUrl("/terminal"))}, e no rodapé de toda página do site.`,
    arvore.length > 0 && bloco("O sistema de arquivos do evento:", lista(arvore)),
    secao.nota,
    "Nenhum comando é registrado: o site é estático e o shell roda no navegador de quem digita.",
  );
}

/**
 * O mapa do site em Markdown. Cita rotas e arquivos por caminho, nunca pelo
 * documento montado: é o único bloco que fala de todos os outros.
 */
function blocoMapaDoSite(): string {
  const secao = getSecoes()["sitemap"];

  return bloco(
    `## ${secao?.eyebrow || "Mapa do site"}`,
    secao?.lede,
    tabela(
      ["Página", "Endereço", "O que traz"],
      rotasPublicadas().map((rota) => [
        rota.rotulo,
        canonicalUrl(rota.path),
        rota.path === "/" ? site.siteDescription : resumoDaRota(rota.path),
      ]),
    ),
    "### Para máquinas",
    lista(
      arquivosParaMaquina().map((arquivo) => `${absoluteUrl(arquivo.path)} — ${arquivo.resumo}`),
    ),
  );
}

function blocoPrivacidade(): string {
  const privacidade = getPrivacidade();
  if (privacidade.blocos.length === 0) return "";

  return bloco(
    `## ${privacidade.titulo}`,
    privacidade.lede,
    `Disponível em ${link("/privacidade", absoluteUrl("/privacidade"))}.`,
    `### ${privacidade.destaque.titulo}`,
    privacidade.destaque.texto,
    ...privacidade.blocos.flatMap((item) => [`### ${item.titulo}`, item.texto]),
    ...(privacidade.oposicao.titulo
      ? [`### ${privacidade.oposicao.titulo}`, privacidade.oposicao.texto]
      : []),
  );
}

// ── Catálogo de documentos ───────────────────────────────────────────────────

export type Doc = {
  /** Vira o arquivo `/docs/<slug>.md`. */
  slug: string;
  titulo: string;
  /** Uma frase, para o índice de `/llms.txt`. */
  resumo: string;
  /** Seção que governa a publicação. `null` = sempre publicado. */
  secao: SectionKey | null;
  /** Rota HTML equivalente. Ausente: o documento espelha uma seção da home. */
  rota?: string;
  corpo: () => string;
};

const DOCS: Doc[] = [
  {
    slug: "evento",
    titulo: "O evento",
    resumo: "O que é o XibéSec, data, local, formato, origem do nome e edições anteriores.",
    secao: "sobre",
    rota: "/evento",
    corpo: blocoEvento,
  },
  {
    slug: "programacao",
    titulo: "Programação",
    resumo: "Como o dia se organiza, trilhas e horários.",
    secao: "agenda",
    corpo: blocoProgramacao,
  },
  {
    slug: "palestrantes",
    titulo: "Palestrantes",
    resumo: "Quem apresenta na edição, com a palestra e o perfil de cada pessoa.",
    // Sem feature flag: a página existe enquanto houver nome anunciado, e a
    // chave `palestrantes` governa só a vitrine da home. É o corpo vazio que
    // tira o documento do ar quando não há ninguém.
    secao: null,
    rota: PALESTRANTES_PATH,
    corpo: blocoPalestrantes,
  },
  {
    slug: "ctf",
    titulo: "CTF",
    resumo: "Competição presencial de captura de bandeira: modalidade, formato e premiação.",
    secao: "ctf",
    rota: "/ctf",
    corpo: blocoCtf,
  },
  {
    slug: "ingressos",
    titulo: "Ingressos",
    resumo: "Preços do lote vigente, parcelamento, o que está incluso e regras de cancelamento.",
    secao: "ingressos",
    corpo: blocoIngressos,
  },
  {
    slug: "participe",
    titulo: "Chamadas abertas",
    resumo: "Chamada para palestrantes e para voluntários, com prazos.",
    secao: "participe",
    corpo: blocoParticipe,
  },
  {
    slug: "patrocinio",
    titulo: "Patrocínio",
    resumo: "Cotas, patrocinadores confirmados e contato comercial.",
    secao: "patrocinio",
    rota: "/patrocinio",
    corpo: blocoPatrocinio,
  },
  {
    slug: "parceiros",
    titulo: "Organizações parceiras",
    resumo: "As organizações que integram o ecossistema da edição.",
    secao: "parceiros",
    corpo: blocoParceiros,
  },
  {
    slug: "local",
    titulo: "Local",
    resumo: "Endereço, cidade e como chegar.",
    secao: "local",
    rota: "/local",
    corpo: blocoLocal,
  },
  {
    slug: "imprensa",
    titulo: "Na imprensa",
    resumo: "Cobertura de veículos de imprensa e do setor de segurança.",
    secao: "imprensa",
    rota: "/press",
    corpo: blocoImprensa,
  },
  {
    slug: "faq",
    titulo: "Dúvidas frequentes",
    resumo:
      "Data, preço, o que o ingresso inclui, como funciona o CTF e o que ainda não foi anunciado.",
    secao: "faq",
    rota: "/faq",
    corpo: blocoFaq,
  },
  {
    slug: "quiz",
    titulo: "Quiz: que tipo de hacker você é",
    resumo: "Os arquétipos do quiz de divulgação, com o time na roda de cores e a área de cada um.",
    // Sem feature flag: a rota existe sempre, só não aparece no menu.
    secao: null,
    rota: "/quiz",
    corpo: blocoQuiz,
  },
  {
    slug: "terminal",
    titulo: "Terminal",
    resumo:
      "O xibesh em tela cheia: um shell que roda no navegador e responde sobre data, programação, ingressos, trilhas, local e parceiros da edição.",
    // Sem feature flag: o shell vive no rodapé de todas as páginas.
    secao: null,
    rota: "/terminal",
    corpo: blocoTerminal,
  },
  {
    slug: "sitemap",
    titulo: "Mapa do site",
    resumo: "As páginas publicadas e os arquivos que o site escreve para leitura por máquina.",
    secao: null,
    rota: "/sitemap",
    corpo: blocoMapaDoSite,
  },
  {
    slug: "privacidade",
    titulo: "Privacidade",
    resumo: "O que o site mede, o que não coleta e por que não há aviso de cookies.",
    secao: null,
    rota: "/privacidade",
    corpo: blocoPrivacidade,
  },
];

/**
 * Documentos que a publicação permite. Não renderiza corpo: é o que o documento
 * do mapa do site consulta para citar os outros sem reentrar na montagem.
 */
function docsHabilitados(): Doc[] {
  const { sections } = getSettings();
  return DOCS.filter((doc) => doc.secao === null || sections[doc.secao] === true);
}

/** Documentos publicáveis: seção ligada e corpo com conteúdo. */
export function docsAtivos(): Array<Doc & { corpoRenderizado: string }> {
  return docsHabilitados()
    .map((doc) => ({ ...doc, corpoRenderizado: doc.corpo() }))
    .filter((doc) => doc.corpoRenderizado !== "");
}

export function docPath(slug: string): string {
  return `/docs/${slug}.md`;
}

// ── Um documento por palestrante ─────────────────────────────────────────────

/**
 * O perfil de cada pessoa em Markdown, sob o mesmo caminho da rota HTML:
 * `/palestrantes/<slug>` tem `/docs/palestrantes/<slug>.md`. São os documentos
 * mais citáveis do site, com nome próprio, tema declarado e uma palestra com
 * assunto, e por isso ganham arquivo em vez de virarem parágrafo do índice.
 */
export function docDoPalestrante(slug: string): string {
  return `palestrantes/${slug}`;
}

function corpoDoPalestrante(palestrante: Palestrante): string {
  const cargo = [palestrante.cargo, palestrante.empresa].filter(Boolean).join(", ");
  const settings = getSettings();

  return bloco(
    `## ${palestrante.nome}`,
    palestrante.resumo,
    fichaTecnica([
      ["Nome", palestrante.nome],
      ["Cargo", cargo],
      ["De", palestrante.cidade],
      ["Experiência", palestrante.experiencia],
      ["Temas", palestrante.temas.join(", ")],
      ["Certificações", palestrante.certificacoes.join(", ")],
      ["Já palestrou em", palestrante.palcos.join(", ")],
      ["Palestra no XibéSec 2026", palestrante.palestraTitulo],
      ["Data", settings.eventDisplayDate],
      ["Local", `${settings.venueName}, ${site.city}, ${site.regionName}, Brasil`],
      ["LinkedIn", palestrante.linkedin],
      ["GitHub", palestrante.github],
      ["Site", palestrante.site],
    ]),
    palestrante.palestraTitulo &&
      bloco(`### ${palestrante.palestraTitulo}`, palestrante.palestraResumo),
    palestrante.bio && bloco("### Quem é", palestrante.bio),
    `Horário da palestra na grade: ${EM_DEFINICAO}.`,
  );
}

export type Perfil = { slug: string; titulo: string; resumo: string; rota: string; corpo: string };

// ── Um documento por edição anterior ─────────────────────────────────────────

/** O nome de uma edição: a marca sem o ano da corrente, mais o ano dela. */
export function nomeDaEdicao(edicao: Edicao): string {
  return `${site.siteShortName} ${edicao.ano}`;
}

/**
 * `/edicao/2023` tem `/docs/edicao/2023.md`: o documento mora sob o mesmo
 * caminho da rota HTML, como o perfil de cada palestrante.
 */
export function docDaEdicao(edicao: Edicao): string {
  return edicaoPath(edicao.ano).replace(/^\//, "");
}

/**
 * A frase que apresenta a edição em uma linha. Sai do que aconteceu, com data e
 * local: é o que responde à busca por "XibéSec 2023" sem obrigar a abrir a
 * página.
 */
export function resumoDaEdicao(edicao: Edicao): string {
  const quando = formatDate(edicao.startsAt);
  const onde = [edicao.local, `${site.city} do ${site.regionName}`].filter(Boolean).join(", ");

  return [
    `${edicao.tema} do ${site.siteShortName}`,
    quando ? `, em ${quando}` : "",
    onde ? `, ${onde}` : "",
    ".",
  ].join("");
}

/** Cobertura publicada no ano da edição. Data de publicação, não de realização. */
function imprensaDoAno(ano: number): Materia[] {
  return getImprensa().filter((materia) => materia.data.startsWith(String(ano)));
}

function corpoDaEdicao(edicao: Edicao): string {
  const settings = getSettings();
  const janela = horario(edicao.startsAt, edicao.endsAt);
  const cobertura = imprensaDoAno(edicao.ano);

  return bloco(
    `## ${nomeDaEdicao(edicao)}`,
    edicao.resumo,
    fichaTecnica([
      ["Edição", edicao.tema],
      ["Data", formatDate(edicao.startsAt)],
      ["Horário", janela ? `${janela}, fuso America/Belem` : ""],
      ["Início (ISO 8601)", edicao.startsAt],
      ["Fim (ISO 8601)", edicao.endsAt],
      ["Local", edicao.local],
      ["Endereço", edicao.endereco],
      ["Cidade", `${site.city}, ${site.regionName}, Brasil`],
      ["Formato", "presencial"],
      ["Idioma", "português do Brasil"],
      ["Público", edicao.publico === null ? EM_DEFINICAO : String(edicao.publico)],
      ["Álbum de fotos", edicao.albumUrl],
      ["Página", canonicalUrl(edicaoPath(edicao.ano))],
    ]),
    edicao.publico === null &&
      `O número de público desta edição está ${EM_DEFINICAO} para publicação. Não estimar.`,
    cobertura.length > 0 &&
      bloco(
        `### Na imprensa em ${edicao.ano}`,
        tabela(
          ["Veículo", "Publicação", "Data", "Link"],
          cobertura.map((m) => [m.veiculo, m.titulo, m.data, m.url]),
        ),
      ),
    bloco(
      "### A edição atual",
      `O ${site.siteName}, quarta edição, acontece em ${settings.eventDisplayDate}, no ${settings.venueName}, em ${site.city} do ${site.regionName}: ${canonicalUrl("/")}`,
    ),
  );
}

/**
 * Um documento por edição publicada. Nasce do conteúdo, como os perfis: é o
 * `resumo` escrito em `contents/edicoes/` que põe a edição no ar, aqui e na
 * rota HTML.
 */
export function docsDeEdicoes(): Perfil[] {
  // Quem decide a publicação é o catálogo de rotas, que já aplicou a feature
  // flag e o teste de conteúdo. Repetir os dois testes aqui os faria divergir.
  const publicadas = new Set(rotasDeEdicoes().map((rota) => rota.path));

  return getEdicoes()
    .filter((edicao) => publicadas.has(edicaoPath(edicao.ano)))
    .map((edicao) => ({
      slug: docDaEdicao(edicao),
      titulo: nomeDaEdicao(edicao),
      resumo: resumoDaEdicao(edicao),
      rota: edicaoPath(edicao.ano),
      corpo: corpoDaEdicao(edicao),
    }));
}

/** Um perfil por pessoa anunciada, na ordem em que foram divulgadas. */
export function perfisDePalestrantes(): Perfil[] {
  if (!rotaPublicada(PALESTRANTES_PATH)) return [];

  return getPalestrantes().map((palestrante) => ({
    slug: docDoPalestrante(palestrante.slug),
    titulo: palestrante.nome,
    resumo: resumoDoPalestrante(palestrante),
    rota: palestrantePath(palestrante.slug),
    corpo: corpoDoPalestrante(palestrante),
  }));
}

/**
 * A frase que apresenta a pessoa em uma linha: o que vai para a descrição da
 * página, para o índice de documentos e para o mapa do site. Sai do que a
 * organização anunciou, nunca de adjetivo escrito aqui.
 */
export function resumoDoPalestrante(palestrante: Palestrante): string {
  const papel = [palestrante.cargo, palestrante.empresa].filter(Boolean).join(", ");
  const abertura = papel ? `${palestrante.nome}, ${papel}.` : `${palestrante.nome}.`;

  return palestrante.palestraTitulo
    ? `${abertura} Apresenta “${palestrante.palestraTitulo}” no ${site.siteName}, em ${getSettings().eventDisplayDate}, em ${site.city} do ${site.regionName}.`
    : `${abertura} Palestrante confirmado do ${site.siteName}, em ${site.city} do ${site.regionName}.`;
}

/** A frase que descreve a rota, quando ela tem documento. */
export function resumoDaRota(rota: string): string {
  const doc = docsHabilitados().find((item) => item.rota === rota);
  if (doc) return doc.resumo;

  // A edição responde pelo resumo curto, sem montar o corpo do documento: o
  // mapa do site pede a frase de toda rota publicada, uma por uma.
  const edicao = getEdicoes().find((item) => edicaoPath(item.ano) === rota);
  if (edicao) return resumoDaEdicao(edicao);

  return perfisDePalestrantes().find((perfil) => perfil.rota === rota)?.resumo ?? "";
}

/** Tudo que o build escreve para ser lido por máquina, na ordem de importância. */
export function arquivosParaMaquina(): Array<{ path: string; resumo: string }> {
  return [
    { path: "/llms.txt", resumo: "índice do site para assistentes de IA" },
    { path: "/llms-full.txt", resumo: "o site inteiro em um arquivo" },
    { path: docPath("agents"), resumo: "respostas canônicas e o que ainda não está definido" },
    { path: "/index.md", resumo: "espelho da página inicial em Markdown" },
    ...docsHabilitados().map((doc) => ({ path: docPath(doc.slug), resumo: doc.resumo })),
    ...docsDeEdicoes().map((doc) => ({ path: docPath(doc.slug), resumo: doc.resumo })),
    ...perfisDePalestrantes().map((perfil) => ({
      path: docPath(perfil.slug),
      resumo: perfil.resumo,
    })),
    { path: "/sitemap.xml", resumo: "mapa do site" },
    { path: "/robots.txt", resumo: "regras de rastreamento" },
  ];
}

/**
 * Espelho em Markdown de uma rota HTML, ou `null` quando o build não gera um —
 * anunciar no `<link rel="alternate">` arquivo que não foi escrito é prometer
 * 404 a quem veio pelo Markdown. Só o corpo do documento pedido é renderizado:
 * o do mapa do site cita todas as rotas e cairia em laço se olhasse os demais.
 */
export function markdownDaRota(rota: string): string | null {
  if (rota === "/") return "/index.md";

  const doc = docsHabilitados().find((item) => item.rota === rota);
  if (doc) return doc.corpo() !== "" ? docPath(doc.slug) : null;

  const edicao = rotasDeEdicoes().some((item) => item.path === rota);
  if (edicao) return docPath(rota.replace(/^\//, ""));

  const perfil = perfisDePalestrantes().find((item) => item.rota === rota);
  return perfil ? docPath(perfil.slug) : null;
}

/**
 * Metadata de uma rota governada por feature flag. `notFound()` não impede o
 * export de escrever o HTML — ele sai vazio, mas com título e canonical. Sem o
 * `noindex` daqui, a seção desligada vira um soft 404 indexável, e nada pior:
 * um endereço que responde 200 anunciando conteúdo que a organização retirou.
 */
export function metadataDeRota({
  path,
  title,
  description,
}: {
  path: string;
  title: string;
  description: string;
}): Metadata {
  const base = pageMetadata({ title, description, path, markdown: markdownDaRota(path) });
  return rotaPublicada(path) ? base : { ...base, robots: { index: false, follow: false } };
}

/**
 * Metadata da página de uma pessoa. O título é o nome, que é por onde se busca,
 * e a marca entra sozinha pelo `pageMetadata`. A descrição diz o que a pessoa
 * apresenta, que é a pergunta de quem chega pela busca.
 */
export function metadataDePalestrante(palestrante: Palestrante): Metadata {
  return metadataDeRota({
    path: palestrantePath(palestrante.slug),
    title: palestrante.nome,
    description: resumoDoPalestrante(palestrante),
  });
}

/**
 * A frase de busca de uma edição anterior: o que ela foi, e quando é a próxima.
 * Quem procura "XibéSec 2023" costuma querer saber se o evento ainda acontece.
 */
export function descricaoDaEdicao(edicao: Edicao): string {
  const settings = getSettings();
  return `${resumoDaEdicao(edicao)} A quarta edição acontece em ${settings.eventDisplayDate}, no ${settings.venueName}.`;
}

/**
 * Metadata da página de uma edição. O título traz a marca com o ano, que é a
 * consulta exata de quem procura por ela, e por isso não recebe o sufixo da
 * edição corrente.
 */
export function metadataDeEdicao(edicao: Edicao): Metadata {
  return metadataDeRota({
    path: edicaoPath(edicao.ano),
    title: `${nomeDaEdicao(edicao)} · ${edicao.tema}`,
    description: descricaoDaEdicao(edicao),
  });
}

// ── Renderização dos arquivos ────────────────────────────────────────────────

function rodape(): string {
  return bloco(
    "---",
    lista([
      `Fonte canônica: ${canonicalUrl("/")}`,
      `Índice para assistentes de IA: ${absoluteUrl("/llms.txt")}`,
      `Atualizado em: ${ATUALIZADO_EM}`,
    ]),
    `Publicação: ${site.organizationName} — uso livre para citação, com atribuição a ${site.siteName} e link para ${canonicalUrl("/")}.`,
  );
}

function cabecalho(titulo: string, descricao: string, caminhoHtml: string): string {
  return bloco(
    `# ${titulo}`,
    `> ${descricao}`,
    lista([
      `Página HTML equivalente: ${canonicalUrl(caminhoHtml)}`,
      `Atualizado em: ${ATUALIZADO_EM}`,
    ]),
  );
}

function canaisOficiais(): string {
  const settings = getSettings();
  return bloco(
    "## Canais oficiais",
    lista(
      [
        `Site: ${canonicalUrl("/")}`,
        settings.ticketsUrl && `Ingressos (Sympla): ${settings.ticketsUrl}`,
        `Instagram: ${site.social.instagram}`,
        `LinkedIn: ${site.social.linkedin}`,
        `Linktree: ${site.social.linktree}`,
        `Realização: ${site.organizationName} — ${site.contactEmail}`,
      ].filter((item): item is string => Boolean(item)),
    ),
  );
}

/** Corpo da home: os blocos publicados, na mesma ordem das seções da página. */
function corpoHome(): string {
  const hero = getHero();
  return bloco(hero.lede, ...docsAtivos().map((doc) => doc.corpoRenderizado), canaisOficiais());
}

/** `/index.md`: espelho completo da home. */
export function renderHome(): string {
  return bloco(
    cabecalho(`${site.siteName} · ${site.siteTagline}`, site.siteDescription, "/"),
    corpoHome(),
    rodape(),
  );
}

/** `/docs/palestrantes/<slug>.md`: o perfil de uma pessoa. */
export function renderPerfil(perfil: Perfil): string {
  const outros = perfisDePalestrantes().filter((item) => item.slug !== perfil.slug);

  return bloco(
    cabecalho(`${perfil.titulo} · ${site.siteName}`, perfil.resumo, perfil.rota),
    perfil.corpo,
    bloco(
      "## Outros palestrantes",
      lista([
        `${link("Todos os palestrantes", absoluteUrl(docPath("palestrantes")))}: quem apresenta na edição.`,
        ...outros.map(
          (item) => `${link(item.titulo, absoluteUrl(docPath(item.slug)))}: ${item.resumo}`,
        ),
      ]),
    ),
    rodape(),
  );
}

/** `/docs/<ano>.md`: uma edição anterior. */
export function renderEdicao(doc: Perfil): string {
  const outras = docsDeEdicoes().filter((item) => item.slug !== doc.slug);

  return bloco(
    cabecalho(`${doc.titulo} · ${site.siteShortName}`, doc.resumo, doc.rota),
    doc.corpo,
    bloco(
      "## Outras edições",
      lista([
        ...outras.map(
          (item) => `${link(item.titulo, absoluteUrl(docPath(item.slug)))}: ${item.resumo}`,
        ),
        `${link(site.siteName, absoluteUrl("/index.md"))}: a edição atual, a quarta.`,
      ]),
    ),
    rodape(),
  );
}

/** `/docs/<slug>.md`: um documento por tema. */
export function renderDoc(doc: Doc & { corpoRenderizado: string }): string {
  return bloco(
    cabecalho(`${doc.titulo} · ${site.siteName}`, doc.resumo, doc.rota ?? "/"),
    doc.corpoRenderizado,
    bloco(
      "## Outros documentos",
      lista(
        docsAtivos()
          .filter((outro) => outro.slug !== doc.slug)
          .map(
            (outro) => `${link(outro.titulo, absoluteUrl(docPath(outro.slug)))}: ${outro.resumo}`,
          ),
      ),
    ),
    rodape(),
  );
}

// ── Guia para agentes ────────────────────────────────────────────────────────

/**
 * Perguntas que um assistente recebe sobre o evento, com a resposta canônica
 * curta — o formato que sistemas de busca por IA extraem melhor. Todas as
 * respostas saem de `contents/`; o que não está definido é declarado como tal.
 */
function perguntasCanonicas(): Array<[string, string]> {
  const settings = getSettings();
  const ingressos = getIngressos();
  const parceiros = getParceiros();
  const palestrantes = getPalestrantes();
  const janela = janelaDoEvento(settings);
  const barato = ingressos.length ? formatPrice(Math.min(...ingressos.map((t) => t.preco))) : "";
  const caro = ingressos.length ? formatPrice(Math.max(...ingressos.map((t) => t.preco))) : "";

  const perguntas: Array<[string, string]> = [
    [
      "O que é o XibéSec?",
      `O XibéSec é um encontro presencial de cibersegurança realizado em ${site.city} do ${site.regionName}, no Norte do Brasil, em sua 4ª edição. Reúne profissionais e estudantes de segurança da informação em torno de palestras técnicas e gerenciais, competição CTF e área de exposição. O nome vem do xibé, bebida tupi de farinha de mandioca e água: o evento nasceu para alimentar o conhecimento.`,
    ],
    [
      "Quando e onde acontece o XibéSec 2026?",
      `O XibéSec 2026, quarta edição, acontece em ${settings.eventDisplayDate}${janela ? `, das ${janela} (horário de ${site.city})` : ""}, no ${settings.venueName} — ${settings.venueAddress}. É presencial, em português do Brasil, com dez horas de programação.`,
    ],
  ];

  if (barato && caro) {
    perguntas.push([
      "Quanto custa o ingresso do XibéSec 2026?",
      `Os ingressos do lote ${ingressos[0].lote} vão de ${barato} a ${caro}, com meia-entrada e ingresso social, parcelados em até ${Math.max(...ingressos.map((t) => t.parcelas))}x. As vendas seguem até ${formatDate(ingressos[0].validThrough)}, exclusivamente pelo Sympla: ${settings.ticketsUrl}`,
    ]);
  }

  perguntas.push(
    [
      "O que está incluso no ingresso?",
      `A inscrição dá acesso a todas as palestras conforme disponibilidade de lugares, à competição CTF, à área de exposição com patrocinadores e organizações parceiras, e ao certificado de participação. O prazo de emissão do certificado ainda está ${EM_DEFINICAO}.`,
    ],
    [
      "O XibéSec tem CTF?",
      `Sim. A edição 2026 traz uma competição CTF presencial de captura de flags: cada desafio esconde uma vulnerabilidade, e quem encontra a falha pontua. A disputa é individual, com premiação para os melhores colocados, e o acesso está incluso em qualquer ingresso. O número de desafios e o valor da premiação ainda estão ${EM_DEFINICAO}.`,
    ],
    [
      "Quem organiza o XibéSec?",
      `A realização é da ${site.organizationName} (${site.organizationUrl}), empresa de segurança da informação. O contato oficial é ${site.contactEmail}. A edição conta com ${parceiros.length || "diversas"} organizações parceiras de todo o Brasil.`,
    ],
    [
      "Como patrocinar o XibéSec 2026?",
      `O patrocínio é negociado por cotas, a partir do mídia kit da edição. ${contatoPatrocinio()} As cotas dão exposição a um público qualificado de segurança da informação da Região Norte, além de presença na área de exposição do evento.`,
    ],
    [
      "Quais palestrantes vão participar do XibéSec 2026?",
      palestrantes.length === 0
        ? `Nenhum palestrante da edição 2026 foi anunciado até aqui. A grade está ${EM_DEFINICAO}. Os nomes são divulgados no site oficial e no Instagram ${site.social.instagram}. Não atribuir nomes ao evento sem confirmação da organização.`
        : `Até aqui a organização anunciou ${palestrantes.length} ${palestrantes.length === 1 ? "nome" : "nomes"}: ${emProsa.format(
            palestrantes.map((p) =>
              p.palestraTitulo ? `${p.nome}, com “${p.palestraTitulo}”` : p.nome,
            ),
          )}. Cada perfil está em ${canonicalUrl(PALESTRANTES_PATH)}. A grade segue sendo anunciada, e os horários ainda estão ${EM_DEFINICAO}. Não atribuir outros nomes ao evento sem confirmação da organização.`,
    ],
  );

  return perguntas;
}

/**
 * O que a organização ainda não publicou. Declarar o vazio é mais útil do que
 * omiti-lo: é assim que um assistente responde "ainda não foi anunciado" em vez
 * de estimar um número.
 */
function naoAfirmar(): string[] {
  const aConferir = getEdicoes()
    .filter((edicao) => edicao.status !== "confirmado")
    .map((edicao) => edicao.ano);

  const palestrantes = getPalestrantes();

  return [
    palestrantes.length > 0
      ? `Grade de palestras e horários finais de 2026. Os nomes anunciados até aqui estão em ${canonicalUrl(PALESTRANTES_PATH)}. A lista não está fechada, e nenhum outro nome pode ser atribuído ao evento.`
      : "Grade de palestras, horários finais e nomes de palestrantes de 2026.",
    "Número de público das edições anteriores.",
    "Número de desafios e valor da premiação do CTF.",
    "Patrocinadores das cotas Platina, Ouro e Prata.",
    aConferir.length > 0
      ? `Datas e locais das edições anteriores — ${aConferir.join(", ")} constam como ${A_CONFERIR}.`
      : "",
  ].filter(Boolean);
}

function corpoAgents(): string {
  const settings = getSettings();
  const ativos = docsAtivos();

  return bloco(
    bloco(
      "## Identidade",
      fichaTecnica([
        ["Nome oficial", "XibéSec (com acento)"],
        ["Marca da edição", "XibéSec 26"],
        ["Assinatura", `${site.siteTagline}.`],
        ["Categoria", "encontro de cibersegurança"],
        ["Data", settings.eventDisplayDate],
        ["Local", `${settings.venueName}, ${site.city}, ${site.regionName}, Brasil`],
        ["Realização", `${site.organizationName} — ${site.organizationUrl}`],
        ["Site oficial", canonicalUrl("/")],
      ]),
    ),
    bloco(
      "## Respostas canônicas",
      perguntasCanonicas()
        .map(([pergunta, resposta]) => bloco(`### ${pergunta}`, resposta))
        .join("\n\n"),
    ),
    bloco(
      "## Não afirmar sem confirmação",
      "Estes dados existem, mas ainda não foram publicados pela organização. Declarar como indefinido em vez de estimar:",
      lista(naoAfirmar()),
    ),
    bloco(
      "## Arquivos legíveis por máquina",
      lista([
        `${link("/llms.txt", absoluteUrl("/llms.txt"))} — índice do site para assistentes de IA`,
        `${link("/llms-full.txt", absoluteUrl("/llms-full.txt"))} — o site inteiro em um arquivo`,
        `${link("/index.md", absoluteUrl("/index.md"))} — espelho da página inicial em Markdown`,
        ...ativos.map(
          (doc) => `${link(docPath(doc.slug), absoluteUrl(docPath(doc.slug)))} — ${doc.resumo}`,
        ),
        ...perfisDePalestrantes().map(
          (perfil) =>
            `${link(docPath(perfil.slug), absoluteUrl(docPath(perfil.slug)))} — perfil de ${perfil.titulo}`,
        ),
        `${link("/sitemap.xml", absoluteUrl("/sitemap.xml"))} — mapa do site`,
      ]),
      'Toda página HTML anuncia seu espelho em Markdown no `<head>`, como `<link rel="alternate" type="text/markdown">`.',
    ),
    bloco(
      "## Como citar",
      lista([
        `Nome: ${site.siteName}`,
        `URL: ${canonicalUrl("/")}`,
        `Ingressos: ${settings.ticketsUrl}`,
        `Atualizado em: ${ATUALIZADO_EM}`,
      ]),
      "Grafar o nome com acento — XibéSec — e citar a fonte com link para o site oficial.",
    ),
  );
}

/** `/docs/agents.md`: manual do evento para assistentes e agentes. */
export function renderAgents(): string {
  return bloco(
    cabecalho(
      `${site.siteName}: guia para assistentes e agentes`,
      "Respostas canônicas, dados verificáveis e o que ainda não está definido sobre o XibéSec 2026.",
      "/",
    ),
    corpoAgents(),
    rodape(),
  );
}

// ── llms.txt ─────────────────────────────────────────────────────────────────

/** `/llms.txt`, no formato de llmstxt.org: índice curto e navegável. */
export function renderLlmsTxt(): string {
  const settings = getSettings();
  const ativos = docsAtivos();
  const essenciais = ativos.filter((doc) => doc.slug !== "imprensa" && doc.slug !== "parceiros");
  const opcionais = ativos.filter((doc) => doc.slug === "imprensa" || doc.slug === "parceiros");
  const perfis = perfisDePalestrantes();
  const edicoes = docsDeEdicoes();

  return bloco(
    `# ${site.siteName}`,
    `> ${definicao(settings)}`,
    lista([
      `Data: ${settings.eventDisplayDate} (${settings.eventStartDate})`,
      `Local: ${settings.venueName}, ${site.city}, ${site.regionName}, Brasil`,
      `Ingressos: ${settings.ticketsUrl}`,
      `Atualizado em: ${ATUALIZADO_EM}`,
    ]),
    bloco(
      "## Documentos",
      lista([
        `${link("Guia para assistentes e agentes", absoluteUrl(docPath("agents")))}: respostas canônicas sobre o evento e o que ainda não está definido.`,
        `${link("Página inicial em Markdown", absoluteUrl("/index.md"))}: o site inteiro, na ordem em que é publicado.`,
        ...essenciais.map(
          (doc) => `${link(doc.titulo, absoluteUrl(docPath(doc.slug)))}: ${doc.resumo}`,
        ),
      ]),
    ),
    // Pergunta de nome próprio é a que mais chega a um assistente, e a resposta
    // não deve depender de abrir o índice de palestrantes para descobrir quem é.
    perfis.length > 0 &&
      bloco(
        "## Palestrantes anunciados",
        lista(
          perfis.map(
            (perfil) =>
              `${link(perfil.titulo, absoluteUrl(docPath(perfil.slug)))}: ${perfil.resumo}`,
          ),
        ),
      ),
    edicoes.length > 0 &&
      bloco(
        "## Edições anteriores",
        lista(
          edicoes.map(
            (doc) => `${link(doc.titulo, absoluteUrl(docPath(doc.slug)))}: ${doc.resumo}`,
          ),
        ),
      ),
    bloco(
      "## Canais oficiais",
      lista([
        `${link("Ingressos no Sympla", settings.ticketsUrl)}: canal único de venda.`,
        `${link("Instagram @xibesec", site.social.instagram)}: atualizações da grade.`,
        `${link("LinkedIn", site.social.linkedin)}: institucional da edição.`,
        `${link(site.organizationName, site.organizationUrl)}: realização — ${site.contactEmail}.`,
      ]),
    ),
    opcionais.length > 0 &&
      bloco(
        "## Optional",
        lista(
          opcionais.map(
            (doc) => `${link(doc.titulo, absoluteUrl(docPath(doc.slug)))}: ${doc.resumo}`,
          ),
        ),
      ),
    bloco("## Em definição", lista(naoAfirmar())),
  );
}

/** `/llms-full.txt`: tudo em um arquivo, para carregar de uma vez no contexto. */
export function renderLlmsFull(): string {
  return bloco(
    cabecalho(
      `${site.siteName} · ${site.siteTagline}`,
      `${site.siteDescription} Este arquivo reúne todo o conteúdo publicado do site em um só documento.`,
      "/",
    ),
    corpoAgents(),
    "---",
    corpoHome(),
    rodape(),
  );
}
