import type { ReactNode } from "react";
import { SkipLink } from "@/components/primitives/SkipLink";
import { Button } from "@/components/primitives/Button";
import { NavBar } from "@/components/layout/NavBar";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { alvoCompraDeOutraRota, ancoraDaHome } from "@/lib/links";
import { itensDoMenu } from "@/lib/rotas";
import { SchemaMarkup } from "@/lib/schema";
import { buildShellFs } from "@/lib/shell-fs";
import { cn } from "@/lib/utils";
import { getEquipe, getNavegacao, getSettings } from "@/lib/cms";

// Rótulos de navegação: interface, não conteúdo editorial.
const SKIP = "Pular para o conteúdo";
const NAV_CTA = "Seguir no Instagram";

export type PaginaInternaProps = {
  children: ReactNode;
  schema?: object | object[];
  /** Desligado na rota do próprio shell, onde um segundo terminal disputaria o foco. */
  shellNoRodape?: boolean;
  /** Desligada por quem mede a própria altura a partir da barra, como `/terminal`. */
  folgaNoTopo?: boolean;
};

/**
 * Casca das rotas internas: barra, conteúdo e rodapé. A home não usa — lá o CTA
 * é medido e há o dock de ingressos.
 */
export function PaginaInterna({
  children,
  schema,
  shellNoRodape = true,
  folgaNoTopo = true,
}: PaginaInternaProps) {
  const settings = getSettings();
  const navegacao = getNavegacao();
  const equipe = getEquipe();
  const compra = alvoCompraDeOutraRota(settings);

  return (
    <>
      {schema ? <SchemaMarkup schema={schema} /> : null}

      <SkipLink href="#conteudo">{SKIP}</SkipLink>

      <NavBar
        items={itensDoMenu(navegacao).map((item) => ({
          ...item,
          href: ancoraDaHome(item.href),
        }))}
        action={
          <Button size="sm" {...compra} href={compra.href}>
            {NAV_CTA}
          </Button>
        }
      />

      {/* A folga do topo abre a primeira seção sob a barra. Quem preenche a tela
          a partir dela mede a própria altura e dispensa a folga. */}
      <main id="conteudo" className={cn("flex-1", folgaNoTopo && "pt-(--nav-h)")}>
        {children}
      </main>

      <SiteFooter
        settings={settings}
        equipe={equipe}
        shellFs={shellNoRodape ? buildShellFs() : null}
      />
    </>
  );
}
