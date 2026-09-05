import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SponsorSlot } from "./SponsorSlot";

const meta = {
  title: "Cards/SponsorSlot",
  component: SponsorSlot,
  args: { name: "Patrocinador", href: "https://example.com", tier: "Bronze" },
  // Vive dentro da seção clara, que inverte o tema localmente.
  decorators: [
    (Story) => (
      <div className="on-light text-ink max-w-[820px] bg-white p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SponsorSlot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComLogo: Story = {
  name: "Com logo",
  args: { name: "BugHunt", logo: "/images/patrocinadores/bughunt.png" },
};

/** Sem arquivo de logo o cartão cai no nome em texto. */
export const SemLogo: Story = { name: "Sem logo em arquivo" };

export const SemLink: Story = { args: { href: undefined } };

/** Cota mais alta da edição: a marca ocupa a maior das três escalas. */
export const Destaque: Story = {
  name: "Platina (destaque)",
  args: {
    name: "DISRUPTEC",
    logo: "/images/patrocinadores/disruptec.png",
    tier: "Patrocinador Platina",
    escala: "destaque",
  },
};

/** Apoio da edição, na escala reduzida: a contrapartida não é patrocínio. */
export const Reduzida: Story = {
  name: "Apoio (reduzida)",
  args: {
    name: "LATAM Airlines",
    logo: "/images/patrocinadores/latam-airlines.png",
    tier: "Apoio Cia. Aérea",
    escala: "reduzida",
  },
};

/** As três lado a lado, que é como a hierarquia se verifica. */
export const AsTresEscalas: Story = {
  name: "As três escalas",
  render: () => (
    <div className="flex flex-wrap items-center gap-5">
      <SponsorSlot
        name="DISRUPTEC"
        logo="/images/patrocinadores/disruptec.png"
        tier="Patrocinador Platina"
        escala="destaque"
      />
      <SponsorSlot
        name="BugHunt"
        logo="/images/patrocinadores/bughunt.png"
        tier="Patrocinador Bronze"
        escala="padrao"
      />
      <SponsorSlot
        name="LATAM Airlines"
        logo="/images/patrocinadores/latam-airlines.png"
        tier="Apoio Cia. Aérea"
        escala="reduzida"
      />
    </div>
  ),
};
