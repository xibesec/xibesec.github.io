import Image from "next/image";
import { asset } from "@/lib/site";
import { cn } from "@/lib/utils";
import { horarioDaFoto, type Foto } from "@/lib/content-types";

export type GaleriaItem = {
  foto: Foto;
  /** Texto alternativo já resolvido: o `alt` do conteúdo ou a legenda de repouso. */
  alt: string;
  /** Destino do clique. Na galeria, a própria foto ampliada; na home, a foto dentro da galeria. */
  href: string;
};

export type GaleriaGradeProps = {
  itens: GaleriaItem[];
  /** `alta` para a faixa da home, que mostra poucas fotos e pede mais presença. */
  fileira?: "normal" | "alta";
  /** Marca cada link para o visor. Fora da galeria o clique segue o link. */
  visor?: boolean;
  className?: string;
};

const FILEIRA: Record<NonNullable<GaleriaGradeProps["fileira"]>, string> = {
  // O piso decide o celular: acima de ~115px duas paisagens não cabem nos 358px
  // úteis de uma tela de 390, e a galeria vira uma foto por fileira.
  normal: "[--fila:clamp(110px,17vw,240px)]",
  alta: "[--fila:clamp(115px,15.5vw,220px)]",
};

/**
 * Grade justificada: cada foto cresce na proporção da própria largura, e toda
 * fileira fecha na medida do contêiner. Sai em CSS puro, com a proporção no
 * `flex-grow`, e por isso vertical, paisagem e panorâmica dividem a linha sem
 * espaço morto nem JavaScript de layout.
 *
 * Quando a foto seguinte não cabe, as que ficaram crescem para fechar a linha,
 * e duas paisagens sozinhas sairiam com quase o dobro da altura das vizinhas. O
 * teto de 1,35× segura a fileira, e só nesse caso a foto perde um pouco das
 * bordas, pelo centro. O `min-w-0` é parte do teto: sem ele o flex transfere a
 * altura máxima pela proporção e trava uma largura mínima em cada foto, e a
 * fileira que cabia três passa a caber duas.
 *
 * Cada miniatura é link para o arquivo ampliado: sem JavaScript a galeria já
 * funciona, e o visor só intercepta o clique.
 */
export function GaleriaGrade({
  itens,
  fileira = "normal",
  visor = false,
  className,
}: GaleriaGradeProps) {
  return (
    <ul className={cn("flex flex-wrap gap-[3px]", FILEIRA[fileira], className)}>
      {itens.map(({ foto, alt, href }) => {
        const proporcao = foto.largura / foto.altura;
        return (
          <li
            key={foto.slug}
            id={visor ? foto.slug : undefined}
            className="bg-panel relative min-w-0 overflow-hidden"
            style={{
              flexGrow: proporcao,
              flexBasis: `calc(var(--fila) * ${proporcao.toFixed(4)})`,
            }}
          >
            <a
              href={href}
              data-foto={visor ? foto.slug : undefined}
              data-horario={visor ? horarioDaFoto(foto) || undefined : undefined}
              className="group block focus-visible:outline-offset-[-3px]"
            >
              <Image
                src={asset(foto.miniatura)}
                alt={alt}
                width={foto.largura}
                height={foto.altura}
                loading="lazy"
                className="ease-brand block h-auto max-h-[calc(var(--fila)*1.35)] w-full object-cover transition-[transform,opacity] duration-500 group-hover:scale-[1.03] group-hover:opacity-90"
                style={{ aspectRatio: `${foto.largura} / ${foto.altura}` }}
              />
            </a>
          </li>
        );
      })}
      {/* Absorve a sobra da última fileira. Sem ele as fotos que restam esticam
          até a borda e saem no dobro da altura das de cima. */}
      <li aria-hidden="true" className="grow-[1000] basis-0" />
    </ul>
  );
}
