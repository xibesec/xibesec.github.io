import { Container } from "@/components/primitives/Container";
import { Section } from "@/components/primitives/Section";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Reveal } from "@/components/primitives/Reveal";
import { Button } from "@/components/primitives/Button";
import { KitBanner } from "@/components/primitives/KitBanner";
import { SponsorSlot } from "@/components/cards/SponsorSlot";
import { asset } from "@/lib/site";
import { externo } from "@/lib/links";
import { escalaDaCota } from "@/lib/cms";
import type { Cota, EscalaDaMarca, Patrocinador, Secao } from "@/lib/cms";

export type PatrocinioSectionProps = {
  grupos: Array<{ cota: Cota; patrocinadores: Patrocinador[] }>;
  secao: Secao;
  kit: Secao;
  /** `h1` na rota dedicada, onde a seção é o assunto da página. */
  titleAs?: "h1" | "h2";
};

/* Apoio não divide a grade com quem pagou cota: a coluna `1fr` esticaria a
   marca até a largura de um patrocinador. */
const GRADE: Record<EscalaDaMarca, string> = {
  destaque: "grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5",
  padrao: "grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-5",
  reduzida: "flex flex-wrap gap-5",
};

/**
 * Única seção clara do site. A inversão existe porque as marcas chegam em
 * arquivo com fundo branco chapado e não podem ser recortadas.
 *
 * A seção mostra só patrocinador confirmado — não anuncia cota vaga. Ver
 * PRODUCT.md.
 */
export function PatrocinioSection({ grupos, secao, kit, titleAs }: PatrocinioSectionProps) {
  return (
    <Section id="patrocinio" variant="light">
      <Container>
        <Reveal>
          <SectionHeader
            eyebrow={secao.eyebrow}
            eyebrowTone={secao.eyebrowTom}
            title={secao.titulo}
            titleAs={titleAs}
            lede={secao.lede}
            alignEnd
          />
        </Reveal>

        {grupos.map((grupo) => {
          const escala = escalaDaCota(grupo.cota);

          return (
            <Reveal key={grupo.cota.nome} className="mb-10">
              <p className="text-cream mb-3.5 font-mono text-[12px] tracking-[0.16em] uppercase">
                {grupo.cota.label}
              </p>

              <div className={GRADE[escala]}>
                {grupo.patrocinadores.map((patrocinador) => (
                  <SponsorSlot
                    key={patrocinador.slug}
                    name={patrocinador.nome}
                    logo={patrocinador.logo ? asset(patrocinador.logo) : undefined}
                    href={patrocinador.url}
                    tier={grupo.cota.label}
                    escala={escala}
                  />
                ))}
              </div>
            </Reveal>
          );
        })}

        <Reveal>
          <KitBanner
            title={kit.titulo}
            actions={kit.ctaUrl ? <Button {...externo(kit.ctaUrl)}>{kit.cta}</Button> : undefined}
          >
            {kit.lede}
          </KitBanner>
        </Reveal>
      </Container>
    </Section>
  );
}
