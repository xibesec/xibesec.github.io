import type { StudioConfig } from "nextjs-studio";

// Atalho para literais de select/multi-select.
const opt = (value: string, label = value) => ({ label, value });

const trilhas = [
  opt("tecnica", "Técnica"),
  opt("gerencial", "Gerencial"),
  opt("geral", "Geral"),
  opt("ctf", "CTF"),
];

// Apoio não é cota vendida: entra na mesma lista porque o render agrupa a
// seção clara por esse campo, e o `label` é que diz ao leitor o que a marca é.
const cotas = [
  opt("platina", "Platina"),
  opt("ouro", "Ouro"),
  opt("prata", "Prata"),
  opt("bronze", "Bronze"),
  opt("apoio", "Apoio"),
];

const config: StudioConfig = {
  collections: {
    // ── Configuração do site (singleton) ─────────────────────────────────
    // Identidade, datas, local e as chaves que ligam/desligam cada seção.
    settings: {
      schema: {
        collection: "settings",
        label: "Configuração do site",
        fields: [
          {
            name: "eventStartDate",
            type: "date",
            includeTime: true,
            required: true,
            label: "Início do evento",
          },
          {
            name: "eventEndDate",
            type: "date",
            includeTime: true,
            required: true,
            label: "Fim do evento",
          },
          { name: "eventDisplayDate", type: "text", required: true, label: "Data por extenso" },
          { name: "venueName", type: "text", required: true, label: "Local" },
          { name: "venueAddress", type: "text", required: true, label: "Endereço" },
          { name: "venueMapUrl", type: "url", label: "Link do mapa" },
          { name: "ticketsUrl", type: "url", required: true, label: "Link de venda (Sympla)" },
          { name: "volunteersDeadline", type: "date", label: "Prazo de voluntários" },
          { name: "cfpDeadline", type: "date", label: "Prazo do CFP" },
          {
            name: "sections",
            type: "object",
            label: "Seções visíveis",
            description: "Liga e desliga cada seção sem tocar em código.",
            fields: [
              { name: "fatos", type: "boolean", label: "Faixa de fatos" },
              { name: "sobre", type: "boolean", label: "Sobre o evento" },
              { name: "edicoes", type: "boolean", label: "Edições anteriores" },
              { name: "agenda", type: "boolean", label: "Programação" },
              { name: "ctf", type: "boolean", label: "CTF" },
              { name: "palestrantes", type: "boolean", label: "Palestrantes" },
              { name: "ingressos", type: "boolean", label: "Ingressos" },
              { name: "participe", type: "boolean", label: "Participe" },
              { name: "patrocinio", type: "boolean", label: "Patrocínio" },
              { name: "local", type: "boolean", label: "Local" },
              { name: "faq", type: "boolean", label: "Dúvidas" },
            ],
          },
        ],
      },
    },

    // ── Hero (singleton) ─────────────────────────────────────────────────
    hero: {
      schema: {
        collection: "hero",
        label: "Hero",
        fields: [
          { name: "tituloLinha", type: "text", required: true, label: "Título — primeira linha" },
          {
            name: "tituloDestaque",
            type: "text",
            required: true,
            label: "Título — segunda linha (laranja)",
          },
          { name: "lede", type: "long-text", required: true, rows: 3, label: "Texto de apoio" },
          { name: "ctaPrimario", type: "text", required: true, label: "Botão primário" },
          { name: "ctaSecundario", type: "text", label: "Botão secundário" },
          { name: "horario", type: "text", label: "Horário por extenso" },
          {
            name: "lugares",
            type: "array",
            label: "Lugar (separado por ·)",
            itemFields: [{ name: "nome", type: "text", required: true, label: "Nome" }],
          },
        ],
      },
    },

    // ── Cabeçalho das seções ─────────────────────────────────────────────
    // Um registro por seção da home. `chave` casa com o id da âncora.
    // O token {link} no campo `nota` é trocado pelo link no render.
    secoes: {
      schema: {
        collection: "secoes",
        label: "Cabeçalho das seções",
        fields: [
          { name: "chave", type: "text", required: true, label: "Chave (id da seção)" },
          { name: "eyebrow", type: "text", label: "Rótulo" },
          {
            name: "eyebrowTom",
            type: "select",
            label: "Cor do rótulo",
            options: [
              { label: "Laranja", value: "orange" },
              { label: "Menta", value: "mint" },
              { label: "Apagado", value: "dim" },
            ],
          },
          { name: "titulo", type: "text", label: "Título" },
          { name: "lede", type: "long-text", rows: 3, label: "Texto de apoio" },
          { name: "nota", type: "long-text", rows: 2, label: "Observação (use {link})" },
          { name: "notaLinkLabel", type: "text", label: "Rótulo do link da observação" },
          { name: "notaLinkUrl", type: "text", label: "Destino do link da observação" },
          { name: "cta", type: "text", label: "Botão" },
          {
            name: "ctaUrl",
            type: "url",
            label: "Destino do botão",
            description: "Sem destino, o botão não aparece.",
          },
        ],
      },
    },

    // ── Blocos de destaque ───────────────────────────────────────────────
    destaques: {
      schema: {
        collection: "destaques",
        label: "Blocos de destaque",
        fields: [
          { name: "chave", type: "text", required: true, label: "Chave" },
          { name: "flag", type: "text", label: "Selo" },
          { name: "eyebrow", type: "text", label: "Rótulo" },
          { name: "titulo", type: "text", required: true, label: "Título" },
          { name: "texto", type: "long-text", required: true, rows: 4, label: "Texto" },
        ],
      },
    },

    // ── O que a inscrição dá direito ─────────────────────────────────────
    beneficios: {
      schema: {
        collection: "beneficios",
        label: "Direitos da inscrição",
        fields: [
          { name: "texto", type: "text", required: true, label: "Texto" },
          {
            name: "icone",
            type: "select",
            required: true,
            label: "Ícone",
            options: [
              { label: "Área de exposição", value: "exposicao" },
              { label: "Bandeira (CTF)", value: "ctf" },
              { label: "Microfone (palestras)", value: "palestras" },
              { label: "Certificado", value: "certificado" },
            ],
          },
          { name: "order", type: "number", format: "integer", label: "Ordem" },
        ],
      },
    },

    // ── Chamadas abertas ─────────────────────────────────────────────────
    chamadas: {
      schema: {
        collection: "chamadas",
        label: "Chamadas abertas",
        fields: [
          { name: "chave", type: "text", required: true, label: "Chave" },
          { name: "eyebrow", type: "text", required: true, label: "Rótulo" },
          {
            name: "eyebrowTom",
            type: "select",
            label: "Cor do rótulo",
            options: [
              { label: "Laranja", value: "orange" },
              { label: "Menta", value: "mint" },
            ],
          },
          { name: "titulo", type: "text", required: true, label: "Título" },
          { name: "texto", type: "long-text", required: true, rows: 3, label: "Texto" },
          { name: "prazoPrefixo", type: "text", label: "Prefixo do prazo" },
          { name: "ctaLabel", type: "text", required: true, label: "Botão" },
          { name: "ctaUrl", type: "url", required: true, label: "Destino do botão" },
          {
            name: "ctaVariante",
            type: "select",
            label: "Variante do botão",
            options: [
              { label: "Primária", value: "primary" },
              { label: "Menta", value: "mint" },
            ],
          },
          { name: "order", type: "number", format: "integer", label: "Ordem" },
        ],
      },
    },

    // ── Sobre o evento (singleton) ───────────────────────────────────────
    sobre: {
      schema: {
        collection: "sobre",
        label: "Sobre o evento",
        fields: [
          { name: "titulo", type: "text", label: "Título" },
          { name: "texto", type: "long-text", rows: 4, label: "Texto" },
          { name: "origemTitulo", type: "text", label: "Título da origem do nome" },
          { name: "origemTexto", type: "long-text", rows: 4, label: "Origem do nome (Xibé)" },
          {
            name: "pilares",
            type: "array",
            label: "Pilares",
            itemFields: [
              { name: "titulo", type: "text", required: true, label: "Título" },
              { name: "texto", type: "long-text", required: true, rows: 2, label: "Texto" },
            ],
          },
        ],
      },
    },

    // ── Fatos verificáveis (lista) ───────────────────────────────────────
    // Faixa `.strip`: número em mono laranja + rótulo.
    fatos: {
      schema: {
        collection: "fatos",
        label: "Fatos",
        fields: [
          { name: "valor", type: "text", required: true, label: "Valor" },
          { name: "label", type: "text", required: true, label: "Rótulo" },
        ],
      },
    },

    // ── Navegação (lista) ────────────────────────────────────────────────
    // Fonte única do menu, do rodapé e do <nav> para crawlers.
    navegacao: {
      schema: {
        collection: "navegacao",
        label: "Navegação",
        fields: [
          { name: "label", type: "text", required: true, label: "Rótulo" },
          { name: "href", type: "text", required: true, label: "Destino" },
          {
            name: "grupo",
            type: "select",
            label: "Grupo no rodapé",
            options: [opt("evento", "Evento"), opt("participar", "Participar")],
          },
          {
            name: "secao",
            type: "text",
            label: "Seção correspondente",
            description:
              "Chave em Configuração → Seções visíveis. Com a seção desligada, o item some do menu.",
          },
          { name: "noMenu", type: "boolean", label: "Esconder do menu principal" },
        ],
      },
    },

    // ── Ingressos ────────────────────────────────────────────────────────
    // Preço em CENTAVOS. Nunca string formatada: precisa somar e alimentar Offer.
    ingressos: {
      schema: {
        collection: "ingressos",
        label: "Ingressos",
        fields: [
          { name: "nome", type: "text", required: true, label: "Nome" },
          { name: "slug", type: "slug", from: "nome", required: true },
          { name: "lote", type: "number", format: "integer", required: true, label: "Lote" },
          {
            name: "preco",
            type: "number",
            format: "integer",
            required: true,
            label: "Preço (centavos)",
          },
          { name: "parcelas", type: "number", format: "integer", label: "Parcelas" },
          { name: "descricao", type: "long-text", rows: 2, label: "Descrição" },
          {
            name: "validThrough",
            type: "date",
            includeTime: true,
            required: true,
            label: "Válido até",
          },
          { name: "ctaUrl", type: "url", label: "Link de compra" },
          { name: "featured", type: "boolean", label: "Caminho primário" },
          { name: "order", type: "number", format: "integer", label: "Ordem" },
        ],
      },
    },

    // ── Programação ──────────────────────────────────────────────────────
    // Horário em ISO, nunca "10:35 - 11:00": precisa ordenar, calcular duração e gerar .ics.
    // `slug` vazio = item de grade sem página de detalhe (intervalo, credenciamento).
    agenda: {
      schema: {
        collection: "agenda",
        label: "Programação",
        fields: [
          {
            name: "titulo",
            type: "text",
            label: "Título",
            description: "Vazio na palestra cujo tema a pessoa ainda não enviou.",
          },
          { name: "slug", type: "text", label: "Slug (vazio = sem página)" },
          {
            name: "palestrante",
            type: "text",
            label: "Quem apresenta",
            description: "Nome de quem palestra, ou a composição do painel.",
          },
          { name: "descricao", type: "long-text", rows: 3, label: "Descrição" },
          { name: "startsAt", type: "date", includeTime: true, required: true, label: "Começa" },
          { name: "endsAt", type: "date", includeTime: true, required: true, label: "Termina" },
          { name: "trilha", type: "select", required: true, label: "Trilha", options: trilhas },
          {
            name: "tipo",
            type: "select",
            required: true,
            label: "Tipo",
            options: [
              opt("palestra", "Palestra"),
              opt("painel", "Painel"),
              opt("keynote", "Keynote"),
              opt("intervalo", "Intervalo"),
              opt("operacional", "Operacional"),
              opt("ctf", "CTF"),
            ],
          },
          {
            name: "speakerSlug",
            type: "relation",
            collection: "palestrantes",
            label: "Palestrante",
          },
          {
            name: "status",
            type: "select",
            label: "Situação",
            options: [opt("confirmado", "Confirmado"), opt("em-definicao", "Em definição")],
          },
          { name: "order", type: "number", format: "integer", label: "Ordem" },
        ],
      },
    },

    // ── Palestrantes ─────────────────────────────────────────────────────
    // Corpo MDX = bio longa. Um arquivo por pessoa: o `slug` do frontmatter é a
    // rota `/palestrantes/<slug>`, e mudá-lo depois de indexado quebra a URL.
    //
    // Não há campo de foto: a edição não publica retrato de palestrante, e um
    // campo sem consumidor no render é convite a preencher o que não aparece.
    //
    // `temas`, `certificacoes` e `palcos` não são enfeite de ficha: viram
    // `knowsAbout`, `hasCredential` e a prova de repertório do `Person` no
    // JSON-LD, que é o que um buscador lê para saber sobre o que a pessoa fala.
    palestrantes: {
      schema: {
        collection: "palestrantes",
        label: "Palestrantes",
        fields: [
          { name: "nome", type: "text", required: true, label: "Nome" },
          { name: "slug", type: "slug", from: "nome", required: true },
          { name: "cargo", type: "text", label: "Cargo" },
          { name: "empresa", type: "text", label: "Empresa" },
          { name: "cidade", type: "text", label: "Cidade" },
          { name: "resumo", type: "text", label: "Resumo (uma frase)" },
          {
            name: "experiencia",
            type: "text",
            label: "Experiência",
            description: "Como a organização anunciou. Não arredondar nem estimar.",
          },
          { name: "palestraTitulo", type: "text", label: "Título da palestra" },
          {
            name: "palestraResumo",
            type: "long-text",
            rows: 5,
            label: "Sobre a palestra",
            description: "Um parágrafo por linha em branco.",
          },
          {
            name: "temas",
            type: "array",
            label: "Temas",
            itemFields: [{ name: "tema", type: "text", required: true, label: "Tema" }],
          },
          {
            name: "certificacoes",
            type: "array",
            label: "Certificações",
            itemFields: [{ name: "sigla", type: "text", required: true, label: "Sigla" }],
          },
          {
            name: "palcos",
            type: "array",
            label: "Já palestrou em",
            description: "Só evento que a pessoa declarou. É prova de repertório, não vitrine.",
            itemFields: [{ name: "nome", type: "text", required: true, label: "Evento" }],
          },
          { name: "linkedin", type: "url", label: "LinkedIn" },
          { name: "github", type: "url", label: "GitHub" },
          { name: "twitter", type: "url", label: "Twitter / X" },
          { name: "site", type: "url", label: "Site" },
          { name: "destaque", type: "boolean", label: "Destaque" },
          { name: "order", type: "number", format: "integer", label: "Ordem" },
        ],
      },
    },

    // ── Cotas de patrocínio ──────────────────────────────────────────────
    cotas: {
      schema: {
        collection: "cotas",
        label: "Cotas de patrocínio",
        fields: [
          { name: "nome", type: "select", required: true, label: "Cota", options: cotas },
          { name: "label", type: "text", required: true, label: "Rótulo" },
          { name: "preco", type: "number", format: "integer", label: "Preço (centavos)" },
          {
            name: "beneficios",
            type: "array",
            label: "Benefícios",
            itemFields: [{ name: "item", type: "text", required: true, label: "Benefício" }],
          },
          { name: "featured", type: "boolean", label: "Destaque" },
          {
            name: "disponivel",
            type: "boolean",
            label: "Disponível",
            description: "A página não anuncia cota vaga sem aval — ver PRODUCT.md.",
          },
          {
            name: "apoio",
            type: "boolean",
            label: "Apoio (não é cota vendida)",
            description: "A marca aparece em escala reduzida: contrapartida não é patrocínio.",
          },
          { name: "order", type: "number", format: "integer", label: "Ordem" },
        ],
      },
    },

    // ── Patrocinadores confirmados ───────────────────────────────────────
    patrocinadores: {
      mediaDir: "public/images/patrocinadores",
      schema: {
        collection: "patrocinadores",
        label: "Patrocinadores",
        fields: [
          { name: "nome", type: "text", required: true, label: "Nome" },
          { name: "slug", type: "slug", from: "nome", required: true },
          { name: "logo", type: "media", accept: ["image/*"], label: "Logo" },
          { name: "url", type: "url", label: "Site" },
          { name: "cota", type: "select", required: true, label: "Cota", options: cotas },
          { name: "order", type: "number", format: "integer", label: "Ordem" },
        ],
      },
    },

    // ── Na imprensa ──────────────────────────────────────────────────────
    // Clipping. Só entra registro com URL que abre: prova social é a última
    // coisa que pode ser afirmada sem fonte.
    imprensa: {
      mediaDir: "public/images/imprensa",
      schema: {
        collection: "imprensa",
        label: "Na imprensa",
        fields: [
          { name: "veiculo", type: "text", required: true, label: "Veículo" },
          { name: "slug", type: "slug", from: "veiculo", required: true },
          { name: "titulo", type: "text", required: true, label: "Título da matéria" },
          { name: "url", type: "url", required: true, label: "Link da matéria" },
          { name: "data", type: "date", label: "Publicada em" },
          {
            name: "tipo",
            type: "select",
            required: true,
            label: "Natureza",
            description: "Matéria jornalística pesa diferente de agenda ou release. Seja honesto.",
            options: [
              opt("materia", "Matéria jornalística"),
              opt("analise", "Análise de especialista"),
              opt("entrevista", "Entrevista"),
              opt("release", "Release republicado"),
              opt("agenda", "Agenda de eventos"),
              opt("institucional", "Nota institucional"),
            ],
          },
          { name: "trecho", type: "long-text", rows: 2, label: "Trecho citado" },
          { name: "logo", type: "media", accept: ["image/*"], label: "Logo do veículo" },
          { name: "order", type: "number", format: "integer", label: "Ordem" },
        ],
      },
    },

    // ── Edições anteriores ───────────────────────────────────────────────
    // `publico` nasce nulo e é assim que deve ficar até o cliente entregar o
    // número contado. O ano é o endereço da página: `/2023` sai daqui, e é o
    // `resumo` preenchido que a publica.
    edicoes: {
      mediaDir: "public/images/edicoes",
      schema: {
        collection: "edicoes",
        label: "Edições anteriores",
        fields: [
          { name: "ano", type: "number", format: "integer", required: true, label: "Ano" },
          { name: "tema", type: "text", label: "Tema" },
          { name: "local", type: "text", label: "Local" },
          { name: "endereco", type: "text", label: "Endereço" },
          {
            name: "startsAt",
            type: "text",
            label: "Início (ISO 8601 com fuso)",
            description: "2023-11-18T09:00:00-03:00. Data solta não ordena nem calcula duração.",
          },
          { name: "endsAt", type: "text", label: "Fim (ISO 8601 com fuso)" },
          { name: "publico", type: "number", format: "integer", label: "Público (não estimar)" },
          {
            name: "resumo",
            type: "long-text",
            rows: 4,
            label: "Resumo",
            description: "Um parágrafo por linha em branco. Vazio, a página da edição não publica.",
          },
          { name: "foto", type: "media", accept: ["image/*"], label: "Foto da edição" },
          { name: "albumUrl", type: "url", label: "Álbum de fotos" },
          {
            name: "status",
            type: "select",
            required: true,
            label: "Situação",
            options: [opt("confirmado", "Confirmado"), opt("a-conferir", "A conferir")],
          },
        ],
      },
    },

    // ── CTF (singleton) ──────────────────────────────────────────────────
    ctf: {
      schema: {
        collection: "ctf",
        label: "CTF",
        fields: [
          { name: "titulo", type: "text", label: "Título" },
          { name: "texto", type: "long-text", rows: 4, label: "Texto" },
          { name: "formato", type: "text", label: "Formato" },
          { name: "premiacao", type: "text", label: "Premiação" },
          { name: "incluso", type: "text", label: "Aviso de acesso incluso" },
          {
            name: "linhas",
            type: "array",
            label: "Linhas do terminal",
            itemFields: [{ name: "texto", type: "text", required: true, label: "Linha" }],
          },
        ],
      },
    },

    // ── Dúvidas frequentes ───────────────────────────────────────────────
    // Resposta no campo, não no corpo: alimenta o accordion e o FAQPage do JSON-LD.
    faq: {
      schema: {
        collection: "faq",
        label: "Dúvidas frequentes",
        fields: [
          { name: "pergunta", type: "text", required: true, label: "Pergunta" },
          { name: "resposta", type: "long-text", required: true, rows: 3, label: "Resposta" },
          { name: "order", type: "number", format: "integer", label: "Ordem" },
        ],
      },
    },

    // ── Realização ───────────────────────────────────────────────────────
    equipe: {
      mediaDir: "public/images/equipe",
      schema: {
        collection: "equipe",
        label: "Realização",
        fields: [
          { name: "nome", type: "text", required: true, label: "Nome" },
          { name: "slug", type: "slug", from: "nome", required: true },
          { name: "papel", type: "text", label: "Papel" },
          { name: "url", type: "url", label: "Site" },
          { name: "logo", type: "media", accept: ["image/*"], label: "Logo" },
          { name: "order", type: "number", format: "integer", label: "Ordem" },
        ],
      },
    },

    // ── Código de conduta (MDX único) ────────────────────────────────────
    "codigo-de-conduta": {
      schema: {
        collection: "codigo-de-conduta",
        label: "Código de conduta",
        fields: [
          { name: "titulo", type: "text", required: true, label: "Título" },
          { name: "updatedAt", type: "date", required: true, label: "Atualizado em" },
        ],
      },
    },

    // ── Quiz "Que tipo de hacker você é" ─────────────────────────────────
    // Peça de divulgação em /quiz. A copy da rota, as perguntas e os
    // arquétipos são conteúdo: trocar uma pergunta não é PR de código.
    quiz: {
      schema: {
        collection: "quiz",
        label: "Quiz — copy da página",
        fields: [
          { name: "eyebrow", type: "text", label: "Rótulo" },
          { name: "titulo", type: "text", required: true, label: "Título" },
          { name: "lede", type: "long-text", rows: 3, label: "Texto de apoio" },
          { name: "nomeLabel", type: "text", label: "Rótulo do campo de nome" },
          { name: "nomePlaceholder", type: "text", label: "Exemplo no campo de nome" },
          { name: "nomeAjuda", type: "long-text", rows: 2, label: "Ajuda do campo de nome" },
          { name: "ctaComecar", type: "text", label: "Botão — começar" },
          { name: "ctaVoltar", type: "text", label: "Botão — voltar" },
          { name: "ctaRefazer", type: "text", label: "Botão — refazer" },
          { name: "progressoPrefixo", type: "text", label: "Prefixo do progresso" },
          { name: "resultadoEyebrow", type: "text", label: "Rótulo do resultado" },
          { name: "resultadoTimeLabel", type: "text", label: "Rótulo da atuação" },
          { name: "resultadoCorLabel", type: "text", label: "Rótulo da cor do time" },
          { name: "resultadoAreaLabel", type: "text", label: "Rótulo da área" },
          { name: "resultadoFerramentaLabel", type: "text", label: "Rótulo da ferramenta" },
          { name: "resultadoSiglaLabel", type: "text", label: "Rótulo da sigla" },
          { name: "resultadoRaridadeLabel", type: "text", label: "Rótulo da raridade" },
          { name: "cartaLabel", type: "text", label: "Rótulo impresso na carta" },
          { name: "cartaRodapeEsquerda", type: "text", label: "Carta — rodapé à esquerda" },
          { name: "cartaRodapeDireita", type: "text", label: "Carta — rodapé à direita" },
          { name: "fotoTrocar", type: "text", label: "Botão — trocar foto" },
          { name: "verVerso", type: "text", label: "Botão — ver o verso" },
          { name: "verFrente", type: "text", label: "Botão — ver a frente" },
          { name: "fotoRemover", type: "text", label: "Botão — voltar ao mascote" },
          { name: "fotoAjuda", type: "long-text", rows: 2, label: "Ajuda do enquadramento" },
          { name: "fotoAjustando", type: "text", label: "Enquadramento — modo ativo" },
          { name: "zoomLabel", type: "text", label: "Rótulo do zoom" },
          { name: "recorteLabel", type: "text", label: "Recorte de fundo — rótulo" },
          { name: "recorteBaixando", type: "text", label: "Recorte de fundo — baixando" },
          { name: "recorteProcessando", type: "text", label: "Recorte de fundo — processando" },
          { name: "baixar", type: "text", label: "Botão — baixar" },
          { name: "compartilhar", type: "text", label: "Botão — compartilhar" },
          { name: "desafiar", type: "text", label: "Botão — desafiar" },
          { name: "desafiarCopiado", type: "text", label: "Desafio — confirmação" },
          {
            name: "desafioTexto",
            type: "text",
            label: "Desafio — texto ({arquetipo}, {raridade}, {url})",
          },
          {
            name: "compartilharTexto",
            type: "text",
            label: "Compartilhar — texto ({resumo}, {arquetipo}, {url})",
          },
          { name: "gerando", type: "text", label: "Estado — gerando imagem" },
          { name: "erroExportar", type: "text", label: "Erro ao gerar imagem" },
          { name: "avisoSafariTitulo", type: "text", label: "Aviso do Safari — título" },
          {
            name: "avisoSafariTexto",
            type: "long-text",
            rows: 2,
            label: "Aviso do Safari — texto",
          },
          { name: "semJsTitulo", type: "text", label: "Sem JavaScript — título" },
          { name: "semJsTexto", type: "long-text", rows: 2, label: "Sem JavaScript — texto" },
          { name: "indiceTitulo", type: "text", label: "Índice de arquétipos — título" },
          { name: "indiceLede", type: "long-text", rows: 3, label: "Índice de arquétipos — texto" },
          { name: "ctaEvento", type: "text", label: "Botão — ingresso" },
          { name: "fechoTitulo", type: "text", label: "Fecho — título" },
          { name: "fechoTexto", type: "long-text", rows: 3, label: "Fecho — texto" },
        ],
      },
    },

    // O studio varre `contents/quiz/` inteiro como uma coleção só: subdiretório
    // não vira coleção própria. Os schemas abaixo existem para rotular os campos
    // no CMS; a separação entre copy, pergunta e arquétipo é feita em `cms.ts`,
    // pelo slug de cada registro.
    "quiz-perguntas": {
      schema: {
        collection: "quiz-perguntas",
        label: "Quiz — perguntas",
        fields: [
          { name: "chave", type: "text", required: true, label: "Chave" },
          { name: "enunciado", type: "long-text", rows: 2, required: true, label: "Pergunta" },
          { name: "order", type: "number", format: "integer", label: "Ordem" },
          {
            name: "alternativas",
            type: "array",
            label: "Alternativas",
            itemFields: [
              { name: "chave", type: "text", required: true, label: "Chave" },
              { name: "texto", type: "long-text", rows: 2, required: true, label: "Texto" },
              // Mapa slug do arquétipo → peso. Uma alternativa pontua para dois
              // arquétipos: sem isso o resultado fica óbvio na terceira tela.
              { name: "pesos", type: "object", label: "Pesos por arquétipo", fields: [] },
            ],
          },
        ],
      },
    },

    "quiz-arquetipos": {
      schema: {
        collection: "quiz-arquetipos",
        label: "Quiz — arquétipos",
        fields: [
          { name: "slug", type: "text", required: true, label: "Slug" },
          { name: "nome", type: "text", required: true, label: "Nome" },
          { name: "sigla", type: "text", label: "Sigla (3 letras, na carta)" },
          { name: "time", type: "text", label: "Time (ex.: Red Team)" },
          {
            name: "timeCor",
            type: "select",
            label: "Cor do time",
            options: [
              opt("red", "Red Team"),
              opt("blue", "Blue Team"),
              opt("purple", "Purple Team"),
              opt("yellow", "Yellow Team"),
              opt("orange", "Orange Team"),
              opt("white", "White Team"),
            ],
          },
          { name: "timeCorNome", type: "text", label: "Nome da cor (ex.: Vermelho)" },
          { name: "timePapel", type: "text", label: "O que o time faz" },
          { name: "area", type: "text", label: "Área de atuação" },
          { name: "ferramenta", type: "text", label: "Ferramenta característica" },
          { name: "raridade", type: "text", label: "Raridade (ex.: 7%)" },
          { name: "raridadeLabel", type: "text", label: "Rótulo de raridade" },
          { name: "resumo", type: "long-text", rows: 2, label: "Resumo (uma frase)" },
          { name: "texto", type: "long-text", rows: 4, label: "Descrição" },
          { name: "noEvento", type: "long-text", rows: 2, label: "O que ver no evento" },
          // Desempate: menor ordem vence. Sem isso, respostas iguais poderiam
          // devolver arquétipos diferentes.
          { name: "order", type: "number", format: "integer", label: "Ordem (desempate)" },
        ],
      },
    },

    // ── Privacidade (singleton) ──────────────────────────────────────────
    // O texto descreve o que `src/lib/analytics.ts` faz. Ligar armazenamento no
    // código obriga a mudar esta página no mesmo commit.
    privacidade: {
      schema: {
        collection: "privacidade",
        label: "Privacidade",
        fields: [
          { name: "titulo", type: "text", required: true, label: "Título" },
          { name: "atualizadoEm", type: "date", required: true, label: "Atualizado em" },
          { name: "lede", type: "long-text", rows: 3, label: "Texto de apoio" },
          {
            name: "destaque",
            type: "object",
            label: "Bloco em destaque",
            description: "Abre a página explicando a ausência do aviso de cookies.",
            fields: [
              { name: "titulo", type: "text", required: true, label: "Título" },
              { name: "texto", type: "long-text", rows: 3, required: true, label: "Texto" },
            ],
          },
          {
            name: "blocos",
            type: "array",
            label: "Seções da política",
            itemFields: [
              { name: "titulo", type: "text", required: true, label: "Título" },
              { name: "texto", type: "long-text", rows: 4, required: true, label: "Texto" },
            ],
          },
          {
            name: "oposicao",
            type: "object",
            label: "Oposição à medição",
            description: "Botão que desliga a medição no aparelho de quem visita.",
            fields: [
              { name: "titulo", type: "text", required: true, label: "Título" },
              { name: "texto", type: "long-text", rows: 4, required: true, label: "Texto" },
              {
                name: "botaoDesligar",
                type: "text",
                required: true,
                label: "Botão — desligar a medição",
              },
              {
                name: "botaoLigar",
                type: "text",
                required: true,
                label: "Botão — ligar de volta",
              },
              {
                name: "estadoDesligado",
                type: "text",
                required: true,
                label: "Aviso — medição desligada",
              },
            ],
          },
        ],
      },
    },

    // ── Link-in-bio ──────────────────────────────────────────────────────
    // Página de QR code do evento: muda de destino sem redeploy de código.
    links: {
      schema: {
        collection: "links",
        label: "Links (QR code)",
        fields: [
          { name: "label", type: "text", required: true, label: "Rótulo" },
          { name: "href", type: "url", required: true, label: "Destino" },
          { name: "descricao", type: "text", label: "Descrição" },
          { name: "enabled", type: "boolean", label: "Ativo" },
          { name: "order", type: "number", format: "integer", label: "Ordem" },
        ],
      },
    },
  },
};

export default config;
