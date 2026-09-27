import { notFound } from "next/navigation";
import { PaginaInterna } from "@/components/layout/PaginaInterna";
import { GaleriaSection } from "@/components/sections/GaleriaSection";

import { metadataDeRota } from "@/lib/docs";
import { altDaFoto, capaDaGaleria, ogDaGaleria } from "@/lib/galeria";
import { rotaPublicada } from "@/lib/rotas";
import { galeriaSchema, generateBreadcrumbs } from "@/lib/schema";
import { GALERIA_PATH, asset, canonicalUrl, site } from "@/lib/site";
import { SECAO_VAZIA, getFotos, getSecoes, getSettings } from "@/lib/cms";

const HOME_LABEL = "Início";
const TITULO = `Fotos do ${site.siteName}`;

function descricao(): string {
  const settings = getSettings();
  return `As fotos do ${site.siteName}, em ${settings.eventDisplayDate}, no ${settings.venueName}, em ${site.city} do ${site.regionName}: palestras, painéis, premiação e quem esteve lá.`;
}

export function generateMetadata() {
  const fotos = getFotos();
  const capa = capaDaGaleria(fotos);

  return metadataDeRota({
    path: GALERIA_PATH,
    title: TITULO,
    description: descricao(),
    image: ogDaGaleria(fotos),
    imageAlt: capa ? altDaFoto(capa) : undefined,
  });
}

export default function GaleriaPage() {
  if (!rotaPublicada(GALERIA_PATH)) notFound();

  const fotos = getFotos();
  const secao = getSecoes()["galeria"] ?? SECAO_VAZIA;
  const titulo = secao.titulo || TITULO;

  const itens = fotos.map((foto) => ({ foto, alt: altDaFoto(foto), href: asset(foto.arquivo) }));

  const schema = [
    galeriaSchema({ titulo, descricao: descricao(), fotos }),
    generateBreadcrumbs([
      { name: HOME_LABEL, url: canonicalUrl("/") },
      { name: titulo, url: canonicalUrl(GALERIA_PATH) },
    ]),
  ];

  return (
    <PaginaInterna schema={schema}>
      <GaleriaSection secao={secao} itens={itens} />
    </PaginaInterna>
  );
}
