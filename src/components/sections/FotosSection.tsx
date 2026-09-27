import { Button } from "@/components/primitives/Button";
import { Container } from "@/components/primitives/Container";
import { Reveal } from "@/components/primitives/Reveal";
import { Section } from "@/components/primitives/Section";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { GaleriaGrade, type GaleriaItem } from "@/components/data/GaleriaGrade";
import type { Secao } from "@/lib/cms";

export type FotosSectionProps = {
  secao: Secao;
  itens: GaleriaItem[];
  href: string;
};

/**
 * A faixa de fotos da home, logo abaixo dos números: com o evento encerrado, a
 * prova de que ele aconteceu vale mais que a promessa do que ele seria. Cada
 * foto abre na galeria já ampliada, e o botão leva ao dia inteiro.
 */
export function FotosSection({ secao, itens, href }: FotosSectionProps) {
  if (itens.length === 0) return null;

  return (
    <Section id="fotos">
      <Container>
        <Reveal>
          <SectionHeader
            eyebrow={secao.eyebrow}
            eyebrowTone={secao.eyebrowTom}
            title={secao.titulo}
            lede={secao.lede}
            alignEnd
            slim
          />
        </Reveal>

        <GaleriaGrade itens={itens} fileira="alta" />

        {secao.cta ? (
          <div className="mt-[clamp(24px,3vw,36px)]">
            <Button href={href} variant="ghost" arrow>
              {secao.cta}
            </Button>
          </div>
        ) : null}
      </Container>
    </Section>
  );
}
