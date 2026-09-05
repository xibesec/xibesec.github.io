import Image from "next/image";
import { LinkMedido } from "@/components/analytics/LinkMedido";
import { EVENTOS } from "@/lib/analytics";
import type { EscalaDaMarca } from "@/lib/content-types";
import { cn } from "@/lib/utils";

export type SponsorSlotProps = {
  name: string;
  logo?: string;
  href?: string;
  tier?: string;
  /** Tamanho da marca: a cota decide, não o componente. */
  escala?: EscalaDaMarca;
  className?: string;
};

/* Classes por extenso: o scanner do Tailwind é estático e não lê template. */
const MOLDURA: Record<EscalaDaMarca, string> = {
  destaque: "min-h-[148px] max-w-[520px] p-8",
  padrao: "min-h-[104px] max-w-[420px] p-6",
  reduzida: "min-h-[72px] w-[188px] p-4",
};

const LOGO: Record<EscalaDaMarca, string> = {
  destaque: "w-[min(260px,62%)]",
  padrao: "w-[min(200px,58%)]",
  reduzida: "w-[min(116px,66%)]",
};

const NOME: Record<EscalaDaMarca, string> = {
  destaque: "text-[18px] tracking-[0.06em]",
  padrao: "text-[16px] tracking-[0.06em]",
  reduzida: "text-[14px] tracking-[0.06em]",
};

/**
 * Marca confirmada na seção clara, que inverte o tema para receber logo em
 * arquivo com fundo branco chapado.
 *
 * A seção não exibe cota vaga: mostrar espaço reservado de patrocínio depende de
 * aval da organização, ver PRODUCT.md.
 */
export function SponsorSlot({
  name,
  logo,
  href,
  tier,
  escala = "padrao",
  className,
}: SponsorSlotProps) {
  const content = logo ? (
    <Image
      src={logo}
      alt={name}
      width={800}
      height={229}
      className={cn(
        "ease-brand h-auto transition-transform duration-300 group-hover:scale-104",
        LOGO[escala],
      )}
    />
  ) : (
    <span className={NOME[escala]}>{name}</span>
  );

  const classes = cn(
    "group border-line-2 flex items-center justify-center border text-center",
    "ease-brand transition-colors duration-300 hover:text-orange hover:border-orange",
    MOLDURA[escala],
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
