import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EdicoesBloco } from "./EdicoesBloco";
import { SectionTitle } from "@/components/primitives/SectionHeader";

const meta = {
  title: "Dados/EdicoesBloco",
  component: EdicoesBloco,
  parameters: { layout: "fullscreen" },
  args: {
    edicoes: [
      { ano: 2023, tema: "Primeira edição", href: "/edicao/2023/" },
      { ano: 2024, tema: "Segunda edição", href: "/edicao/2024/" },
      { ano: 2025, tema: "Terceira edição", href: "/edicao/2025/" },
    ],
    atual: { year: 2026, label: "Quarta edição", detail: "19 de setembro", current: true },
    edicoesLabel: "Edições",
    registroPendente: "registro em curadoria",
    paginaLabel: "Ver a",
    children: (
      <>
        <SectionTitle as="h3" size="md" className="mb-1.5">
          Origem do nome.
        </SectionTitle>
        <p className="text-cream-2 mt-[18px] text-[16px] leading-[1.7]">
          Texto de apoio da coluna esquerda, que fica fixo enquanto o baralho rola.
        </p>
      </>
    ),
  },
  decorators: [
    (Story) => (
      <div className="bg-panel -m-8 p-8">
        <div className="grid grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] items-start gap-[clamp(36px,5vw,72px)] max-[900px]:grid-cols-1">
          <Story />
        </div>
        {/* Altura para exercitar a pilha e a linha de leitura. */}
        <div className="h-[120vh]" />
      </div>
    ),
  ],
} satisfies Meta<typeof EdicoesBloco>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Role para ver as cartas encavalarem: a que cruza a linha de leitura ganha borda
 * menta e sua linha na lista acende. Clicar numa linha mede o fluxo real com o
 * sticky desligado antes de rolar.
 */
export const Padrao: Story = { name: "Padrão" };
