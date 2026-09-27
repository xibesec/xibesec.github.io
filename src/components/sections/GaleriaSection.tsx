import { Container } from "@/components/primitives/Container";
import { Section } from "@/components/primitives/Section";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { NoteWithLink } from "@/components/primitives/Note";
import { Reveal } from "@/components/primitives/Reveal";
import { GaleriaGrade, type GaleriaItem } from "@/components/data/GaleriaGrade";
import { GaleriaVisor, type GaleriaVisorRotulos } from "@/components/data/GaleriaVisor";
import type { HoraDaGaleria, Secao } from "@/lib/cms";

// Rótulos de interface: navegação do visor e das horas, não conteúdo editorial.
const HORAS_ARIA = "Ir para uma hora do dia";
const SEM_HORARIO = "Sem horário";
const ROTULOS_VISOR: GaleriaVisorRotulos = {
  fechar: "Fechar",
  anterior: "Foto anterior",
  proxima: "Próxima foto",
  baixar: "Baixar",
};

const rotuloDaHora = (hora: number | null) =>
  hora === null ? SEM_HORARIO : `${String(hora).padStart(2, "0")}h`;
const ancoraDaHora = (hora: number | null) => (hora === null ? "sem-horario" : `h${hora}`);
const contagem = (n: number) => `${n} ${n === 1 ? "foto" : "fotos"}`;

export type GaleriaSectionProps = {
  secao: Secao;
  horas: Array<Omit<HoraDaGaleria, "fotos"> & { itens: GaleriaItem[] }>;
};

/**
 * A galeria inteira, contada pelas horas do dia. A hora vai em menta, que é o
 * papel dela no sistema, e o índice do topo leva a qualquer uma: com centenas de
 * fotos, quem procura "a foto do painel da tarde" não rola desde o café.
 */
export function GaleriaSection({ secao, horas }: GaleriaSectionProps) {
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

        {horas.length > 1 ? (
          <nav
            aria-label={HORAS_ARIA}
            className="border-line mb-[clamp(24px,3vw,40px)] flex flex-wrap gap-x-5 gap-y-2 border-y py-3"
          >
            {horas.map(({ hora, itens }) => (
              <a
                key={ancoraDaHora(hora)}
                href={`#${ancoraDaHora(hora)}`}
                className="text-mint hover:text-cream focus-visible:text-cream ease-brand font-mono text-[12px] tracking-[0.16em] uppercase transition-colors duration-250"
              >
                {rotuloDaHora(hora)}
                <span className="text-cream-3 ml-1.5">{itens.length}</span>
              </a>
            ))}
          </nav>
        ) : null}

        <GaleriaVisor rotulos={ROTULOS_VISOR} className="flex flex-col gap-[clamp(28px,4vw,52px)]">
          {horas.map(({ hora, itens }) => (
            <section
              key={ancoraDaHora(hora)}
              id={ancoraDaHora(hora)}
              aria-labelledby={`${ancoraDaHora(hora)}-titulo`}
              className="scroll-mt-[calc(var(--nav-h)+16px)]"
            >
              <header className="mb-3 flex items-baseline gap-4">
                <h2
                  id={`${ancoraDaHora(hora)}-titulo`}
                  className="text-mint font-mono text-[15px] font-bold tracking-[0.12em]"
                >
                  {rotuloDaHora(hora)}
                </h2>
                <p className="text-cream-3 font-mono text-[11px] tracking-[0.2em] uppercase">
                  {contagem(itens.length)}
                </p>
              </header>
              <GaleriaGrade itens={itens} visor />
            </section>
          ))}
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
