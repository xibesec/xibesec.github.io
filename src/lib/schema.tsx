// JSON-LD (schema.org). Gerado a partir de `site.ts` + `contents/` — nunca
// escrito como string fixa, senão volta a divergir do conteúdo publicado.
import {
  PALESTRANTES_PATH,
  absoluteUrl,
  canonicalUrl,
  edicaoPath,
  palestrantePath,
  site,
  socialLinks,
} from "./site";
import { paragrafos } from "./content-types";
import type {
  AgendaItem,
  Arquetipo,
  Edicao,
  Ingresso,
  Materia,
  Palestrante,
  Patrocinador,
  Settings,
} from "./content-types";

/** A home com a barra final, como o canonical a publica. Base dos `@id`. */
const HOME = canonicalUrl("/");

const ORG_ID = `${HOME}#organization`;
const WEBSITE_ID = `${HOME}#website`;
const EVENT_ID = `${HOME}#event`;
/** A série que reúne todas as edições. Cada ano é um `Event` dentro dela. */
const SERIES_ID = `${HOME}#series`;

/**
 * `streetAddress` sem repetir cidade e UF — elas já vão em `addressLocality` e
 * `addressRegion`, e o endereço do CMS é uma linha só, do jeito que se escreve
 * num convite.
 */
function streetAddress(venueAddress: string): string {
  const cauda = new RegExp(`[,.]?\\s*${site.city}\\s*[/-]\\s*${site.region}\\.?\\s*$`, "i");
  return venueAddress.replace(cauda, "").trim();
}

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": ORG_ID,
  name: site.organizationName,
  url: site.organizationUrl,
  email: site.contactEmail,
  logo: absoluteUrl("/images/marca/logo-hekate.png"),
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  url: HOME,
  name: site.siteName,
  description: site.siteDescription,
  inLanguage: site.locale,
  publisher: { "@id": ORG_ID },
  // Amarra o site à entidade do evento: é o que faz um sistema de busca
  // entender que a página é sobre o XibéSec, não sobre a organizadora.
  about: { "@id": EVENT_ID },
};

/** Preço do `Offer` em unidade monetária, a partir dos centavos do conteúdo. */
const price = (cents: number) => (cents / 100).toFixed(2);

export function eventSchema({
  settings,
  ingressos,
  agenda = [],
  patrocinadores = [],
  palestrantes = [],
}: {
  settings: Settings;
  ingressos: Ingresso[];
  /** Só a grade confirmada vira `subEvent`: item em definição não é promessa. */
  agenda?: AgendaItem[];
  patrocinadores?: Patrocinador[];
  palestrantes?: Palestrante[];
}) {
  // Sem título não há `name`, e `Event` sem nome não é lido como atividade.
  const confirmados = agenda.filter((item) => item.status === "confirmado" && item.titulo);

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    "@id": EVENT_ID,
    name: site.siteName,
    description: site.siteDescription,
    startDate: settings.eventStartDate,
    endDate: settings.eventEndDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    inLanguage: site.locale,
    isAccessibleForFree: false,
    keywords: [...site.keywords].join(", "),
    url: HOME,
    image: [absoluteUrl(site.ogImage)],
    location: {
      "@type": "Place",
      name: settings.venueName,
      ...(settings.venueMapUrl ? { hasMap: settings.venueMapUrl } : {}),
      address: {
        "@type": "PostalAddress",
        streetAddress: streetAddress(settings.venueAddress),
        addressLocality: site.city,
        addressRegion: site.region,
        addressCountry: site.country,
      },
    },
    organizer: {
      "@type": "Organization",
      "@id": ORG_ID,
      name: site.organizationName,
      email: site.contactEmail,
      url: site.organizationUrl,
    },
    offers: ingressos.map((ticket) => ({
      "@type": "Offer",
      name: ticket.nome,
      price: price(ticket.preco),
      priceCurrency: "BRL",
      availability: "https://schema.org/InStock",
      validThrough: ticket.validThrough,
      availabilityEnds: ticket.validThrough,
      url: ticket.ctaUrl,
    })),
    ...(confirmados.length > 0 && {
      subEvent: confirmados.map((item) => ({
        "@type": "Event",
        name: item.titulo,
        description: item.descricao,
        startDate: item.startsAt,
        endDate: item.endsAt,
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        location: { "@type": "Place", name: settings.venueName },
        // Só a palestra de uma pessoa vira `performer`: a composição de um
        // painel é uma frase, e frase em `Person.name` polui o grafo.
        ...(item.speakerSlug ? { performer: { "@type": "Person", name: item.palestrante } } : {}),
      })),
    }),
    ...(patrocinadores.length > 0 && {
      sponsor: patrocinadores.map((item) => ({
        "@type": "Organization",
        name: item.nome,
        ...(item.url ? { url: item.url } : {}),
      })),
    }),
    ...(palestrantes.length > 0 && {
      performer: palestrantes.map((item) => generatePersonSchema(item)),
    }),
  };
}

/**
 * `Person` de palestrante. Campo vazio não entra: o retrato e os perfis de rede
 * chegam depois do anúncio, e propriedade em branco no JSON-LD só suja o grafo.
 * O `@id` é a URL da própria página, e é o que faz o `performer` do evento e a
 * `ProfilePage` falarem da mesma pessoa, em vez de duas homônimas.
 */
export function generatePersonSchema(palestrante: Palestrante) {
  const url = canonicalUrl(palestrantePath(palestrante.slug));
  const sameAs = [
    palestrante.linkedin,
    palestrante.github,
    palestrante.twitter,
    palestrante.site,
  ].filter(Boolean);

  return {
    "@type": "Person",
    "@id": `${url}#person`,
    name: palestrante.nome,
    url,
    ...(palestrante.resumo ? { description: palestrante.resumo } : {}),
    ...(palestrante.cargo ? { jobTitle: palestrante.cargo } : {}),
    ...(palestrante.empresa
      ? { worksFor: { "@type": "Organization", name: palestrante.empresa } }
      : {}),
    ...(palestrante.temas.length > 0 ? { knowsAbout: palestrante.temas } : {}),
    ...(palestrante.certificacoes.length > 0
      ? {
          hasCredential: palestrante.certificacoes.map((sigla) => ({
            "@type": "EducationalOccupationalCredential",
            credentialCategory: "certification",
            name: sigla,
          })),
        }
      : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

/**
 * A página de uma pessoa. `ProfilePage` é o tipo que o Google lê como perfil, e
 * o que interessa nela é o `mainEntity`: a palestra vira `subjectOf` do próprio
 * `Person`, porque sem horário confirmado ela não é um `subEvent` da grade.
 */
export function palestranteSchema({
  palestrante,
  descricao,
}: {
  palestrante: Palestrante;
  descricao: string;
}) {
  const url = canonicalUrl(palestrantePath(palestrante.slug));
  // A participação é declarada aqui, e não no `Person` que o evento aninha: lá
  // ela seria uma referência do evento para ele mesmo.
  const pessoa = { ...generatePersonSchema(palestrante), performerIn: { "@id": EVENT_ID } };

  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${url}#webpage`,
    url,
    name: palestrante.nome,
    description: descricao,
    inLanguage: site.locale,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": EVENT_ID },
    publisher: { "@id": ORG_ID },
    mainEntity: palestrante.palestraTitulo
      ? {
          ...pessoa,
          subjectOf: {
            "@type": "CreativeWork",
            name: palestrante.palestraTitulo,
            ...(palestrante.palestraResumo ? { abstract: palestrante.palestraResumo } : {}),
            inLanguage: site.locale,
            isPartOf: { "@id": EVENT_ID },
          },
        }
      : pessoa,
  };
}

/** O índice de quem apresenta. A entidade é a lista, na ordem publicada. */
export function palestrantesSchema({
  titulo,
  descricao,
  palestrantes,
}: {
  titulo: string;
  descricao: string;
  palestrantes: Palestrante[];
}) {
  return webPageSchema({
    path: PALESTRANTES_PATH,
    titulo,
    descricao,
    mainEntity:
      palestrantes.length > 0
        ? {
            "@type": "ItemList",
            name: titulo,
            numberOfItems: palestrantes.length,
            itemListOrder: "https://schema.org/ItemListOrderAscending",
            itemListElement: palestrantes.map((palestrante, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: canonicalUrl(palestrantePath(palestrante.slug)),
              item: generatePersonSchema(palestrante),
            })),
          }
        : undefined,
  });
}

/**
 * Página interna. O `about` amarra a rota à entidade do evento: sem ele cada
 * página é lida como peça solta, e não como parte do XibéSec.
 */
export function webPageSchema({
  path,
  titulo,
  descricao,
  mainEntity,
}: {
  path: string;
  titulo: string;
  descricao: string;
  mainEntity?: object;
}) {
  const url = canonicalUrl(path);

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: titulo,
    description: descricao,
    inLanguage: site.locale,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": EVENT_ID },
    publisher: { "@id": ORG_ID },
    ...(mainEntity ? { mainEntity } : {}),
  };
}

/**
 * A página do quiz. A entidade que importa não é o formulário, é a lista de
 * arquétipos — e dela só entra o que o HTML publica.
 */
export function quizSchema({
  titulo,
  descricao,
  listaTitulo,
  arquetipos,
}: {
  titulo: string;
  descricao: string;
  listaTitulo: string;
  arquetipos: Arquetipo[];
}) {
  return webPageSchema({
    path: "/quiz",
    titulo,
    descricao,
    mainEntity:
      arquetipos.length > 0
        ? {
            "@type": "ItemList",
            name: listaTitulo,
            numberOfItems: arquetipos.length,
            itemListOrder: "https://schema.org/ItemListOrderAscending",
            itemListElement: arquetipos.map((item, index) => ({
              "@type": "ListItem",
              position: index + 1,
              item: {
                "@type": "Thing",
                name: item.nome,
                ...(item.sigla ? { alternateName: item.sigla } : {}),
                ...(item.time || item.area
                  ? {
                      disambiguatingDescription: [item.time, item.area].filter(Boolean).join(" · "),
                    }
                  : {}),
                ...(item.resumo ? { description: item.resumo } : {}),
              },
            })),
          }
        : undefined,
  });
}

/**
 * A página de cobertura. A entidade é a lista de publicações, e o `publisher`
 * de cada uma é o veículo que a assina — nunca a organização do evento: o que
 * dá peso à prova de terceiro é justamente ela não ser do próprio evento.
 */
export function imprensaSchema({
  titulo,
  descricao,
  materias,
}: {
  titulo: string;
  descricao: string;
  materias: Materia[];
}) {
  return webPageSchema({
    path: "/press",
    titulo,
    descricao,
    mainEntity:
      materias.length > 0
        ? {
            "@type": "ItemList",
            name: titulo,
            numberOfItems: materias.length,
            itemListElement: materias.map((materia, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: materia.url,
              item: {
                "@type": "NewsArticle",
                headline: materia.titulo,
                url: materia.url,
                ...(materia.data ? { datePublished: materia.data } : {}),
                ...(materia.trecho ? { description: materia.trecho } : {}),
                publisher: { "@type": "Organization", name: materia.veiculo },
                about: { "@id": EVENT_ID },
              },
            })),
          }
        : undefined,
  });
}

/**
 * A página de uma edição que já aconteceu. A entidade é o evento daquele ano,
 * com data e local próprios, ligado por `superEvent` à série que leva o nome do
 * XibéSec: é o que separa a edição de 2023 da edição corrente para um buscador,
 * sem que uma passe por atualização da outra.
 *
 * Só entra edição com data: `Event` sem `startDate` não é lido como evento, e
 * inventar a data para preencher o campo é o oposto do que o conteúdo declara.
 */
export function edicaoSchema({
  edicao,
  titulo,
  descricao,
}: {
  edicao: Edicao;
  titulo: string;
  descricao: string;
}) {
  const url = canonicalUrl(edicaoPath(edicao.ano));
  // A descrição da página chama para a edição corrente; a do evento de 2023 não
  // pode fazer isso, sob pena de anunciar a data errada no resultado de busca.
  const abertura = paragrafos(edicao.resumo)[0] ?? descricao;

  const evento = edicao.startsAt
    ? {
        "@type": "Event",
        "@id": `${url}#event`,
        name: titulo,
        description: abertura,
        startDate: edicao.startsAt,
        ...(edicao.endsAt ? { endDate: edicao.endsAt } : {}),
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        inLanguage: site.locale,
        url,
        ...(edicao.foto ? { image: [absoluteUrl(edicao.foto)] } : {}),
        ...(edicao.local
          ? {
              location: {
                "@type": "Place",
                name: edicao.local,
                address: {
                  "@type": "PostalAddress",
                  ...(edicao.endereco ? { streetAddress: streetAddress(edicao.endereco) } : {}),
                  addressLocality: site.city,
                  addressRegion: site.region,
                  addressCountry: site.country,
                },
              },
            }
          : {}),
        organizer: { "@id": ORG_ID },
        superEvent: {
          "@type": "EventSeries",
          "@id": SERIES_ID,
          name: site.siteShortName,
          url: HOME,
        },
      }
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: titulo,
    description: descricao,
    inLanguage: site.locale,
    isPartOf: { "@id": WEBSITE_ID },
    publisher: { "@id": ORG_ID },
    ...(evento ? { about: evento, mainEntity: { "@id": `${url}#event` } } : {}),
  };
}

export function generateFaqSchema(items: Array<{ pergunta: string; resposta: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.pergunta,
      acceptedAnswer: { "@type": "Answer", text: item.resposta },
    })),
  };
}

export function generateBreadcrumbs(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export const organizationWithSocial = {
  ...organizationSchema,
  sameAs: socialLinks(),
};

export function SchemaMarkup({ schema }: { schema: object | object[] }) {
  const list = Array.isArray(schema) ? schema : [schema];
  return (
    <>
      {list.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}
