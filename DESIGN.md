# Design

Sistema visual da landing do XibéSec 2026, registrado a partir do que foi construído
na landing anterior, não do que se pretendia construir.

O mundo visual é **herdado**, não inventado: vem do protótipo `XibeSec 2026.dc.html`
e da key art oficial. Extensões novas devem se justificar dentro dele.

---

## Fundamento

Chão de igapó escuro, grafismo marajoara como régua estrutural e monoespaçada para
tudo que é dado. Sem cantos arredondados, sem sombra de caixa: a página se estrutura
com filete de 1px, faixa de grafismo repetida e bloco cheio de cor.

O único elemento com sombra é figura recortada (mascote), via `drop-shadow`, porque
é ilustração sobre cena — não é elevação de interface.

---

## Cor

Tokens em `:root` (`src/app/globals.css`), mapeados em `@theme inline` do Tailwind 4.

| Token        | Valor                   | Papel                                     |
| ------------ | ----------------------- | ----------------------------------------- |
| `--ink`      | `#152310`               | Chão dominante da página                  |
| `--ink-deep` | `#0F1A0C`               | Fechamento e gaveta do menu               |
| `--panel`    | `#1E3218`               | Seções alternadas, cartões, células       |
| `--panel-2`  | `#24391D`               | Hachura do quadro do mapa                 |
| `--shell`    | `#0B140A`               | Corpo do terminal do CTF                  |
| `--cream`    | `#F2E4C4`               | Texto primário                            |
| `--cream-2`  | `rgba(242,228,196,.76)` | Texto de leitura corrida                  |
| `--cream-3`  | `rgba(242,228,196,.63)` | Texto terciário — **piso de contraste**   |
| `--line`     | `rgba(242,228,196,.14)` | Filete de estrutura                       |
| `--line-2`   | `rgba(242,228,196,.28)` | Filete de borda e tracejado               |
| `--orange`   | `#EE7B2E`               | Ação primária, rótulo de seção, ênfase    |
| `--orange-2` | `#FA8F45`               | Estado hover do laranja                   |
| `--mint`     | `#4FE3AC`               | Dado técnico, hora, estado positivo, foco |
| `--green`    | `#00B368`               | Verde da marca, presente no grafismo      |

**Regra de contraste:** nenhum texto abaixo de `--cream-3` (≈5,8:1 sobre `--ink`,
≈4,9:1 sobre `--panel`). Alfas menores que .62 só para elemento não textual.

**Divisão de papéis entre os acentos:** laranja é ação e hierarquia de seção; menta é
dado, tempo e confirmação. Não trocar — a leitura do preço e da hora depende disso.

**Estratégia:** paleta completa com quatro papéis nomeados, sobre chão escuro.
O escuro não é escolha de categoria: a marca é uma cena de mata em contraluz, e a
página é a continuação dessa cena.

---

## Tipografia

| Família                         | Uso                                                           |
| ------------------------------- | ------------------------------------------------------------- |
| **Archivo Black** (`--display`) | Manchetes, títulos de seção, `h3`, citação, ano               |
| **Archivo** (`--sans`)          | Leitura corrida, preço dos ingressos                          |
| **JetBrains Mono** (`--mono`)   | Hora, preço na barra, contagem, rótulo, botão, terminal, dado |

Corpo base 17px / 1.65. Manchetes com `letter-spacing:-.02em`, caixa alta nos títulos
de nível hero e fechamento. Rótulos monoespaçados a 11px com `letter-spacing:.24em`.

A monoespaçada não é fantasia de "técnico": ela carrega exclusivamente hora, valor,
contagem, rótulo e saída de terminal. Texto de leitura nunca vai para mono.

---

## Ritmo e grade

- `--maxw: 1320px`, `--gutter: clamp(20px, 4vw, 32px)`.
- `--sec-y: clamp(48px, 8vw, 96px)`; `.sec--tight` reduz para `clamp(36px, 5.5vw, 72px)`.
- Seções alternam `--ink` e `.sec--panel` (`--panel` + filete em cima e embaixo).
- Cabeçalho de seção: rótulo mono, depois grade de duas colunas `1fr 1fr` com título
  à esquerda e apoio à direita. Colapsa em coluna única abaixo de 860px.
- Grades de conteúdo usam `repeat(auto-fit, minmax(Xpx, 1fr))`, nunca contagem fixa.

---

## O que não desce para o celular

A home tem doze blocos. Enfileirados numa coluna de 390px eles somavam doze telas
de rolagem, e parte disso era peça que só faz sentido lado a lado — em coluna ela
não equilibra nada, apenas repete o que o texto vizinho já disse.

A régua é uma pergunta, não uma preferência: **em coluna única, esta peça ainda
diz algo que o bloco ao lado não diz?** Quando a resposta é não, ela sai abaixo de
900px. O desktop não muda em nenhum dos casos.

| Peça                        | Por que sai                                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Janela de terminal do CTF   | Repete modalidade, formato, acesso e premiação, que já estão no parágrafo. Em `pre` ainda abriria rolagem horizontal em 350px. |
| Cartas de edição anteriores | Fica só a mais recente. A linha do tempo ao lado já nomeia todas; enfileirar as molduras custa duas dobras.                    |
| Shell interativo do rodapé  | É feito de `Tab`, `↑ ↓` e `Ctrl+L`. No toque não há nenhum dos três, e encostar nele só sobe o teclado virtual.                |
| Mascote do fechamento       | Segunda aparição. Empurra o último botão de compra para fora da dobra.                                                         |
| Botão da barra de contagem  | A barra fica a mais de 520px de rolagem — exatamente onde o `dock` já entrou com o mesmo destino.                              |
| Setas do carrossel          | Arrastar é o gesto nativo do trilho, e 36px é alvo pequeno demais para o polegar.                                              |
| Losangos da faixa de fatos  | Separador entre vizinhos na mesma linha. Em grade de duas colunas ele sobra na ponta de cada quebra.                           |

**Duas maneiras de tirar, e elas não são intercambiáveis.** Custo de pintura sai
por classe (`max-[900px]:hidden`). Custo de comportamento — estado de cliente,
ouvinte de evento, hidratação — sai por **montagem**, com `useDesktop()` de
`src/lib/use-media.ts`, que responde desktop no servidor e corrige no primeiro
quadro de cliente. É por montagem que saem o shell do rodapé e as cartas extras.

---

## Componentes

| Classe        | O que é                                                                                                                                                                                                                                                                                                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.nav`        | Barra fixa. Transparente no topo com véu em degradê; ao passar 56px de scroll ganha `blur(34px)`, fundo e filete. Marca composta em tipo, não em imagem.                                                                                                                                                                                                                      |
| `.hero`       | Arte de fundo (`hero-bg`) + véu de leitura + brilho menta. Texto à esquerda, mascote à direita deslocado `translate(-7%,6%)`.                                                                                                                                                                                                                                                 |
| `.cdbar`      | Barra única: contagem, lote, preço e compra na mesma linha.                                                                                                                                                                                                                                                                                                                   |
| `.strip`      | Faixa de fatos verificáveis, número em mono laranja.                                                                                                                                                                                                                                                                                                                          |
| `.greca`      | Faixa de grafismo marajoara. Esteira: `<i>` interno com 200% de largura translada em `--gx`.                                                                                                                                                                                                                                                                                  |
| `.pillar`     | Cartão de pilar com numeral mono.                                                                                                                                                                                                                                                                                                                                             |
| `.story`      | Linha do tempo das edições, grade de 1px, ano em mono.                                                                                                                                                                                                                                                                                                                        |
| `.past`       | Espaços reservados 16/9 tracejados para as fotos ainda não entregues.                                                                                                                                                                                                                                                                                                         |
| `.novo`       | Bloco da trilha gerencial, borda laranja + lavagem diagonal.                                                                                                                                                                                                                                                                                                                  |
| `.grade`      | Programação em duas salas: `104px 1fr 1fr`, hora em menta na calha e uma coluna por trilha. A malha de 1px sai do `gap` sobre `--line`, e o `<li>` de cada faixa usa `subgrid` para as colunas nunca saírem do prumo. Abaixo de 900px vira coluna única com abas em `radio` + `:has()`, sem estado de cliente.                                                                |
| `.term`       | Terminal do CTF: casca `--shell`, borda menta, linha de varredura, cursor piscante.                                                                                                                                                                                                                                                                                           |
| `.tier`       | Cartão de ingresso; `.tier--hi` marca o caminho primário com borda laranja.                                                                                                                                                                                                                                                                                                   |
| `.slot`       | Cota de patrocínio disponível (tracejado) ou confirmada (`--filled`). A marca sai em três escalas, decididas pela cota e não pelo componente: destaque (Platina, Ouro), padrão (Prata, Bronze) e reduzida (apoio, que fica fora da grade para não esticar até a largura de um patrocinador).                                                                                  |
| `.sec--light` | Inversão de tema local (fundo branco). Existe para receber logo de patrocinador em arquivo com fundo branco chapado, que não pode ser recortado. Redefine `--cream*`, `--line*` e `--panel` em tinta sobre branco; laranja e menta ganham versões escurecidas (`--orange-ink`, `--mint`) porque os tons de marca não sustentam texto sobre branco. Usada só em `#patrocinio`. |
| `.dock`       | Barra fixa inferior de compra, só abaixo de 860px, entra depois do hero.                                                                                                                                                                                                                                                                                                      |

**Botões:** três variantes — `--primary` (laranja sólido), `--ghost` (filete), `--mint`.
Ícone desenhado via `mask` em `--ico`; seta reta para navegação interna, seta diagonal
automática em `[target="_blank"]` e `[download]`.

---

## Movimento

Um gesto autoral, repetido: **subida com desfoque**.
`[data-reveal]` entra de `translateY(18px) + blur(6px)` para o repouso, em
`cubic-bezier(.16,1,.3,1)` por 0.8s, escalonado em até 3 passos de 80ms.

Movimentos de apoio, todos com razão funcional:

- Esteira do grafismo, atrelada ao scroll (0,35px por px).
- Flutuação do mascote, 7s.
- Varredura e cursor do terminal.

**Sem JavaScript o conteúdo aparece inteiro** — a classe `.js` é adicionada no `<head>`
e só então o estado inicial invisível passa a valer. `prefers-reduced-motion` desliga
tudo, inclusive a esteira.

---

## Imagem

`next/image` para figura de conteúdo — o ganho é `loading="lazy"`, `width`/`height`
contra CLS e `placeholder`. Com `images.unoptimized: true` (exigência do export
estático) não há geração de `srcset`: as variantes WebP entram pré-geradas.

Fundo do hero em CSS usa `image-set()` com WebP e PNG de reserva.

---

## Acessibilidade

- Link de pulo para o conteúdo.
- `:focus-visible` com contorno menta de 2px e recuo de 3px.
- Menu mobile com `aria-expanded`, fechamento por `Esc` e por clique no item.
- Contagem regressiva com `aria-live="off"` — é informação ambiente, não deve
  interromper leitor de tela a cada segundo.
- Faixas decorativas com `aria-hidden`.
- Contraste mínimo AA respeitado pelo piso de `--cream-3`.

---

## O que não fazer

- Usar a key art como fundo de bloco: ela já contém logotipo e mascote, e duplica.
- Escrever "comunidade" como categoria do evento (ver `PRODUCT.md` → _Percepção a Corrigir_).
- Preencher número de público, foto de edição anterior ou nome de palestrante antes
  de o cliente entregar. Os espaços reservados existem para isso.
- Trocar laranja por menta em ação, ou menta por laranja em dado.
- Cantos arredondados e sombra em elemento de interface.
