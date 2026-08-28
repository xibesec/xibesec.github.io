import {
  docsAtivos,
  docsDeEdicoes,
  perfisDePalestrantes,
  renderAgents,
  renderDoc,
  renderEdicao,
  renderPerfil,
} from "@/lib/docs";
import { textResponse } from "@/lib/text-route";

export const dynamic = "force-static";
export const dynamicParams = false;

/** `agents.md` não vem de uma seção da página: é o manual do evento para agentes. */
const AGENTS = "agents.md";

/**
 * Um arquivo Markdown por documento publicado. Os nomes saem de `docsAtivos()`,
 * então uma seção desligada em `contents/settings` não gera arquivo — e o
 * `sitemap` e o `llms.txt`, que leem a mesma lista, não apontam para o vazio.
 *
 * A rota é `catch-all` porque o perfil de cada palestrante mora um nível abaixo,
 * em `/docs/palestrantes/<slug>.md`, espelhando o endereço da página HTML.
 */
export function generateStaticParams(): Array<{ doc: string[] }> {
  return [
    { doc: [AGENTS] },
    ...docsAtivos().map((doc) => ({ doc: [`${doc.slug}.md`] })),
    ...docsDeEdicoes().map((doc) => ({ doc: `${doc.slug}.md`.split("/") })),
    ...perfisDePalestrantes().map((perfil) => ({ doc: `${perfil.slug}.md`.split("/") })),
  ];
}

export async function GET(_request: Request, ctx: { params: Promise<{ doc: string[] }> }) {
  const { doc } = await ctx.params;
  const caminho = doc.join("/");

  if (caminho === AGENTS) return textResponse(renderAgents(), "text/markdown");

  const slug = caminho.replace(/\.md$/, "");

  const perfil = perfisDePalestrantes().find((item) => item.slug === slug);
  if (perfil) return textResponse(renderPerfil(perfil), "text/markdown");

  const edicao = docsDeEdicoes().find((item) => item.slug === slug);
  if (edicao) return textResponse(renderEdicao(edicao), "text/markdown");

  const encontrado = docsAtivos().find((item) => item.slug === slug);
  if (!encontrado) return new Response("Not Found", { status: 404 });

  return textResponse(renderDoc(encontrado), "text/markdown");
}
