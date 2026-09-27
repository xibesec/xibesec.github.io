import { Container } from "@/components/primitives/Container";
import { Section } from "@/components/primitives/Section";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { NoteWithLink } from "@/components/primitives/Note";
import { Reveal } from "@/components/primitives/Reveal";
import { GaleriaGrade, type GaleriaItem } from "@/components/data/GaleriaGrade";
import { GaleriaVisor, type GaleriaVisorRotulos } from "@/components/data/GaleriaVisor";
import type { Secao } from "@/lib/cms";

// Rótulos de interface: navegação do visor, não conteúdo editorial.
const ROTULOS_VISOR: GaleriaVisorRotulos = {
  fechar: "Fechar",
  anterior: "Foto anterior",
  proxima: "Próxima foto",
  baixar: "Baixar",
};

export type GaleriaSectionProps = {
  secao: Secao;
  itens: GaleriaItem[];
};

/** A galeria inteira numa grade só, na ordem em que as fotos foram tiradas. */
export function GaleriaSection({ secao, itens }: GaleriaSectionProps) {
  return (
    <Section id="galeria">
      <Container>
        <Reveal>
          <SectionHeader
            eyebrow={secao.eyebrow}
            eyebrowTone={secao.eyebrowTom}
            title={secao.titulo}
            titleAs="h1"
            lede={secao.lede}
            slim
          />
        </Reveal>

        <GaleriaVisor rotulos={ROTULOS_VISOR}>
          <GaleriaGrade itens={itens} visor />
        </GaleriaVisor>

        <NoteWithLink
          text={secao.nota}
          label={secao.notaLinkLabel}
          href={secao.notaLinkUrl}
          className="mt-[clamp(28px,4vw,48px)]"
        />
      </Container>
    </Section>
  );
}
