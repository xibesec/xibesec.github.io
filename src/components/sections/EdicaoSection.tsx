import Image from "next/image";
import { Container } from "@/components/primitives/Container";
import { Section } from "@/components/primitives/Section";
import { Eyebrow, SectionTitle } from "@/components/primitives/SectionHeader";
import { Reveal } from "@/components/primitives/Reveal";
import { Tag } from "@/components/primitives/Tag";
import { Button } from "@/components/primitives/Button";
import { Note } from "@/components/primitives/Note";
import type { LinkAlvo } from "@/lib/links";
import {
  formatDate,
  formatHour,
  paragrafos,
  type Edicao,
  type Materia,
  type Secao,
} from "@/lib/cms";

// Rótulos de dado e de navegação, mesma natureza da ficha técnica dos
// documentos. O texto editorial da página vem de `contents/`.
const DATA_LABEL = "Data";
const HORARIO_LABEL = "Horário";
const LOCAL_LABEL = "Local";
const ENDERECO_LABEL = "Endereço";
const PUBLICO_LABEL = "Público";
const ALBUM_CTA = "Ver as fotos";
const A_CONFERIR = "A conferir";
const IMPRENSA_LABEL = "Na imprensa em";
const OUTRAS_LABEL = "Outras edições";

export type EdicaoLink = { label: string; href: string };

export type EdicaoSectionProps = {
  edicao: Edicao;
  secao: Secao;
  /** Cobertura publicada no ano da edição, na ordem do conteúdo. */
  cobertura: Materia[];
  /** As demais edições e a corrente, resolvidas pela rota que renderiza. */
  outras: EdicaoLink[];
  compra: LinkAlvo;
};

function Ficha({ edicao }: { edicao: Edicao }) {
  const janela = [formatHour(edicao.startsAt), formatHour(edicao.endsAt)].filter(Boolean);

  const linhas: Array<[string, React.ReactNode]> = [
    [DATA_LABEL, formatDate(edicao.startsAt)],
    [HORARIO_LABEL, janela.length === 2 ? `${janela[0]} às ${janela[1]}` : janela[0]],
    [LOCAL_LABEL, edicao.local],
    [ENDERECO_LABEL, edicao.endereco],
    // O número existe e não foi entregue: a linha fica, declarando a pendência.
    // Ver PRODUCT.md, "Explicitamente indefinido".
    [PUBLICO_LABEL, edicao.publico === null ? <Tag>{A_CONFERIR}</Tag> : String(edicao.publico)],
  ];

  return (
    <dl className="border-line border-t pt-6">
      {linhas
        .filter(([, valor]) => Boolean(valor))
        .map(([rotulo, valor]) => (
          <div key={rotulo} className="mt-[14px] first:mt-0">
            <dt className="text-cream-3 font-mono text-[11px] tracking-[0.2em] uppercase">
              {rotulo}
            </dt>
            <dd className="text-cream-2 mt-1 text-[15px] leading-[1.6]">{valor}</dd>
          </div>
        ))}
    </dl>
  );
}

/**
 * A página de uma edição que já aconteceu. O ano ocupa a largura inteira e só
 * abaixo dele a página se divide, como na página de palestrante: o registro e a
 * prosa na coluna de leitura, a ficha do dia numa faixa estreita de dado.
 *
 * A cobertura é listada pelo ano de publicação, não como cobertura da edição:
 * uma matéria de março não fala do evento de setembro, e afirmar o vínculo
 * inventaria uma relação que a data não sustenta.
 */
export function EdicaoSection({ edicao, secao, cobertura, outras, compra }: EdicaoSectionProps) {
  const titulo = secao.titulo.replace("{ano}", String(edicao.ano));
  const abertura = [edicao.tema, formatDate(edicao.startsAt), edicao.local].filter(Boolean);

  return (
    <Section id="edicao">
      <Container>
        <Reveal as="header" className="border-line border-b pb-[clamp(28px,3.5vw,44px)]">
          {secao.eyebrow ? (
            <Eyebrow tone={secao.eyebrowTom} className="mb-[18px]">
              {secao.eyebrow}
            </Eyebrow>
          ) : null}

          <SectionTitle as="h1">{titulo}</SectionTitle>

          {abertura.length > 0 ? (
            <p className="text-mint mt-[14px] font-mono text-[12px] tracking-[0.14em] uppercase">
              {abertura.join(" · ")}
            </p>
          ) : null}
        </Reveal>
      </Container>

      <Container className="mt-[clamp(30px,4vw,52px)] grid grid-cols-[minmax(0,1fr)_minmax(0,300px)] items-start gap-[clamp(32px,5vw,72px)] max-[900px]:grid-cols-1">
        <div>
          {edicao.foto ? (
            <Reveal className="border-line relative mb-[clamp(24px,3vw,36px)] block aspect-16/10 overflow-hidden border">
              <Image
                src={edicao.foto}
                alt={titulo}
                fill
                sizes="(max-width: 900px) 100vw, 720px"
                className="object-cover"
              />
            </Reveal>
          ) : null}

          <Reveal>
            {paragrafos(edicao.resumo).map((paragrafo, index) => (
              <p
                key={index}
                className="text-cream-2 mt-[18px] max-w-[68ch] text-[16px] leading-[1.7] first:mt-0"
              >
                {paragrafo}
              </p>
            ))}
          </Reveal>

          {cobertura.length > 0 ? (
            <Reveal className="border-line mt-[clamp(32px,4vw,52px)] border-t pt-[clamp(28px,3.5vw,44px)]">
              <Eyebrow className="mb-[14px]">{`${IMPRENSA_LABEL} ${edicao.ano}`}</Eyebrow>

              <ul className="border-line border-t">
                {cobertura.map((materia) => (
                  <li key={materia.slug} className="border-line border-b">
                    <a
                      href={materia.url}
                      target="_blank"
                      rel="noopener"
                      className="ease-brand hover:bg-panel focus-visible:bg-panel block py-4 transition-colors duration-250"
                    >
                      <span className="text-cream-3 font-mono text-[11px] tracking-[0.2em] uppercase">
                        {materia.veiculo}
                      </span>
                      <span className="text-cream-2 mt-1 block text-[15px] leading-[1.6]">
                        {materia.titulo}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </Reveal>
          ) : null}

          <Reveal className="mt-[clamp(32px,4vw,52px)] flex flex-wrap items-center gap-4">
            {secao.cta ? (
              <Button {...compra} href={compra.href}>
                {secao.cta}
              </Button>
            ) : null}

            {edicao.albumUrl ? (
              <Button variant="ghost" href={edicao.albumUrl} target="_blank" rel="noopener">
                {ALBUM_CTA}
              </Button>
            ) : null}
          </Reveal>

          {secao.nota ? <Note>{secao.nota}</Note> : null}
        </div>

        <Reveal
          as="aside"
          className="max-[900px]:mt-[clamp(28px,4vw,40px)] max-[900px]:max-w-[520px]"
        >
          <Ficha edicao={edicao} />

          {outras.length > 0 ? (
            <nav aria-label={OUTRAS_LABEL} className="border-line mt-6 border-t pt-6">
              <p className="text-cream-3 font-mono text-[11px] tracking-[0.2em] uppercase">
                {OUTRAS_LABEL}
              </p>

              <ul className="mt-3 flex flex-col gap-2">
                {outras.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className="text-cream-2 ease-brand hover:text-orange hover:border-orange focus-visible:text-orange focus-visible:border-orange border-b border-transparent font-mono text-[12px] tracking-[0.14em] uppercase transition-colors duration-250"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </Reveal>
      </Container>
    </Section>
  );
}
