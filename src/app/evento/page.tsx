import { notFound } from "next/navigation";
import { PaginaInterna } from "@/components/layout/PaginaInterna";
import { EventoSection } from "@/components/sections/EventoSection";

import { metadataDeRota } from "@/lib/docs";
import { paginasDeEdicoes, rotaPublicada } from "@/lib/rotas";
import { generateBreadcrumbs, webPageSchema } from "@/lib/schema";
import { canonicalUrl } from "@/lib/site";
import { SECAO_VAZIA, getEdicoes, getSecoes, getSettings, getSobre } from "@/lib/cms";

const ROTA = "/evento";
const HOME_LABEL = "Início";
const TITULO = "O evento";
const DESCRICAO =
  "O que é o XibéSec, a origem do nome, a edição de 2026 e as anteriores: encontro presencial de cibersegurança em Belém do Pará, no Norte do Brasil.";

export const metadata = metadataDeRota({ path: ROTA, title: TITULO, description: DESCRICAO });

export default function EventoPage() {
  if (!rotaPublicada(ROTA)) notFound();

  const settings = getSettings();
  const sobre = getSobre();
  const secao = getSecoes()["evento"] ?? SECAO_VAZIA;

  const schema = [
    webPageSchema({ path: ROTA, titulo: sobre.titulo || TITULO, descricao: DESCRICAO }),
    generateBreadcrumbs([
      { name: HOME_LABEL, url: canonicalUrl("/") },
      { name: TITULO, url: canonicalUrl(ROTA) },
    ]),
  ];

  return (
    <PaginaInterna schema={schema}>
      <EventoSection
        sobre={sobre}
        edicoes={getEdicoes()}
        paginasDeEdicoes={paginasDeEdicoes()}
        settings={settings}
        secao={secao}
        showEdicoes={settings.sections.edicoes}
        titleAs="h1"
      />
    </PaginaInterna>
  );
}
