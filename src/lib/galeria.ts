import { horarioDaFoto, type Foto } from "./content-types";
import { site } from "./site";

/**
 * Texto alternativo de uma foto. O `alt` escrito no conteúdo manda; sem ele, a
 * foto diz de onde e de quando é, que é o que se sabe dela sem olhar. Descrição
 * inventada seria pior que nenhuma: afirmaria quem está na imagem.
 */
export function altDaFoto(foto: Foto): string {
  if (foto.alt) return foto.alt;
  const horario = horarioDaFoto(foto);
  return horario
    ? `${site.siteName}, foto das ${horario}`
    : `${site.siteName}, foto do dia do evento`;
}

/** A prévia de link da galeria, gravada pelo `yarn galeria` ao lado das fotos. */
export function capaDaGaleria(fotos: Foto[]): Foto | undefined {
  return fotos.find((foto) => foto.capa) ?? fotos.find((foto) => foto.destaque) ?? fotos[0];
}

export function ogDaGaleria(fotos: Foto[]): string | undefined {
  const capa = capaDaGaleria(fotos);
  return capa ? capa.arquivo.replace(/[^/]+$/, "og.jpg") : undefined;
}
