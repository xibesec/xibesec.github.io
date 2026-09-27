import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { Foto } from "@/lib/content-types";
import { GaleriaGrade, type GaleriaItem } from "./GaleriaGrade";
import { GaleriaVisor } from "./GaleriaVisor";

// Fotos reais da galeria como bancada: vertical, paisagem e panorâmica juntas,
// que é o caso que a grade justificada existe para resolver.
const AMOSTRA: Array<[string, number, number]> = [
  ["xibesec-2026-080049-b1f717", 1536, 2048],
  ["xibesec-2026-090214-756189", 2048, 1536],
  ["xibesec-2026-090826-226a64", 2048, 946],
  ["xibesec-2026-091128-3b6ade", 946, 2048],
  ["xibesec-2026-094328-d24a98", 2048, 1536],
  ["xibesec-2026-100832-345180", 2048, 1365],
  ["xibesec-2026-101437-786150", 1365, 2048],
  ["xibesec-2026-103220-086bac", 2048, 1536],
  ["xibesec-2026-103431-6e639c", 2048, 1365],
  ["xibesec-2026-093410-38aee6", 2048, 946],
];

const itens: GaleriaItem[] = AMOSTRA.map(([id, largura, altura], i) => {
  const foto: Foto = {
    slug: id,
    arquivo: `/images/galeria/2026/${id}.jpg`,
    miniatura: `/images/galeria/2026/miniaturas/${id}.webp`,
    largura,
    altura,
    capturadaEm: `2026-09-19T${id.slice(13, 15)}:${id.slice(15, 17)}:00-03:00`,
    alt: "",
    destaque: false,
    capa: false,
    order: i + 1,
  };
  return { foto, alt: `Foto ${i + 1} da bancada`, href: foto.arquivo };
});

const meta = {
  title: "Dados/GaleriaGrade",
  component: GaleriaGrade,
  args: { itens },
  decorators: [
    (Story) => (
      <div className="max-w-site mx-auto px-(--gutter) py-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GaleriaGrade>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: "Padrão" };

/** A faixa da home: poucas fotos, fileira mais alta. */
export const Alta: Story = { args: { fileira: "alta", itens: itens.slice(0, 8) } };

/** Com o visor: o clique abre a foto ampliada, e as setas do teclado trocam. */
export const ComVisor: Story = {
  name: "Com visor",
  args: { visor: true },
  render: (args) => (
    <GaleriaVisor
      rotulos={{
        fechar: "Fechar",
        anterior: "Foto anterior",
        proxima: "Próxima foto",
        baixar: "Baixar",
      }}
    >
      <GaleriaGrade {...args} />
    </GaleriaVisor>
  ),
};
