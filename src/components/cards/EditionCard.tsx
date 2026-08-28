import Image from "next/image";
import { PendingSlot } from "@/components/primitives/PendingSlot";
import { cn } from "@/lib/utils";

export type EditionCardProps = {
  year: number;
  title: string;
  /** Legenda à direita. Ausente a foto, declara a pendência. */
  caption?: string;
  photo?: string;
  /** Página da edição. Ausente, o título fica em texto. */
  href?: string;
  id?: string;
  /** Índice na pilha: controla o recuo do sticky e a inclinação. */
  index?: number;
  /** Registro no topo da pilha agora. */
  active?: boolean;
  className?: string;
  /** Marcador usado pelo bloco de edições para localizar as cartas. */
  "data-carta"?: string;
};

/**
 * Registro de uma edição anterior. A moldura de 12px imita a margem de uma foto
 * revelada. Sem `photo` entra o espaço reservado — as fotos existem mas ainda
 * não foram entregues, e não se substitui por ilustração ou stock.
 */
export function EditionCard({
  year,
  title,
  caption = "Registro em curadoria",
  photo,
  href,
  id,
  index = 0,
  active = false,
  className,
  ...rest
}: EditionCardProps) {
  return (
    <figure
      id={id}
      // A inclinação sai do fluxo do Tailwind e vem por estilo: `active` e o
      // hover precisam zerá-la, e três utilities de rotate competindo por
      // especificidade não têm ordem garantida.
      style={
        {
          "--i": index,
          "--tilt": active ? "0deg" : `${(index - 1) * 1.6}deg`,
        } as React.CSSProperties
      }
      className={cn(
        "bg-ink border-line m-0 rotate-(--tilt) border",
        "ease-brand transition-transform duration-400 hover:rotate-0",
        active && "border-mint",
        className,
      )}
      {...rest}
    >
      <div className="mx-3 mt-3">
        {photo ? (
          <div className="relative aspect-16/10">
            <Image src={photo} alt={title} fill className="object-cover" sizes="640px" />
          </div>
        ) : (
          <PendingSlot mark={String(year)} label={`${title}: ${caption}`} />
        )}
      </div>

      <figcaption className="flex items-baseline justify-between gap-4 px-3 pt-3.5 pb-3">
        {href ? (
          <a
            href={href}
            className="text-cream ease-brand hover:text-orange focus-visible:text-orange text-[16px] font-bold transition-colors duration-250"
          >
            {title}
          </a>
        ) : (
          <b className="text-cream text-[16px] font-bold">{title}</b>
        )}
        {/* Com a foto no lugar, a legenda de pendência não tem mais o que
            declarar: sobra o ano, que é dado, e vai em menta. */}
        <span
          className={cn(
            "font-mono text-[11px] tracking-[0.2em] uppercase",
            photo ? "text-mint tabular-nums" : "text-cream-3",
          )}
        >
          {photo ? year : caption}
        </span>
      </figcaption>
    </figure>
  );
}
