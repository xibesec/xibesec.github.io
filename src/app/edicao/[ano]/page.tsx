import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaginaInterna } from "@/components/layout/PaginaInterna";
import { EdicaoSection, type EdicaoLink } from "@/components/sections/EdicaoSection";

import { descricaoDaEdicao, metadataDeEdicao, nomeDaEdicao } from "@/lib/docs";
import { alvoCompraDeOutraRota } from "@/lib/links";
import { rotasDeEdicoes } from "@/lib/rotas";
import { edicaoSchema, generateBreadcrumbs } from "@/lib/schema";
import { canonicalUrl, edicaoPath, site } from "@/lib/site";
import { getEdicao, getImprensa, getSecoes, getSettings, SECAO_VAZIA } from "@/lib/cms";

const HOME_LABEL = "Início";

type Props = { params: Promise<{ ano: string }> };

/**
 * Uma rota por edição publicada, e a lista é fechada no build: sem entrada aqui,
 * nenhum HTML é escrito e o segmento não responde por ano que o catálogo de
 * rotas não conheça.
 */
export const dynamicParams = false;

export function generateStaticParams(): Array<{ ano: string }> {
  return rotasDeEdicoes().map((rota) => ({ ano: rota.path.split("/").pop() ?? "" }));
}

function edicaoDoParam(ano: string) {
  return /^\d{4}$/.test(ano) ? getEdicao(Number(ano)) : undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ano } = await params;
  const edicao = edicaoDoParam(ano);

  return edicao ? metadataDeEdicao(edicao) : {};
}

export default async function EdicaoPage({ params }: Props) {
  const { ano } = await params;
  const edicao = edicaoDoParam(ano);

  if (!edicao) notFound();

  const secao = getSecoes()["edicao"] ?? SECAO_VAZIA;
  const titulo = secao.titulo.replace("{ano}", String(edicao.ano)) || nomeDaEdicao(edicao);

  // Cobertura pelo ano de publicação: é o vínculo que a data sustenta.
  const cobertura = getImprensa().filter((materia) => materia.data.startsWith(String(edicao.ano)));

  const outras: EdicaoLink[] = [
    ...rotasDeEdicoes()
      .filter((rota) => rota.path !== edicaoPath(edicao.ano))
      .map((rota) => ({ label: rota.rotulo, href: `${rota.path}/` })),
    { label: site.siteName, href: "/" },
  ];

  const schema = [
    edicaoSchema({ edicao, titulo, descricao: descricaoDaEdicao(edicao) }),
    generateBreadcrumbs([
      { name: HOME_LABEL, url: canonicalUrl("/") },
      { name: titulo, url: canonicalUrl(edicaoPath(edicao.ano)) },
    ]),
  ];

  return (
    <PaginaInterna schema={schema}>
      <EdicaoSection
        edicao={edicao}
        secao={secao}
        cobertura={cobertura}
        outras={outras}
        compra={alvoCompraDeOutraRota(getSettings())}
      />
    </PaginaInterna>
  );
}
