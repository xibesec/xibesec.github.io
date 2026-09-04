import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SponsorSlot } from "./SponsorSlot";

const meta = {
  title: "Cards/SponsorSlot",
  component: SponsorSlot,
  args: { name: "Patrocinador", href: "https://example.com", tier: "Bronze" },
  // Vive dentro da seção clara, que inverte o tema localmente.
  decorators: [
    (Story) => (
      <div className="on-light text-ink max-w-[520px] bg-white p-8">
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

/** Apoio da edição, em escala reduzida: a contrapartida não é patrocínio. */
export const Compacto: Story = {
  name: "Apoio (compacto)",
  args: {
    name: "LATAM Airlines",
    logo: "/images/patrocinadores/latam-airlines.png",
    tier: "Apoio Cia. Aérea",
    compacto: true,
  },
};
