import { Container } from "@/components/primitives/Container";
import { Section } from "@/components/primitives/Section";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Reveal } from "@/components/primitives/Reveal";
import { NoteWithLink } from "@/components/primitives/Note";
import {
  AgendaCell,
  AgendaCellVazia,
  AgendaFaixa,
  AgendaGrade,
} from "@/components/data/AgendaGrade";
import type { AgendaItem, Palestrante, Secao } from "@/lib/cms";
import { TRILHAS_EM_PARALELO, TRILHA_LABEL, faixasDaGrade } from "@/lib/cms";
import { palestrantePath } from "@/lib/site";

export type ProgramacaoSectionProps = {
  agenda: AgendaItem[];
  /** Quem tem perfil publicado: só esses nomes viram link na grade. */
  palestrantes: Palestrante[];
  secao: Secao;
};

export function ProgramacaoSection({ agenda, palestrantes, secao }: ProgramacaoSectionProps) {
  const comPerfil = new Set(palestrantes.map((pessoa) => pessoa.slug));
  const faixas = faixasDaGrade(agenda);

  const salas = TRILHAS_EM_PARALELO.map((trilha) => ({
    trilha,
    label: TRILHA_LABEL[trilha],
  }));

  // A linha não linka: a rota de detalhe `/programacao/<slug>` ainda não existe
  // em `app/`, e âncora para 404 é pior que texto. Quem tem perfil publicado
  // ganha o link no próprio nome.
  const celula = (item: AgendaItem, trilha?: "tecnica" | "gerencial") => (
    <AgendaCell
      key={trilha ?? "comum"}
      trilha={trilha}
      trilhaLabel={trilha ? TRILHA_LABEL[trilha] : undefined}
      title={item.titulo}
      speaker={item.palestrante}
      speakerHref={comPerfil.has(item.speakerSlug) ? palestrantePath(item.speakerSlug) : undefined}
      status={item.status}
    >
      {item.descricao}
    </AgendaCell>
  );

  return (
    <Section id="programacao">
      <Container>
        <Reveal>
          <SectionHeader
            eyebrow={secao.eyebrow}
            eyebrowTone={secao.eyebrowTom}
            title={secao.titulo}
            lede={secao.lede}
            alignEnd
          />
        </Reveal>

        {/* O reveal envolve a grade inteira: `AgendaFaixa` já é o `<li>`, e um
            wrapper por faixa aninharia lista dentro de item de lista. */}
        <Reveal>
          <AgendaGrade salas={salas}>
            {faixas.map((faixa) => (
              <AgendaFaixa key={faixa.startsAt} startsAt={faixa.startsAt} unica={faixa.unica}>
                {faixa.comum
                  ? celula(faixa.comum)
                  : TRILHAS_EM_PARALELO.map((trilha) => {
                      const item = faixa[trilha];
                      return item ? (
                        celula(item, trilha)
                      ) : (
                        <AgendaCellVazia key={trilha} trilha={trilha} />
                      );
                    })}
              </AgendaFaixa>
            ))}
          </AgendaGrade>
        </Reveal>

        <NoteWithLink text={secao.nota} label={secao.notaLinkLabel} href={secao.notaLinkUrl} />
      </Container>
    </Section>
  );
}
