// Destino de link. A URL de venda mora em `contents/settings`, e o que este
// arquivo resolve é a pergunta seguinte: para onde o botão aponta quando a
// seção que ele buscava não está publicada.

import { site } from "./site";
import type { SectionKey, Settings } from "./content-types";

/** Atributos de um destino, prontos para espalhar em `<a>` ou `Button`. */
export type LinkAlvo = {
  href: string;
  target?: "_blank";
  rel?: "noopener";
};

/** Link que sai do site: nova aba, sem entregar `window.opener` ao destino. */
export function externo(href: string): LinkAlvo {
  return { href, target: "_blank", rel: "noopener" };
}

/** Âncora da seção de ingressos, onde fica a tabela de preços. */
export const ANCORA_INGRESSOS = "#ingressos";

/**
 * Destino de um CTA de compra cujo rótulo não promete o checkout ("Garantir
 * presença", "Quero participar"): rola até a tabela de preços, onde cada lote
 * leva ao Sympla.
 *
 * Com a seção de ingressos desligada não há tabela de preços na página, e o
 * clique ficaria parado onde está. Para esta edição a seção não está desligada
 * por estar em preparação: a venda encerrou porque o evento já aconteceu, então
 * o destino passa a ser o Instagram, onde a organização anuncia a próxima.
 */
export function alvoCompra(settings: Settings): LinkAlvo {
  return settings.sections.ingressos ? { href: ANCORA_INGRESSOS } : externo(site.social.instagram);
}

/**
 * O mesmo destino, fora da home: a tabela de preços está em outra página, e uma
 * âncora nua não sairia do lugar.
 */
export function alvoCompraDeOutraRota(settings: Settings): LinkAlvo {
  return settings.sections.ingressos
    ? { href: `/${ANCORA_INGRESSOS}` }
    : externo(site.social.instagram);
}

/** Âncora vista de outra rota: sem a home na frente, o clique não sai do lugar. */
export function ancoraDaHome(href: string): string {
  return href.startsWith("#") ? `/${href}` : href;
}

/**
 * Seção que publica cada âncora da home. Só entra âncora que uma feature flag
 * governa — `#topo` e `#conteudo` existem sempre e ficam de fora.
 */
const SECAO_DA_ANCORA: Record<string, SectionKey> = {
  "#evento": "sobre",
  "#programacao": "agenda",
  "#ctf": "ctf",
  "#palestrantes": "palestrantes",
  "#ingressos": "ingressos",
  "#participe": "participe",
  "#imprensa": "imprensa",
  "#patrocinio": "patrocinio",
  "#local": "local",
};

/**
 * Uma âncora só leva a algum lugar se a seção que a publica estiver ligada.
 * URL externa e âncora fora do mapa passam direto.
 *
 * É o que impede a nota de uma seção apontar para outra que não foi ao ar: o
 * conteúdo em `contents/` não sabe quais seções estão publicadas.
 */
export function ancoraViva(href: string, sections: Settings["sections"]): boolean {
  if (!href.startsWith("#")) return true;

  const chave = SECAO_DA_ANCORA[href];
  return chave === undefined || sections[chave] === true;
}
