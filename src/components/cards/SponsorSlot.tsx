import Image from "next/image";
import { LinkMedido } from "@/components/analytics/LinkMedido";
import { EVENTOS } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export type SponsorSlotProps = {
  name: string;
  logo?: string;
  href?: string;
  tier?: string;
  /** Apoio: marca em escala reduzida, abaixo de quem patrocinou a edição. */
  compacto?: boolean;
  className?: string;
};

/**
 * Marca confirmada na seção clara, que inverte o tema para receber logo em
 * arquivo com fundo branco chapado.
 *
 * A seção não exibe cota vaga: mostrar espaço reservado de patrocínio depende de
 * aval da organização, ver PRODUCT.md.
 */
export function SponsorSlot({ name, logo, href, tier, compacto, className }: SponsorSlotProps) {
  const content = logo ? (
    <Image
      src={logo}
      alt={name}
      width={800}
      height={229}
      className={cn(
        "ease-brand h-auto transition-transform duration-300 group-hover:scale-104",
        compacto ? "w-[min(116px,66%)]" : "w-[min(200px,58%)]",
      )}
    />
  ) : (
    <span className={compacto ? "text-[14px] tracking-[0.06em]" : "text-[16px] tracking-[0.06em]"}>
      {name}
    </span>
  );

  const classes = cn(
    "group border-line-2 flex items-center justify-center border text-center",
    "ease-brand transition-colors duration-300 hover:text-orange hover:border-orange",
    compacto ? "min-h-[72px] w-[188px] p-4" : "min-h-[104px] max-w-[420px] p-6",
    className,
  );

  return href ? (
    <LinkMedido
      medirComo={EVENTOS.patrocinadorClicado}
      dados={{ nome: name, ...(tier ? { cota: tier } : {}) }}
      href={href}
      target="_blank"
      rel="noopener"
      className={classes}
      /* O rótulo já diz o que a marca é: prefixar "patrocinador" chamaria
         apoio de cota vendida em leitor de tela. */
      aria-label={tier ? `${name}, ${tier} (abre em nova aba)` : name}
    >
      {content}
    </LinkMedido>
  ) : (
    <div className={classes}>{content}</div>
  );
}
