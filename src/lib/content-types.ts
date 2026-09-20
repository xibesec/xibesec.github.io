// Tipos de domínio e helpers PUROS: nada aqui pode importar de
// `nextjs-studio/server`, senão um `'use client'` que importe um tipo daqui
// arrasta código de servidor para o bundle do navegador.

export type Settings = {
  eventStartDate: string;
  eventEndDate: string;
  eventDisplayDate: string;
  venueName: string;
  venueAddress: string;
  venueMapUrl: string;
  ticketsUrl: string;
  volunteersDeadline: string;
  cfpDeadline: string;
  nextEditionDate: string;
  nextEditionDisplayDate: string;
  sections: Record<SectionKey, boolean>;
};

export type SectionKey =
  | "fatos"
  | "sobre"
  | "edicoes"
  | "agenda"
  | "ctf"
  | "palestrantes"
  | "ingressos"
  | "participe"
  | "patrocinio"
  | "local"
  | "imprensa"
  | "faq";

export type Sobre = {
  titulo: string;
  texto: string;
  origemTitulo: string;
  origemTexto: string;
};

export type Tom = "orange" | "mint" | "dim";

export type Hero = {
  tituloLinha: string;
  tituloDestaque: string;
  lede: string;
  ctaPrimario: string;
  ctaSecundario: string;
  horario: string;
  lugares: string[];
};

/**
 * Cabeçalho de uma seção. `nota` aceita o token `{link}`, trocado no render pelo
 * link de `notaLinkLabel` + `notaLinkUrl` — assim a frase inteira fica editável
 * no CMS, incluindo o que vem antes e depois do link.
 */
export type Secao = {
  chave: string;
  eyebrow: string;
  eyebrowTom: Tom;
  titulo: string;
  lede: string;
  nota: string;
  notaLinkLabel: string;
  notaLinkUrl: string;
  cta: string;
  ctaUrl: string;
};

export type Destaque = {
  chave: string;
  flag: string;
  eyebrow: string;
  titulo: string;
  texto: string;
};

export type IconeBeneficio = "exposicao" | "ctf" | "palestras" | "certificado";

export type Beneficio = { icone: IconeBeneficio; texto: string; order: number };

export type Chamada = {
  chave: string;
  eyebrow: string;
  eyebrowTom: "orange" | "mint";
  titulo: string;
  texto: string;
  prazoPrefixo: string;
  ctaLabel: string;
  ctaUrl: string;
  ctaVariante: "primary" | "mint";
  order: number;
};

/** Seção de repouso, para o render nunca depender de um registro existir. */
export const SECAO_VAZIA: Secao = {
  chave: "",
  eyebrow: "",
  eyebrowTom: "orange",
  titulo: "",
  lede: "",
  nota: "",
  notaLinkLabel: "",
  notaLinkUrl: "",
  cta: "",
  ctaUrl: "",
};

export type Fato = { valor: string; label: string };

export type NavItem = {
  label: string;
  href: string;
  /** Chave em settings.sections. Vazia = item sempre visível. */
  secao: string;
  grupo: string;
  noMenu: boolean;
};

export type Ingresso = {
  nome: string;
  slug: string;
  lote: number;
  /** Centavos. */
  preco: number;
  parcelas: number;
  validThrough: string;
  ctaUrl: string;
  featured: boolean;
  order: number;
};

export type Trilha = "tecnica" | "gerencial" | "geral" | "ctf";

/** Rótulo da trilha na etiqueta da grade e na tabela do espelho em Markdown. */
export const TRILHA_LABEL: Record<Trilha, string> = {
  tecnica: "Técnica",
  gerencial: "Gerencial",
  geral: "Geral",
  ctf: "CTF",
};

export type AgendaItem = {
  titulo: string;
  slug: string;
  /** Nome de quem palestra, ou a composição do painel. */
  palestrante: string;
  /** Preenchido só quando a pessoa tem perfil publicado. */
  speakerSlug: string;
  descricao: string;
  startsAt: string;
  endsAt: string;
  trilha: Trilha;
  tipo: string;
  status: "confirmado" | "em-definicao";
  order: number;
};

/** As duas salas que correm em paralelo. A ordem é a das colunas da grade. */
export const TRILHAS_EM_PARALELO = ["tecnica", "gerencial"] as const;

/**
 * Uma faixa de horário da grade: o que está em cada sala naquele momento, mais
 * a atividade comum às duas. Credenciamento e pausa ocupam a faixa inteira.
 */
export type FaixaDaGrade = {
  startsAt: string;
  comum: AgendaItem | null;
  tecnica: AgendaItem | null;
  gerencial: AgendaItem | null;
  /** A única sala ocupada na faixa. Governa o filtro por aba no celular. */
  unica: "tecnica" | "gerencial" | null;
};

/**
 * A agenda linear vira faixas de horário. É o que permite desenhar as duas
 * salas lado a lado sem repetir a hora, e o que diz, no celular, quais faixas
 * somem quando a pessoa escolhe uma trilha.
 */
export function faixasDaGrade(agenda: AgendaItem[]): FaixaDaGrade[] {
  const faixas = new Map<string, FaixaDaGrade>();

  for (const item of agenda) {
    if (!item.startsAt) continue;

    const faixa = faixas.get(item.startsAt) ?? {
      startsAt: item.startsAt,
      comum: null,
      tecnica: null,
      gerencial: null,
      unica: null,
    };

    if (item.trilha === "tecnica" || item.trilha === "gerencial") faixa[item.trilha] = item;
    else faixa.comum = item;

    faixas.set(item.startsAt, faixa);
  }

  return [...faixas.values()].map((faixa) => ({
    ...faixa,
    unica:
      faixa.comum || (faixa.tecnica && faixa.gerencial)
        ? null
        : faixa.tecnica
          ? "tecnica"
          : faixa.gerencial
            ? "gerencial"
            : null,
  }));
}

export type Edicao = {
  ano: number;
  tema: string;
  local: string;
  endereco: string;
  /** ISO com offset, como na agenda: string livre não ordena nem calcula duração. */
  startsAt: string;
  endsAt: string;
  publico: number | null;
  resumo: string;
  /** Registro da edição. Vazio enquanto a organização não entrega. */
  foto: string;
  albumUrl: string;
  status: "confirmado" | "a-conferir";
};

/**
 * A edição tem página própria? Sem resumo escrito, sobram ano e foto, e três
 * endereços rasos indexados valem menos que nenhum.
 */
export function edicaoPublicavel(edicao: Edicao): boolean {
  return edicao.resumo.trim() !== "";
}

export type TerminalKind = "cmd" | "ok" | "warn" | "plain";

export type Ctf = {
  titulo: string;
  texto: string;
  formato: string;
  incluso: string;
  linhas: Array<{ kind: TerminalKind; texto: string }>;
};

export type Cota = {
  nome: string;
  label: string;
  disponivel: boolean;
  /** Apoio não é cota vendida, e a vitrine exibe a marca em escala reduzida. */
  apoio: boolean;
  order: number;
};

export type EscalaDaMarca = "principal" | "destaque" | "padrao" | "reduzida";

/**
 * A hierarquia da cota é o tamanho da marca na vitrine: quem comprou a cota
 * mais alta aparece maior, e apoio aparece menor que qualquer patrocinador.
 * Sem isso, duas cotas na mesma escala anunciam contrapartidas iguais.
 */
const ESCALA_POR_COTA: Record<string, EscalaDaMarca> = {
  platina: "principal",
  ouro: "destaque",
  prata: "padrao",
  bronze: "padrao",
};

export function escalaDaCota(cota: Cota): EscalaDaMarca {
  if (cota.apoio) return "reduzida";
  return ESCALA_POR_COTA[cota.nome] ?? "padrao";
}

export type Patrocinador = {
  nome: string;
  slug: string;
  logo: string;
  url: string;
  cota: string;
  order: number;
};

export type TipoImprensa =
  "materia" | "analise" | "entrevista" | "release" | "agenda" | "institucional";

export type Materia = {
  veiculo: string;
  slug: string;
  titulo: string;
  url: string;
  data: string;
  tipo: TipoImprensa;
  trecho: string;
  logo: string;
  order: number;
};

export type Duvida = { pergunta: string; resposta: string; order: number };

export type Organizacao = { nome: string; papel: string; url: string; logo: string };

export type Palestrante = {
  nome: string;
  slug: string;
  cargo: string;
  empresa: string;
  cidade: string;
  resumo: string;
  experiencia: string;
  palestraTitulo: string;
  palestraResumo: string;
  temas: string[];
  certificacoes: string[];
  /** Eventos em que já palestrou, como a própria pessoa declarou. */
  palcos: string[];
  linkedin: string;
  github: string;
  twitter: string;
  site: string;
  /** Bio longa: o corpo do `.mdx`, em parágrafos separados por linha em branco. */
  bio: string;
  destaque: boolean;
  order: number;
};

/** Cargo e organização na mesma linha, sem separador sobrando quando falta um. */
export function credencial(palestrante: Palestrante): string {
  return [palestrante.cargo, palestrante.empresa].filter(Boolean).join(" · ");
}

/** Texto longo do CMS em parágrafos. Linha em branco separa, como se escreve. */
export function paragrafos(texto: string): string[] {
  return texto
    .split(/\n{2,}/)
    .map((paragrafo) => paragrafo.trim())
    .filter(Boolean);
}

// ── Quiz ─────────────────────────────────────────────────────────────────────

export type QuizCopy = {
  eyebrow: string;
  titulo: string;
  lede: string;
  nomeLabel: string;
  nomePlaceholder: string;
  nomeAjuda: string;
  ctaComecar: string;
  ctaVoltar: string;
  ctaRefazer: string;
  progressoPrefixo: string;
  resultadoEyebrow: string;
  resultadoTimeLabel: string;
  resultadoCorLabel: string;
  resultadoAreaLabel: string;
  resultadoFerramentaLabel: string;
  resultadoSiglaLabel: string;
  resultadoRaridadeLabel: string;
  cartaLabel: string;
  cartaRodapeEsquerda: string;
  cartaRodapeDireita: string;
  fotoTrocar: string;
  verVerso: string;
  verFrente: string;
  fotoRemover: string;
  fotoAjuda: string;
  fotoAjustando: string;
  zoomLabel: string;
  recorteLabel: string;
  recorteBaixando: string;
  recorteProcessando: string;
  baixar: string;
  compartilhar: string;
  desafiar: string;
  desafiarCopiado: string;
  desafioTexto: string;
  compartilharTexto: string;
  gerando: string;
  erroExportar: string;
  avisoSafariTitulo: string;
  avisoSafariTexto: string;
  semJsTitulo: string;
  semJsTexto: string;
  indiceTitulo: string;
  indiceLede: string;
  ctaEvento: string;
  fechoTitulo: string;
  fechoTexto: string;
};

/** Mapa slug do arquétipo → peso. Uma alternativa pontua para mais de um. */
export type Pesos = Record<string, number>;

export type Alternativa = { chave: string; texto: string; pesos: Pesos };

export type Pergunta = {
  chave: string;
  enunciado: string;
  alternativas: Alternativa[];
  order: number;
};

/** Roda de cores dos times de cibersegurança. */
export type TimeCor = "red" | "blue" | "purple" | "yellow" | "orange" | "white";

export type Arquetipo = {
  slug: string;
  nome: string;
  sigla: string;
  /** Time na roda de cores: "Red Team", "Blue Team"… */
  time: string;
  timeCor: TimeCor;
  /** Nome da cor em português, para leitura. */
  timeCorNome: string;
  timePapel: string;
  area: string;
  /** Ferramenta que identifica o arquétipo à primeira vista. */
  ferramenta: string;
  trilha: Trilha;
  /**
   * Fatia declarada no conteúdo, não medida: o site é estático e não conta
   * resposta. É rótulo editorial de raridade, no espírito da carta de futebol.
   */
  raridade: string;
  raridadeLabel: string;
  resumo: string;
  texto: string;
  noEvento: string;
  order: number;
};

export type Quiz = {
  copy: QuizCopy;
  perguntas: Pergunta[];
  arquetipos: Arquetipo[];
};

export type Privacidade = {
  titulo: string;
  atualizadoEm: string;
  lede: string;
  destaque: { titulo: string; texto: string };
  blocos: Array<{ titulo: string; texto: string }>;
  oposicao: {
    titulo: string;
    texto: string;
    botaoDesligar: string;
    botaoLigar: string;
    estadoDesligado: string;
  };
};

/**
 * Soma os pesos das respostas e devolve o arquétipo vencedor.
 *
 * Determinístico de propósito: empate resolve pela `order` declarada no
 * conteúdo, nunca por sorteio. As mesmas respostas precisam devolver sempre a
 * mesma carta — a pessoa pode refazer o quiz e comparar com quem estava do lado.
 *
 * `respostas` é indexado por `pergunta.chave` e guarda a `alternativa.chave`.
 */
export function apurar(
  respostas: Record<string, string>,
  perguntas: Pergunta[],
  arquetipos: Arquetipo[],
): Arquetipo | null {
  if (arquetipos.length === 0) return null;

  const total = new Map<string, number>();

  for (const pergunta of perguntas) {
    const escolha = respostas[pergunta.chave];
    const alternativa = pergunta.alternativas.find((item) => item.chave === escolha);
    if (!alternativa) continue;

    for (const [slug, peso] of Object.entries(alternativa.pesos)) {
      total.set(slug, (total.get(slug) ?? 0) + peso);
    }
  }

  const ordenado = [...arquetipos].sort((a, b) => {
    const diff = (total.get(b.slug) ?? 0) - (total.get(a.slug) ?? 0);
    return diff !== 0 ? diff : a.order - b.order;
  });

  return ordenado[0] ?? null;
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Preço em centavos → texto. Formatar é do render, o dado continua número. */
export function formatPrice(cents: number): string {
  return brl.format(cents / 100);
}

/** "2026-08-10T23:59:00-03:00" → "10/08/2026". */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Belem" }).format(date);
}

const horaBelem = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Belem",
  hour: "2-digit",
  minute: "2-digit",
});

/** "2026-09-19T09:00:00-03:00" → "09h"; com minuto quebrado, "09h30". */
export function formatHour(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const [hora, minuto] = horaBelem.format(date).split(":");
  return minuto === "00" ? `${hora}h` : `${hora}h${minuto}`;
}

/** Menor preço da lista, em centavos. Alimenta a barra de lote e o dock. */
export function lowestPrice(ingressos: Ingresso[]): number | null {
  if (ingressos.length === 0) return null;
  return Math.min(...ingressos.map((ticket) => ticket.preco));
}

/**
 * A matéria que abre a seção de imprensa: a análise de especialista pesa mais
 * que release. A home e a rota `/press` publicam a mesma citação, e escolhida
 * em cada lugar ela divergiria assim que a lista mudasse.
 */
export function destaqueDaImprensa(materias: Materia[]): Materia | undefined {
  return materias.find((materia) => materia.tipo === "analise" && materia.trecho) ?? materias[0];
}
