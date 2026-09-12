import type { ReactNode } from "react";
import { Tag } from "@/components/primitives/Tag";
import { cn } from "@/lib/utils";

const hour = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Belem",
});

/**
 * As abas do celular são `radio` + `:has()`, não estado de cliente. Os ids
 * viajam do `input` até a regra de CSS em `globals.css`, e por isso são fixos:
 * a grade aparece uma vez por página.
 */
const ABA_ID: Record<string, string> = {
  tecnica: "grade-tecnica",
  gerencial: "grade-gerencial",
};

/** Colunas do desktop, e a régua que o cabeçalho e as faixas compartilham. */
const COLUNAS = "grid-cols-[104px_1fr_1fr] max-[900px]:grid-cols-1";

export type Sala = { trilha: string; label: string };

export type AgendaGradeProps = {
  salas: Sala[];
  children: ReactNode;
  className?: string;
};

/**
 * Grade de duas salas em paralelo: a hora à esquerda, uma coluna por trilha.
 * O filete de 1px é o fundo, e cada célula é um bloco opaco por cima, então a
 * malha inteira sai do `gap` sem uma única borda desenhada.
 *
 * Abaixo de 900px as colunas não cabem lado a lado e viram uma só, com as abas
 * escolhendo a trilha. Ver a regra `.grade` em `globals.css`.
 */
export function AgendaGrade({ salas, children, className }: AgendaGradeProps) {
  return (
    <div className={cn("grade", className)}>
      <fieldset className="mb-6 hidden max-[900px]:block">
        <legend className="sr-only">Escolha a trilha</legend>

        <div className="flex gap-2">
          {salas.map((sala, i) => (
            <div key={sala.trilha} className="contents">
              <input
                type="radio"
                name="grade-trilha"
                id={ABA_ID[sala.trilha]}
                defaultChecked={i === 0}
                className="peer sr-only"
              />
              <label
                htmlFor={ABA_ID[sala.trilha]}
                className={cn(
                  "border-line-2 text-cream-3 cursor-pointer border px-3.5 py-2.5",
                  "font-mono text-[11px] tracking-[0.14em] uppercase",
                  "ease-brand transition-colors duration-250",
                  "peer-checked:bg-orange peer-checked:border-orange peer-checked:text-ink",
                  "peer-focus-visible:outline-mint peer-focus-visible:outline-2",
                  "peer-focus-visible:outline-offset-3",
                )}
              >
                {sala.label}
              </label>
            </div>
          ))}
        </div>
      </fieldset>

      {/* Só a coluna é o rótulo da trilha no desktop: dentro de cada célula ele
          viraria uma etiqueta repetida vinte vezes. Leitor de tela recebe o
          rótulo pela célula, em `AgendaCell`. */}
      <div aria-hidden="true" className={cn("mb-3.5 grid gap-px max-[900px]:hidden", COLUNAS)}>
        <span />
        {salas.map((sala) => (
          <p
            key={sala.trilha}
            className="text-cream-3 pl-5 font-mono text-[11px] tracking-[0.24em] uppercase"
          >
            {sala.label}
          </p>
        ))}
      </div>

      <ol className={cn("bg-line border-line grid gap-px border-y", COLUNAS)}>{children}</ol>
    </div>
  );
}

export type AgendaFaixaProps = {
  /** ISO com offset. String livre não ordena nem calcula duração. */
  startsAt: string;
  /** A única trilha ocupada na faixa: some quando a outra aba está ativa. */
  unica?: "tecnica" | "gerencial" | null;
  children: ReactNode;
};

/** Uma faixa de horário: a hora e o que está acontecendo em cada sala. */
export function AgendaFaixa({ startsAt, unica, children }: AgendaFaixaProps) {
  return (
    <li
      data-unica={unica ?? undefined}
      className={cn(
        "col-span-full grid grid-cols-subgrid gap-px",
        "max-[900px]:grid-cols-1 max-[900px]:gap-0",
      )}
    >
      <time
        dateTime={startsAt}
        className={cn(
          "text-mint bg-ink py-7 pr-5 pl-1 font-mono text-[19px] tabular-nums",
          "max-[900px]:px-1 max-[900px]:pt-6 max-[900px]:pb-1",
        )}
      >
        {hour.format(new Date(startsAt))}
      </time>

      {children}
    </li>
  );
}

export type AgendaCellProps = {
  /** Ausente na atividade comum às duas salas, que ocupa a faixa inteira. */
  trilha?: "tecnica" | "gerencial";
  /** Rótulo da trilha, dito só para quem não enxerga a coluna. */
  trilhaLabel?: string;
  /** Ausente na palestra cujo tema a pessoa ainda não enviou. */
  title?: string;
  /** Nome de quem palestra, ou a composição do painel. */
  speaker?: string;
  /** Perfil de quem palestra. Ausente, o nome fica em texto. */
  speakerHref?: string;
  /** Governa só como a pendência se chama quando não há título. */
  tipo?: string;
  children?: ReactNode;
  status?: "confirmado" | "em-definicao";
};

const CELULA = "bg-ink px-5 py-7 max-[900px]:px-1 max-[900px]:pt-0 max-[900px]:pb-6";

/**
 * Estado de pendência do título. Painel e palestra são coisas diferentes na
 * grade, e a faixa sem tema anuncia o que a organização já marcou que é.
 */
const SEM_TITULO: Record<string, string> = {
  painel: "Painel em definição",
  palestra: "Palestra em definição",
};

/** O que acontece em uma sala, dentro de uma faixa de horário. */
export function AgendaCell({
  trilha,
  trilhaLabel,
  title,
  speaker,
  speakerHref,
  children,
  status = "confirmado",
  titlePlaceholder = "Palestra em definição",
}: AgendaCellProps) {
  return (
    // O `col-span-2` precisa voltar a 1 na coluna única: numa grade de uma
    // faixa só, `span 2` inventa uma segunda coluna e a grade estoura a tela.
    <div
      data-trilha={trilha}
      className={cn(CELULA, trilha ? undefined : "col-span-2 max-[900px]:col-span-1")}
    >
      {trilhaLabel ? <p className="sr-only">{trilhaLabel}</p> : null}

      <h3
        className={cn(
          "font-display text-[17px] leading-[1.25] font-bold",
          title ? null : "text-cream-3",
        )}
      >
        {title || titlePlaceholder}
      </h3>

      {speaker ? (
        <p className="text-cream-2 mt-2.5 text-[15px] leading-[1.6]">
          {speakerHref ? (
            <a href={speakerHref} className="hover:text-mint ease-brand underline duration-280">
              {speaker}
            </a>
          ) : (
            speaker
          )}
        </p>
      ) : null}

      {children ? (
        <p className="text-cream-3 mt-2.5 text-[15px] leading-[1.6]">{children}</p>
      ) : null}

      {status === "em-definicao" ? (
        <p className="mt-4">
          <Tag>Em definição</Tag>
        </p>
      ) : null}
    </div>
  );
}

/**
 * Sala sem atividade na faixa. O bloco opaco fecha a malha de 1px; vazia, a
 * célula diz que naquele horário aquela sala não tem nada, que é o que a grade
 * da organização declara. No celular não há coluna vizinha, e ela some.
 */
export function AgendaCellVazia({ trilha }: { trilha: "tecnica" | "gerencial" }) {
  return <div data-trilha={trilha} className="bg-ink max-[900px]:hidden" />;
}
