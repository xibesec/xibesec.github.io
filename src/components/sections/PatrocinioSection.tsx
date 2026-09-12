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

type Grupo = { cota: Cota; patrocinadores: Patrocinador[] };

export type PatrocinioSectionProps = {
  grupos: Grupo[];
  secao: Secao;
  kit: Secao;
  /** `h1` na rota dedicada, onde a seção é o assunto da página. */
  titleAs?: "h1" | "h2";
};

/* O piso da coluna é a largura abaixo da qual o logo para de ler, não a
   hierarquia da cota, que mora na moldura do `SponsorSlot`. Piso baixo demais
   cabe a cota inteira numa fileira só e encolhe cada marca: com seis marcas
   bronze, 300px quebra a fileira em duas de três em vez de espremer as seis. */
const GRADE: Record<EscalaDaMarca, string> = {
  principal: "grid grid-cols-[repeat(auto-fit,minmax(340px,1fr))] gap-5",
  destaque: "grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5",
  padrao: "grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5",
  reduzida: "grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5",
};

/**
 * Apoio ocupa meia coluna da mesma grade, em pares dentro de uma célula. É o
 * que mantém a marca menor que a de quem pagou cota sem soltá-la da malha: com
 * largura fixa fora da grade, a fileira fecha alguns pixels antes da coluna de
 * cima e todo filete desalinha. O par não depende de quantas colunas a grade
 * abriu, então a fileira reflui sozinha.
 */
function emPares(marcas: Patrocinador[]): Patrocinador[][] {
  const pares: Patrocinador[][] = [];
  for (let i = 0; i < marcas.length; i += 2) pares.push(marcas.slice(i, i + 2));
  return pares;
}

/**
 * Única seção clara do site. A inversão existe porque as marcas chegam em
 * arquivo com fundo branco chapado e não podem ser recortadas.
 *
 * A seção mostra só patrocinador confirmado, nunca cota vaga. Ver PRODUCT.md.
 */
export function PatrocinioSection({ grupos, secao, kit, titleAs }: PatrocinioSectionProps) {
  const pagos = grupos.filter((grupo) => !grupo.cota.apoio);
  const apoios = grupos.filter((grupo) => grupo.cota.apoio);

  const grade = (grupo: Grupo, className: string) => {
    const escala = escalaDaCota(grupo.cota);

    const slot = (patrocinador: Patrocinador) => (
      <SponsorSlot
        key={patrocinador.slug}
        name={patrocinador.nome}
        logo={patrocinador.logo ? asset(patrocinador.logo) : undefined}
        href={patrocinador.url}
        tier={grupo.cota.label}
        escala={escala}
      />
    );

    return (
      <Reveal key={grupo.cota.nome} className={className}>
        <p className="text-cream mb-3.5 font-mono text-[12px] tracking-[0.16em] uppercase">
          {grupo.cota.label}
        </p>

        <div className={GRADE[escala]}>
          {escala === "reduzida"
            ? emPares(grupo.patrocinadores).map((par) => (
                <div key={par[0].slug} className="grid grid-cols-2 gap-5">
                  {par.map(slot)}
                </div>
              ))
            : grupo.patrocinadores.map(slot)}
        </div>
      </Reveal>
    );
  };

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

        {pagos.map((grupo) => grade(grupo, "mb-10"))}

        {/* O convite fecha a lista de cotas, que é a quem ele se dirige. Apoio
            vem depois porque não é cota vendida. */}
        <Reveal>
          <KitBanner
            title={kit.titulo}
            actions={kit.ctaUrl ? <Button {...externo(kit.ctaUrl)}>{kit.cta}</Button> : undefined}
          >
            {kit.lede}
          </KitBanner>
        </Reveal>

        {apoios.map((grupo) => grade(grupo, "mt-[clamp(32px,4vw,56px)]"))}
      </Container>
    </Section>
  );
}
