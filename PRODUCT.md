# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16 (App Router) + React 19 + TypeScript strict + Tailwind CSS 4 (CSS-first, sem `tailwind.config`), exportado como site estático (`output: "export"` → `dist/`) e publicado no GitHub Pages sob domínio próprio **xibesec.com.br**. Gerenciador: Yarn.

Conteúdo fora do código, em `contents/`, gerido por **nextjs-studio** (`studio.config.ts` declara o schema; tipos gerados em `.studio/studio.d.ts`). O acesso passa por uma fachada única em `src/lib/cms.ts` — nenhum componente chama `queryCollection` direto.

_Decisão de 07/08/2026, tomada a partir da análise de quatro projetos de referência do mesmo autor. Substitui o plano anterior de HTML estático sem build, que existiu enquanto não havia scaffold no repositório. O protótipo incumbente (`XibeSec 2026.dc.html`) segue não deployável e serve apenas como referência visual._

## Users

- **Primário:** profissional e estudante de segurança da informação da Região Norte (Belém e entorno) — SOC, CTI, forense, pentest, desenvolvimento — que quer conteúdo técnico de peso sem precisar viajar ao eixo Rio–São Paulo. Decide comprar o ingresso pelo celular, a partir de um link vindo do Instagram.
- **Secundário (decisor de patrocínio):** marketing, RH tech e liderança de segurança de empresas avaliando onde investir verba de marca e de recrutamento. Chega pela landing antes de abrir o mídia kit e decide em segundos se aquilo é um evento com audiência qualificada ou um encontro informal. **É a audiência cuja percepção precisa mudar** — ver _Percepção a Corrigir_.
- **Terciário:** público gerencial (líderes, gestores de risco e governança), atendido pela trilha gerencial nova em 2026; palestrantes e voluntários avaliando as chamadas abertas; organizações parceiras avaliando associação de marca.

## Product Purpose

O XibéSec é um evento presencial de cibersegurança realizado em Belém/PA. A landing tem duas funções de igual peso: converter interesse em ingresso vendido no Sympla **e** provar escala para quem decide patrocínio. Secundariamente, capta palestrantes e voluntários e serve como página de referência da edição.

**Edição 2026 (4ª):** 19 de setembro de 2026, 09h–19h, Bristol Marambaia Hotel — Av. Pedro Álvares Cabral, 9031, Marambaia, Belém/PA.

## Positioning

> **Para quem tem fome de segurança.**
> O encontro de cibersegurança que leva a energia do Norte do Brasil para quem vive infosec, hacking e tecnologia.

Essa é a formulação canônica do posicionamento — definida pelo cliente, usar literalmente. Tudo o mais nesta seção existe para sustentá-la.

O nome vem do **Xibé** (ou Jacuba), bebida tradicional da culinária tupi feita de farinha de mandioca e água — base alimentar de muitos povos do Norte. O evento nasceu para "alimentar o conhecimento".

**O que sustenta a afirmação (fatos, não adjetivos):** 4ª edição consecutiva; dia inteiro de programação (09h–19h, 10 horas); hotel de eventos, não espaço cedido; duas trilhas simultâneas — técnica e gerencial; CTF presencial com premiação; 21 organizações parceiras de todo o Brasil; patrocinador confirmado no mercado nacional (BugHunt); realização por empresa (Hekate, Inc.), não por coletivo informal.

## Percepção a Corrigir

**Problema real de negócio:** parte do mercado lê o XibéSec como "evento de comunidade" — voluntário, informal, de alcance pequeno — e por isso descarta o patrocínio antes de abrir o mídia kit. O evento tem raiz comunitária e isso é verdade, mas **não é a mensagem que a landing deve carregar**. A página precisa comunicar porte, continuidade e audiência qualificada.

Isso **não** significa virar corporativo, frio ou publicitário. A identidade amazônica, o tom técnico e a ausência de discurso de venda continuam intactos. O que muda é o enquadramento: de _"a comunidade do Norte se reúne"_ para _"o encontro de cibersegurança do Norte do Brasil"_.

**Léxico — evitar:**

- "meetup", "encontro da comunidade", "evento da comunidade", "nossa comunidade", "a galera", "rolê", "iniciativa comunitária"
- "apoio da comunidade" como argumento central de credibilidade
- diminutivos e linguagem de convite informal ("chega junto", "vem com a gente")
- qualquer construção que sugira gratuidade, improviso ou escala pequena

**Léxico — preferir:**

- "encontro de cibersegurança", "edição", "programação", "trilhas", "participantes"
- "organizações parceiras" e "ecossistema de parceiros" no lugar de "comunidades apoiadoras"
- números e fatos verificáveis no lugar de adjetivos de tamanho ("4ª edição", "10 horas", "21 organizações") — o porte se demonstra, não se declara

**Regra de aplicação:** a palavra _comunidade_ não é proibida, mas não pode aparecer como a categoria do evento. Ela descreve o público que o evento serve, nunca o que o evento é.

## Operating Context

- Ingressos vendidos exclusivamente no Sympla: https://www.sympla.com.br/evento/xibesec-2026/3470128
- Divulgação e atualizações da grade acontecem no Instagram [@xibesec](https://www.instagram.com/xibesec/); há também Linktree e LinkedIn.
- Chamadas de palestrantes e voluntários operam por prazo (voluntários até 20/08/2026).
- Patrocínio é negociado por cotas via mídia kit, por e-mail com a Hekate.

## Capabilities and Constraints

**Confirmado**

- Ingressos, Lote 2, vendas até 10/08/2026:
  - Inteira — R$ 80,00, em até 12x
  - Meia-entrada — R$ 40,00, em até 6x
  - Ingresso Social — R$ 60,00, em até 12x
- A inscrição dá direito a: área de exposição/patrocinadores/comunidades/ativações; acesso ao CTF; todas as palestras conforme disponibilidade de lugares; certificado de participação. **O prazo de emissão do certificado voltou a ser indefinido** — não publicar "2 dias úteis" nem prometer data.
- Novidade 2026: trilha gerencial (liderança, riscos, governança, estratégia, tomada de decisão).
- Competição CTF presencial no formato de captura de flags (jeopardy): cada desafio esconde uma vulnerabilidade, e quem encontra a falha pontua. Disputa individual, com premiação.
- Cancelamento: aceito até 7 dias após a compra, desde que solicitado até 48h antes do evento. Edição de participante: uma vez, até 24h antes.
- Realização: Hekate, Inc. — contact@hekateinc.com — www.hekateinc.com

**Explicitamente indefinido (não inventar)**

- Grade de palestras e horários finais: "em definição". Nenhuma palestra tem horário confirmado, e por isso nenhuma entra em `contents/agenda`.
- Palestrantes de 2026: sete nomes anunciados pela organização, em `contents/palestrantes/`, cada um com a própria página em `/palestrantes/<slug>`. A lista **não** está fechada, e nome que a organização não anunciou não entra.
- Cotas Platina, Ouro e Prata: disponíveis, nenhum patrocinador confirmado nessas faixas.
- Apoiadores/comunidades da página oficial: "a anunciar" na landing, embora o Sympla já liste 21 nomes (ver Evidence).
- Número de desafios e valor da premiação do CTF. O formato já está definido: captura de flags, disputa individual.
- Estrutura de horários é descrita como o formato típico de um dia de XibéSec, não como grade confirmada.

## Brand Commitments

- Nome grafado **XibéSec** (com acento); marca da edição: **XibéSec 26**.
- Assinatura: "Para quem tem fome de segurança."
- Paleta incumbente: igapó `#152310`, painel `#1E3218`, creme `#F2E4C4`, laranja `#EE7B2E`, menta `#4FE3AC`, verde vivo da marca `≈#00B368`.
- Tipografia incumbente: Archivo Black (display), Archivo (texto), JetBrains Mono (dados, rótulos, tempo).
- Elementos gráficos obrigatórios: logo (cuia de xibé com circuitos brotando + arco em grafismo marajoara), mascote (personagem ciber-amazônico) e as faixas de grafismo marajoara.
- Voz: técnica, direta e regional, sem discurso comercial e sem informalidade de meetup. Português brasileiro. Ver _Percepção a Corrigir_ para o léxico.

## Evidence on Hand

Ativos de marca existentes, **ainda não levados para `public/`**:

- `logo-xibesec.png` (1600×1282, alpha) — lockup oficial.
- `mascote.png` (1400×1750, alpha) — mascote isolado; há fonte em alta (6000×7500).
- `keyart.png` (819×310) — key art oficial: wordmark à esquerda, mascote à direita, faixas marajoara nas bordas verticais. É a referência de composição da marca.
- `pattern-green.png` / `pattern-orange.png` — faixas de grafismo marajoara, com alpha.
- `favicon.svg` — favicon autoral (cuia com circuitos).
- `og-xibesec-2026.png` (1200×630) e `.webp` — imagem de compartilhamento.
- `xibesec-2026.ics` — evento de calendário, `TZID America/Belem`.
- `Marca XIBESEC_CLR.png` (9500×7500) — marca em alta.
- `Media Kit XibéSec 2026.pdf` (16 MB) — mídia kit real de patrocínio.
- Landing anterior — traz o bloco JSON-LD `schema.org/Event` já completo (local, organizador, três `Offer` do Lote 2). É a referência a portar para `src/lib/schema.tsx`, gerada a partir de `contents/`, não copiada como string.
- Organizações parceiras listadas no Sympla (21): 0xe Hacker Conf., 3D com Tech, Alquymia, APT Zé da Manga, BSides BSB, BXSec, Chapéu de Palha, Cyber Security Girls, Garota Cibernética, Guia Anônima, Hack in Cariri, Itshow, Latam Airlines, Mente Binária, Novatec, Pirate Ship, Quantum Village BR, Raul Hacker Club, Security Is Lifestyle, SOC Brazil, VP2 Turismo. Tratar como **ecossistema de parceiros de abrangência nacional**, não como "comunidades apoiadoras". A abrangência geográfica (quantos estados) ainda não foi apurada — não afirmar um número antes de conferir.
- Patrocinador Bronze confirmado: BugHunt.

**Provas de escala — existem, valores pendentes (o cliente confirmou que tem):**

- **Anos das edições anteriores: 2023, 2024, 2025 — a conferir.** É a sequência que consta do protótipo do próprio cliente e estava publicada na landing anterior por decisão dele em 06/08/2026. Houve uma ressalva anterior na mesma conversa ("não foi em 2025") que ficou sem esclarecimento; **confirmar as três datas com a organização antes de publicar**. Cada edição entra em `contents/edicoes/` com `status: "a-conferir"` até a confirmação, e o ano é o slug da rota `/edicoes/[ano]` — corrigir depois quebra URL indexada.
- **Número de público das edições anteriores** — confirmado como existente e autorizado para publicação; os valores ainda não foram fornecidos. É a prova mais forte contra a percepção de evento pequeno. Deixar como pendência declarada, nunca estimar.
- **Fotos reais das edições anteriores** — confirmadas como existentes; arquivos ainda não entregues ao projeto. Foto de plateia cheia é o argumento visual que derruba a leitura de "evento de comunidade" mais rápido que qualquer texto. Reservar espaço na composição; não substituir por ilustração ou stock.

**Ausências que não podem ser fabricadas:** depoimentos, logos das organizações parceiras em arquivo, imagem real do local, e — até que os valores cheguem — os próprios números de público e as fotos acima.

## Product Principles

1. **O ingresso é a ação.** Toda seção deve deixar a compra a um clique de distância; o preço e o prazo do lote são informação, não letra miúda.
2. **Conteúdo técnico, sem pitch de venda.** Nada de linguagem de venda de produto — mas também nada de informalidade que sugira evento improvisado. O valor é técnico e regional; a apresentação é de conferência.
3. **Porte se demonstra com fato.** Cada afirmação de escala vem com um número, uma data ou um nome verificável. Adjetivo sozinho ("grande", "consolidado") não sustenta nada e ainda soa defensivo.
4. **O Norte é o argumento.** A identidade amazônica não é enfeite — é a razão de o evento existir fora do eixo. Energia do Norte, não folclore decorativo.
5. **Prática acima de teoria.** CTF e trocas reais têm o mesmo peso das palestras.
6. **Indefinido é indefinido.** Grade e nomes ausentes são declarados como "em definição", nunca preenchidos com invenção. Isso vale integralmente para números de público e provas de escala.

## Accessibility & Inclusion

Evento com política explícita de diversidade e inclusão, meia-entrada e ingresso social. A página deve atender WCAG AA (contraste, foco visível, navegação por teclado, `prefers-reduced-motion`) e funcionar bem em conexão móvel — o público chega majoritariamente pelo Instagram no celular.
