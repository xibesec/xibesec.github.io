// Fonte única de URL, identidade e SEO. A URL do site não se repete em nenhum
// outro arquivo: tudo passa por `absoluteUrl` e `pageMetadata`.

export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const site = {
  siteName: "XibéSec 2026",
  /** A marca sem o ano: o que nomeia a série e as edições anteriores. */
  siteShortName: "XibéSec",
  siteTagline: "Para quem tem fome de segurança",
  /** Categoria do evento, no léxico do `PRODUCT.md`. Entra no `<title>`. */
  siteCategory: "Encontro de cibersegurança",
  // Cabe inteira no resultado de busca: acima de ~160 caracteres o Google corta
  // a frase no meio e a data, que é o que faz clicar, some.
  siteDescription:
    "O encontro de cibersegurança do Norte do Brasil. 4ª edição: 19 de setembro de 2026, das 09h às 19h, no Bristol Marambaia Hotel, em Belém do Pará.",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://xibesec.com.br",
  locale: "pt-BR",

  // JPEG, não PNG: o WhatsApp descarta imagem de link acima de ~600 KB, e a
  // mesma arte em PNG passa de 900 KB.
  ogImage: "/og-xibesec-2026.jpg",
  ogImageType: "image/jpeg",
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt:
    "XibéSec 26: logotipo e mascote ciber-amazônico na mata, com a data 19 de setembro de 2026, das 09h às 19h, no Bristol Marambaia Hotel em Belém, PA.",

  themeColor: "#152310",

  organizationName: "Hekate, Inc.",
  organizationUrl: "https://www.hekateinc.com/",
  contactEmail: "contact@hekateinc.com",

  city: "Belém",
  region: "PA",
  regionName: "Pará",
  country: "BR",

  keywords: [
    "XibéSec",
    "cibersegurança",
    "segurança da informação",
    "infosec",
    "hacking",
    "CTF",
    "Belém",
    "Pará",
    "Amazônia",
    "evento de segurança",
    "conferência",
  ],

  social: {
    instagram: "https://www.instagram.com/xibesec/",
    linkedin: "https://www.linkedin.com/company/xibesec/",
    linktree: "https://linktr.ee/xibesec",
  },
} as const;

/** URL absoluta, respeitando `basePath` quando o site não está na raiz. */
export function absoluteUrl(path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${site.siteUrl}${basePath}${clean === "/" ? "" : clean}`;
}

/**
 * URL canônica de uma rota HTML, com a barra final que o `trailingSlash` impõe.
 * Sem ela o sitemap aponta para um endereço que o canonical não confirma.
 */
export function canonicalUrl(path = "/"): string {
  const url = absoluteUrl(path);
  return url.endsWith("/") ? url : `${url}/`;
}

/** Índice de quem apresenta na edição. */
export const PALESTRANTES_PATH = "/palestrantes";

/**
 * Endereço da página de um palestrante. Mora aqui, com o resto das URLs: o
 * catálogo de rotas, o JSON-LD e o espelho em Markdown precisam do mesmo
 * caminho, e escrito três vezes ele diverge na primeira mudança.
 */
export function palestrantePath(slug: string): string {
  return `${PALESTRANTES_PATH}/${slug}`;
}

/** Prefixo das edições anteriores. */
export const EDICOES_PATH = "/edicao";

/**
 * Endereço da página de uma edição anterior. O ano é o slug, sob um prefixo
 * próprio: um segmento de ano solto na raiz disputaria o endereço com toda rota
 * do site, e `/edicao/2023` diz o que a página é antes de abrir.
 */
export function edicaoPath(ano: number): string {
  return `${EDICOES_PATH}/${ano}`;
}

/** Caminho de asset servido de `public/`, com `basePath` aplicado. */
export function asset(path: string): string {
  return `${basePath}${path.startsWith("/") ? path : `/${path}`}`;
}

export function socialLinks(): string[] {
  return Object.values(site.social);
}

/**
 * Caminho do espelho em Markdown pela convenção de nome: `/` → `/index.md`. Só
 * a home segue essa forma; documento de seção vive em `/docs/`, e a rota que
 * tem um passa o caminho por `markdown`, vindo de `markdownDaRota()`.
 */
export function markdownPath(path: string): string {
  const clean = path.replace(/\/+$/, "");
  return clean === "" ? "/index.md" : `${clean}.md`;
}

/**
 * Metadata completo de uma página interna. Toda rota nova passa por aqui — é o
 * que impede uma página sair sem canonical e sem o espelho em Markdown.
 *
 * `markdown` só precisa ser passado quando o arquivo foge da convenção; `null`
 * desliga o alternate, para rota que não tenha espelho gerado.
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
  markdown,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  markdown?: string | null;
}) {
  const url = absoluteUrl(path);
  // A marca entra sempre e sem repetir: "XibéSec" é a palavra que se busca, e
  // um título que não a contém não ganha a própria consulta. `absolute` desliga
  // o template do layout, que duplicaria o nome quando o título já o traz.
  const fullTitle = title.includes(site.siteShortName) ? title : `${title} · ${site.siteName}`;
  const ogImage = absoluteUrl(image ?? site.ogImage);
  const md = markdown === undefined ? markdownPath(path) : markdown;

  return {
    title: { absolute: fullTitle },
    description,
    alternates: {
      canonical: url,
      ...(md ? { types: { "text/markdown": absoluteUrl(md) } } : {}),
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: site.siteName,
      locale: "pt_BR",
      type: "website" as const,
      images: [
        {
          url: ogImage,
          type: site.ogImageType,
          width: site.ogImageWidth,
          height: site.ogImageHeight,
          alt: site.ogImageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: fullTitle,
      description,
      images: [ogImage],
    },
  };
}
