import { SkipLink } from "@/components/primitives/SkipLink";
import { Greca } from "@/components/primitives/Greca";
import { Section } from "@/components/primitives/Section";
import { Container } from "@/components/primitives/Container";
import { Reveal } from "@/components/primitives/Reveal";
import { HighlightPanel } from "@/components/primitives/HighlightPanel";
import { BotaoMedido } from "@/components/analytics/BotaoMedido";
import { FactStrip } from "@/components/data/FactStrip";
import { NavBar } from "@/components/layout/NavBar";
import { Dock } from "@/components/layout/Dock";

import { Hero } from "@/components/sections/Hero";
import { CountdownBar } from "@/components/sections/CountdownBar";
import { EventoSection } from "@/components/sections/EventoSection";
import { ProgramacaoSection } from "@/components/sections/ProgramacaoSection";
import { CtfSection } from "@/components/sections/CtfSection";
import { PalestrantesSection } from "@/components/sections/PalestrantesSection";
import { IngressosSection } from "@/components/sections/IngressosSection";
import { ParticipeSection } from "@/components/sections/ParticipeSection";
import { PatrocinioSection } from "@/components/sections/PatrocinioSection";
import { ImprensaSection } from "@/components/sections/ImprensaSection";
import { LocalSection } from "@/components/sections/LocalSection";
import { Fechamento } from "@/components/sections/Fechamento";
import { SiteFooter } from "@/components/sections/SiteFooter";

import { SchemaMarkup, eventSchema, organizationWithSocial, websiteSchema } from "@/lib/schema";
import { buildShellFs } from "@/lib/shell-fs";
import { itensDoMenu, paginasDeEdicoes } from "@/lib/rotas";
import { alvoCompra, ancoraViva, externo } from "@/lib/links";
import { EVENTOS } from "@/lib/analytics";
import { pageMetadata, site } from "@/lib/site";
import {
  SECAO_VAZIA,
  destaqueDaImprensa,
  formatDate,
  formatPrice,
  getAgenda,
  getBeneficios,
  getChamadas,
  getCtf,
  getDestaque,
  getEdicoes,
  getEquipe,
  getFatos,
  getHero,
  getImprensa,
  getIngressos,
  getNavegacao,
  getPalestrantes,
  getPatrocinadores,
  getPatrocinadoresPorCota,
  getSecoes,
  getSettings,
  getSobre,
  lowestPrice,
} from "@/lib/cms";

// Rótulos de navegação: interface, não conteúdo editorial.
const SKIP = "Pular para o conteúdo";
// A venda encerrou com o fim do evento: o botão da barra fixa não promete mais
// checkout, e leva ao Instagram, onde a organização anuncia a próxima edição.
const NAV_CTA = "Seguir no Instagram";
const DOCK_CTA = "Ingressos";
const FATOS_ARIA = "O XibéSec 2026 em números";

export const metadata = pageMetadata({
  title: `${site.siteName} · ${site.siteCategory} em ${site.city}, ${site.region}`,
  description: site.siteDescription,
  path: "/",
});

export default function Page() {
  const settings = getSettings();
  const { sections } = settings;

  const secoes = getSecoes();
  // A nota de uma seção pode apontar para a âncora de outra. O conteúdo em
  // `contents/` não sabe o que foi ao ar, então a poda acontece aqui: seção
  // desligada perde o link e a frase segue inteira, sem o destino.
  const secao = (chave: string) => {
    const registro = secoes[chave] ?? SECAO_VAZIA;
    if (!registro.notaLinkUrl || ancoraViva(registro.notaLinkUrl, sections)) return registro;
    return { ...registro, notaLinkUrl: "" };
  };

  // A venda encerrou com o evento: todo CTA que antes prometia checkout agora
  // leva ao Instagram, de onde sai o anúncio da próxima edição.
  const instagram = externo(site.social.instagram);
  const compra = alvoCompra(settings);

  const hero = getHero();
  const navegacao = getNavegacao();
  const fatos = getFatos();
  const sobre = getSobre();
  const edicoes = getEdicoes();
  const trilhaGerencial = getDestaque("trilha-gerencial");
  const agenda = getAgenda();
  const ctf = getCtf();
  const palestrantes = getPalestrantes();
  const ingressos = getIngressos();
  const beneficios = getBeneficios();
  const chamadas = getChamadas();
  const imprensa = getImprensa();
  const gruposPatrocinio = getPatrocinadoresPorCota();
  const equipe = getEquipe();

  const cheapest = lowestPrice(ingressos);
  const lote = ingressos[0];

  // JSON-LD: só entra no schema o que a página realmente publica — seção
  // desligada não vira promessa para o buscador. O `FAQPage` mora em `/faq`,
  // que é onde as respostas estão.
  const schema = [
    websiteSchema,
    organizationWithSocial,
    eventSchema({
      settings,
      ingressos: sections.ingressos ? ingressos : [],
      agenda: sections.agenda ? agenda : [],
      patrocinadores: sections.patrocinio ? getPatrocinadores() : [],
      // Quem apresenta é publicado em `/palestrantes`, e não pela vitrine da
      // home: o `performer` segue o conteúdo anunciado, não a feature flag.
      palestrantes,
    }),
  ];

  return (
    <>
      <SchemaMarkup schema={schema} />

      <SkipLink href="#conteudo">{SKIP}</SkipLink>

      <NavBar
        items={itensDoMenu(navegacao)}
        action={
          <BotaoMedido
            medirComo={EVENTOS.redeSocialClicada}
            local="navbar"
            size="sm"
            {...instagram}
          >
            {NAV_CTA}
          </BotaoMedido>
        }
      />

      <main id="conteudo" className="flex-1">
        <Hero
          hero={hero}
          settings={settings}
          ctaPrimario={compra}
          ctaSecundarioHref={sections.agenda ? "#programacao" : undefined}
        />

        {sections.ingressos ? <CountdownBar settings={settings} ingressos={ingressos} /> : null}

        {sections.fatos ? (
          <FactStrip
            facts={fatos.map((fato) => ({ value: fato.valor, label: fato.label }))}
            aria-label={FATOS_ARIA}
          />
        ) : null}

        <Greca tone="orange" />

        {sections.sobre ? (
          <EventoSection
            sobre={sobre}
            edicoes={edicoes}
            paginasDeEdicoes={paginasDeEdicoes()}
            settings={settings}
            secao={secao("evento")}
            showEdicoes={sections.edicoes}
          />
        ) : null}

        {trilhaGerencial ? (
          <Section tight>
            <Container>
              <Reveal>
                <HighlightPanel
                  flag={trilhaGerencial.flag}
                  eyebrow={trilhaGerencial.eyebrow}
                  title={trilhaGerencial.titulo}
                >
                  {trilhaGerencial.texto}
                </HighlightPanel>
              </Reveal>
            </Container>
          </Section>
        ) : null}

        {sections.agenda ? (
          <ProgramacaoSection
            agenda={agenda}
            palestrantes={palestrantes}
            secao={secao("programacao")}
          />
        ) : null}

        {sections.ctf ? <CtfSection ctf={ctf} secao={secao("ctf")} cta={compra} /> : null}

        {sections.palestrantes ? (
          <PalestrantesSection palestrantes={palestrantes} secao={secao("palestrantes")} />
        ) : null}

        {sections.ingressos ? (
          <IngressosSection
            ingressos={ingressos}
            beneficios={beneficios}
            secao={secao("ingressos")}
          />
        ) : null}

        {sections.participe ? (
          <ParticipeSection chamadas={chamadas} secao={secao("participe")} settings={settings} />
        ) : null}

        <Greca tone="green" />

        {/* Antes do patrocínio de propósito: quem decide verba lê a prova de
            terceiro na porta da seção que pede o investimento. */}
        {sections.imprensa ? (
          <ImprensaSection
            materias={imprensa}
            destaque={destaqueDaImprensa(imprensa)}
            secao={secao("imprensa")}
          />
        ) : null}

        {sections.patrocinio ? (
          <PatrocinioSection
            grupos={gruposPatrocinio}
            secao={secao("patrocinio")}
            kit={secao("patrocinio-kit")}
          />
        ) : null}

        <Greca tone="green" />

        {sections.local ? <LocalSection settings={settings} secao={secao("local")} /> : null}

        <Fechamento secao={secao("fechamento")} />
      </main>

      <SiteFooter settings={settings} equipe={equipe} shellFs={buildShellFs()} />

      {sections.ingressos && cheapest !== null && lote ? (
        <Dock
          headline={`Lote ${lote.lote} · a partir de ${formatPrice(cheapest)}`}
          detail={`vendas até ${formatDate(lote.validThrough)}`}
          action={
            <BotaoMedido
              medirComo={EVENTOS.ingressoClicado}
              local="dock"
              size="sm"
              href="#ingressos"
            >
              {DOCK_CTA}
            </BotaoMedido>
          }
        />
      ) : null}
    </>
  );
}
