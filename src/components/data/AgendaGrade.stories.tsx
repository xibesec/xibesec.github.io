import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AgendaCell, AgendaCellVazia, AgendaFaixa, AgendaGrade } from "./AgendaGrade";

const salas = [
  { trilha: "tecnica", label: "Técnica" },
  { trilha: "gerencial", label: "Gerencial" },
];

const meta = {
  title: "Dados/AgendaGrade",
  component: AgendaGrade,
  // As faixas entram por `render` em cada story: a grade não tem um estado
  // único de bancada, e sim uma composição por caso.
  args: { salas, children: null },
} satisfies Meta<typeof AgendaGrade>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Abaixo de 900px as colunas viram uma só e as abas escolhem a trilha. Vale
 * estreitar a bancada para ver o filtro trabalhar.
 */
export const Grade: Story = {
  render: (args) => (
    <AgendaGrade {...args}>
      <AgendaFaixa startsAt="2026-09-19T09:00:00-03:00">
        <AgendaCell title="Credenciamento">Retirada do crachá e entrada nas salas.</AgendaCell>
      </AgendaFaixa>

      <AgendaFaixa startsAt="2026-09-19T09:45:00-03:00" unica="tecnica">
        <AgendaCell
          trilha="tecnica"
          trilhaLabel="Técnica"
          title="Exercising Threat Hunting & Breach Simulations usando VECTR"
          speaker="Bruno Guerreiro"
          speakerHref="#"
        />
        <AgendaCellVazia trilha="gerencial" />
      </AgendaFaixa>

      <AgendaFaixa startsAt="2026-09-19T10:30:00-03:00">
        <AgendaCell
          trilha="tecnica"
          trilhaLabel="Técnica"
          title="Algoritmos não são neutros: racismo, IA e responsabilidade jurídica"
          speaker="Lorena Pantoja"
          speakerHref="#"
        />
        <AgendaCell
          trilha="gerencial"
          trilhaLabel="Gerencial"
          tipo="painel"
          status="em-definicao"
        />
      </AgendaFaixa>

      <AgendaFaixa startsAt="2026-09-19T14:10:00-03:00">
        <AgendaCell trilha="tecnica" trilhaLabel="Técnica" status="em-definicao" />
        <AgendaCell
          trilha="gerencial"
          trilhaLabel="Gerencial"
          title="IA e cibersegurança: entre estratégia, risco e decisão"
          speaker="Mediação de Wolmer Godoi, com Artemisia Weyl, Augusto Ribeiro e Jhovan Terra."
        />
      </AgendaFaixa>

      <AgendaFaixa startsAt="2026-09-19T18:10:00-03:00">
        <AgendaCell title="Encerramento e sorteios">
          Agradecimentos, sorteios e o convite para a próxima edição.
        </AgendaCell>
      </AgendaFaixa>
    </AgendaGrade>
  ),
};

/** Indefinido é declarado, nunca preenchido com invenção. */
export const EmDefinicao: Story = {
  name: "Em definição",
  render: (args) => (
    <AgendaGrade {...args}>
      <AgendaFaixa startsAt="2026-09-19T14:10:00-03:00">
        <AgendaCell trilha="tecnica" trilhaLabel="Técnica" status="em-definicao" />
        <AgendaCell
          trilha="gerencial"
          trilhaLabel="Gerencial"
          tipo="painel"
          status="em-definicao"
        />
      </AgendaFaixa>
    </AgendaGrade>
  ),
};

/** Sala fechada: a célula vazia fecha a malha sem afirmar nada. */
export const SalaVazia: Story = {
  name: "Sala sem atividade",
  render: (args) => (
    <AgendaGrade {...args}>
      <AgendaFaixa startsAt="2026-09-19T17:30:00-03:00" unica="tecnica">
        <AgendaCell
          trilha="tecnica"
          trilhaLabel="Técnica"
          title="Old dogs old tricks!"
          speaker="Felipe Pr0teus"
          speakerHref="#"
        />
        <AgendaCellVazia trilha="gerencial" />
      </AgendaFaixa>
    </AgendaGrade>
  ),
};
