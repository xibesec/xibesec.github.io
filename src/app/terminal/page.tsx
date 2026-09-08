import { PaginaInterna } from "@/components/layout/PaginaInterna";
import { TerminalSection } from "@/components/sections/TerminalSection";

import { metadataDeRota } from "@/lib/docs";
import { buildShellFs } from "@/lib/shell-fs";
import { generateBreadcrumbs, webPageSchema } from "@/lib/schema";
import { canonicalUrl } from "@/lib/site";
import { SECAO_VAZIA, getSecoes, getSettings } from "@/lib/cms";

const ROTA = "/terminal";
const HOME_LABEL = "Início";
const TITULO = "Terminal";
const DESCRICAO =
  "xibesh, o shell do XibéSec 2026: um terminal que roda no navegador e responde sobre data, programação, ingressos, trilhas, local e quem apoia a edição.";

export const metadata = metadataDeRota({
  path: ROTA,
  title: `${TITULO} · xibesh`,
  description: DESCRICAO,
});

export default function TerminalPage() {
  const settings = getSettings();
  const secao = getSecoes()["terminal"] ?? SECAO_VAZIA;

  const schema = [
    webPageSchema({ path: ROTA, titulo: secao.titulo || TITULO, descricao: DESCRICAO }),
    generateBreadcrumbs([
      { name: HOME_LABEL, url: canonicalUrl("/") },
      { name: TITULO, url: canonicalUrl(ROTA) },
    ]),
  ];

  // O shell é o assunto da página: toma a tela inteira sob a barra, e um segundo
  // no rodapé disputaria o foco e dobraria a medição de uso.
  return (
    <PaginaInterna schema={schema} shellNoRodape={false} folgaNoTopo={false}>
      <TerminalSection secao={secao} fs={buildShellFs()} target={settings.eventStartDate} />
    </PaginaInterna>
  );
}
