# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Idioma do projeto: **português do Brasil**, com acentuação correta. Vale para copy, comentários, labels do CMS e mensagens de commit.

## Comandos

```bash
yarn dev              # desenvolvimento em http://localhost:3000
yarn build            # build de produção → dist/ (não rodar, ver abaixo)
yarn storybook        # Storybook em http://localhost:6006
yarn build-storybook  # Storybook estático → storybook-static/
yarn lint             # ESLint 9 (flat config)
yarn lint:fix         # ESLint com correção automática
yarn typecheck        # tsc --noEmit
yarn format           # Prettier
yarn format:check     # Prettier em modo verificação
```

Não há suíte de testes e não se pretende adicionar uma: o site é 100% estático. O que substitui é `yarn typecheck` e `yarn lint`, mais um validador de conteúdo com Zod (ainda não escrito, ver _Pendências_).

**Não rodar `yarn build`.** É a verificação de quem trabalha aqui, feita quando essa pessoa quiser, e o CI já roda a cada push e pull request. Disparado por conta própria, ele compete pelo `.next/` com o `yarn dev` que está de pé, deixa o servidor de desenvolvimento num estado estranho e custa minutos para dizer o que o `typecheck` diz em segundos. Precisando conferir o que o export escreve em `dist/` — um espelho em Markdown, uma rota nova no `sitemap.xml` —, peça o build a quem está conduzindo em vez de executá-lo.

O runner de teste que vem no scaffold do Storybook (`@storybook/addon-vitest`, `vitest`, `playwright`) foi removido de propósito — o Storybook aqui é bancada de desenvolvimento visual, não harness de teste.

**Nunca** ligar `typescript.ignoreBuildErrors` ou `eslint.ignoreDuringBuilds` no `next.config.ts`. Os quatro projetos de referência ligam, e o resultado é build verde sobre código quebrado.

## Arquitetura

Site de evento, **estático puro**: Next.js 16 App Router com `output: "export"` → `dist/`, publicado no GitHub Pages sob domínio próprio **xibesec.com.br** (`public/CNAME`). Sem servidor, sem ISR, sem rota dinâmica em runtime — tudo resolve no build.

Três documentos governam o projeto e devem ser tratados como código, não como anotação:

- `PRODUCT.md` — o que o evento é, quem decide o quê, léxico obrigatório e a lista do que é **explicitamente indefinido**.
- `DESIGN.md` — tokens, tipografia, componentes e a lista _O que não fazer_.
- este arquivo — como o código se organiza.

Mudou a estrutura? Atualize o documento correspondente no mesmo commit.

### Publicação

O repositório é `xibesec/xibesec.github.io` e o Pages é alimentado por GitHub Actions, não por branch:

- `.github/workflows/deploy.yml` — push na `main` roda lint, typecheck e build, e publica `dist/`. Em Settings → Pages, **Source** precisa estar em _GitHub Actions_.
- `.github/workflows/ci.yml` — as mesmas verificações em pull request, mais `format:check`.

O `basePath` fica **vazio**: o repo é o site raiz da organização e o domínio próprio vem de `public/CNAME`, copiado para `dist/` pelo próprio build. `NEXT_PUBLIC_BASE_PATH` existe só para preview sob subcaminho e não é usado no deploy. O `.nojekyll` também sai de `public/`, e é por isso que o upload do artefato roda com `include-hidden-files: true` — no padrão, a action descarta todo dotfile da raiz.

### Conteúdo fora do código

Todo o conteúdo mora em `contents/`, fora de `src/`, para que alguém da organização edite um arquivo sem entrar no código. O content layer é **nextjs-studio**:

1. `studio.config.ts` declara o schema de cada coleção, com labels em pt-BR.
2. O CLI gera `.studio/studio.d.ts` a partir desse schema.
3. `src/lib/cms.ts` é a **única porta de entrada**. Nenhum componente importa `queryCollection` direto — todos chamam `getSettings()`, `getAgenda()`, `getPalestrantes()` e afins. É isso que torna a troca do backend de conteúdo um refactor de um arquivo.

`src/lib/content-types.ts` guarda **só** tipos e helpers puros, sem nenhum import de `nextjs-studio/server`, e `cms.ts` faz `export * from "./content-types"`. Sem essa separação, importar um tipo dentro de um `'use client'` arrasta código de servidor e quebra o build.

Formato por natureza do dado:

| Natureza                                           | Formato                                                                        |
| -------------------------------------------------- | ------------------------------------------------------------------------------ |
| Singleton (`settings`, `sobre`, `ctf`)             | `index.json` com objeto                                                        |
| Lista (`agenda`, `ingressos`, `patrocinadores`, …) | `index.json` com array, ou `NN-slug.json` por registro quando a ordem importar |
| Texto longo (`palestrantes`, `codigo-de-conduta`)  | `.mdx` com frontmatter                                                         |

### Feature flags de seção

`contents/settings/index.json` tem um bloco `sections` com um booleano por seção. A home faz `{settings.sections.palestrantes && <SecaoPalestrantes />}`. É o que permite publicar a landing com o que já está pronto e ir ligando o resto conforme a organização entrega, **sem tocar em código**. A mesma chave governa o JSON-LD e o espelho em Markdown: seção desligada não vira `subEvent` no schema nem arquivo em `/docs/`.

### Apoio é cota, não seção à parte

Quem apoia a edição mora em `contents/patrocinadores/` com `cota: "apoio"`, na mesma coleção de quem comprou cota. Não há seção `#parceiros`, nem coleção `parceiros`, nem chip de organização: a vitrine de `#patrocinio` agrupa por cota, e a de apoio entra por último, com `apoio: true` na cota levando `escalaDaCota()` a `reduzida`. Duas listas para a mesma pergunta ("quem está com o evento") divergiam a cada marca nova, e uma delas não alimentava nem o `sponsor` do JSON-LD nem a tabela de `/docs/patrocinio.md`.

`SponsorSlot` sem `logo` escreve o nome dentro da moldura, então marca sem arquivo entra na fileira sem moldura vazia e sem espaço reservado. `getApoiadores()` é quem lê essa cota fora da seção, e alimenta o `cat parceiros/organizacoes.txt` do shell e a resposta sobre quem apoia em `/docs/agents.md`.

### Fonte única de URL e SEO

`src/lib/site.ts` concentra nome, tagline, descrição, `siteUrl`, locale, redes e contatos, mais `absoluteUrl(path)` e `pageMetadata({ title, description, path, image })`. Toda página interna monta seu `Metadata` por essa função — é o que impede uma rota nova sair sem canonical. **Nunca** repetir a URL do site em outro arquivo.

`src/lib/links.ts` resolve a pergunta seguinte: **para onde o botão aponta quando a seção que ele buscava não está publicada**. `externo(href)` monta o par `target="_blank"` + `rel="noopener"` — o `Button` lê o `target` e acrescenta sozinho a seta de "sai do site". `alvoCompra(settings)` devolve a âncora `#ingressos` enquanto a seção estiver ligada e cai no `ticketsUrl` quando não estiver; fora da home a tabela de preços está em outra página, e `alvoCompraDeOutraRota(settings)` devolve `/#ingressos` — âncora nua ali não sai do lugar. `ancoraViva(href, sections)` diz se uma âncora existe na página: o conteúdo em `contents/` não sabe o que foi ao ar, e é assim que a nota de uma seção deixa de linkar para outra que não foi publicada. Duas regras: **o rótulo manda no destino** — botão que diz "comprar" vai ao Sympla, botão que convida a participar rola até a tabela de preços; e **nenhuma âncora literal `#secao` fora desse arquivo** em CTA que uma feature flag possa desligar.

`src/lib/schema.tsx` fabrica o JSON-LD: `<SchemaMarkup>` mais `eventSchema`, `organizationSchema`, `websiteSchema`, `generateFaqSchema`, `generateBreadcrumbs`, `generatePersonSchema`. Tudo alimentado por `site.ts` + `contents/`, com `@id` estáveis (`#organization`, `#website`) referenciados pelos schemas de página.

`app/sitemap.ts` e `app/robots.ts` usam as convenções nativas do App Router — compatíveis com `output: "export"`, sem `next-sitemap`, e ambos precisam de `export const dynamic = "force-static"` (sem isso o build do export falha). Só emitir URL de rota que `generateStaticParams` realmente gera. O sitemap usa `canonicalUrl()`, que aplica a barra final imposta pelo `trailingSlash` — sem ela o sitemap aponta para um endereço que o canonical não confirma.

### Rotas e o mapa do site

`src/lib/rotas.ts` é o catálogo das rotas HTML — endereço, rótulo, feature flag que a governa, prioridade e ritmo de atualização. Quatro consumidores leem dele: `app/sitemap.ts`, a página `/sitemap`, o documento `/docs/sitemap.md` que a espelha e a coluna _Páginas_ do rodapé. Escritos à mão, os quatro divergem no primeiro dia em que uma seção é desligada.

O catálogo **não importa `docs.ts`** — a dependência aponta para o outro lado, porque o documento do mapa do site lê as rotas. `markdownDaRota()` e `metadataDeRota()` moram em `docs.ts` por isso, e `markdownDaRota()` renderiza só o corpo do documento pedido: olhar todos poria o mapa do site em laço, já que ele cita os outros.

Rota nova nasce aqui, não no `app/`: sem entrada no catálogo ela não entra no sitemap nem ganha link interno, e página órfã o buscador visita tarde e classifica mal.

`/evento`, `/ctf`, `/patrocinio`, `/local`, `/faq` e `/press` reusam a seção da home com `titleAs="h1"` — a mesma seção, promovida a assunto da página. Na home a `ImprensaSection` abre só com o rótulo e a citação de terceiro, para não gastar altura na porta do patrocínio; em `/press`, onde a cobertura é o assunto, o mesmo componente publica o título e o apoio que `contents/secoes` já traz. Ficam fora do menu **e do rodapé** de propósito: a home continua sendo o caminho de leitura, e essas rotas existem para a busca e para quem chega por link direto. Quem navega chega a elas pelo `/sitemap`, que está no rodapé. Cada uma anuncia `/docs/<slug>.md` como espelho, pela `metadataDeRota()`.

**Feature flag desligada não apaga o arquivo.** Com `output: "export"`, `notFound()` ainda escreve o HTML da rota — vazio, mas com título e canonical. Por isso `metadataDeRota()` devolve `noindex, nofollow` quando a seção está desligada, e a rota sai do sitemap: sem isso o endereço vira um soft 404 que responde 200 anunciando conteúdo que a organização retirou do ar.

`robots.ts` libera nominalmente os rastreadores de assistentes de IA (GPTBot, ClaudeBot, PerplexityBot, Google-Extended e afins). Não é decoração: esses bots leem o bloco do próprio user-agent antes do `*`, e bot bloqueado não cita o evento.

### Espelho em Markdown e `llms.txt`

O HTML é para gente; `src/lib/docs.ts` gera a **mesma informação em Markdown**, para assistentes de IA e agentes. Route Handlers com `export const dynamic = "force-static"` escrevem os arquivos no build: `app/llms.txt/route.ts` vira `dist/llms.txt`, e `app/docs/[...doc]/route.ts` vira `dist/docs/<slug>.md`. A rota é catch-all porque o perfil de cada palestrante mora um nível abaixo. O `trailingSlash` não interfere no nome.

| Arquivo                        | O que é                                              |
| ------------------------------ | ---------------------------------------------------- |
| `/llms.txt`                    | Índice curto no formato de llmstxt.org               |
| `/llms-full.txt`               | Todo o conteúdo publicado em um arquivo              |
| `/index.md`                    | Espelho da home                                      |
| `/docs/agents.md`              | Respostas canônicas e a lista do que **não** afirmar |
| `/docs/<seção>.md`             | Um documento por seção publicada                     |
| `/docs/palestrantes/<slug>.md` | Um perfil por pessoa anunciada                       |

Três regras governam isso:

1. **Não é conteúdo paralelo.** Tudo sai de `contents/` pela fachada de `cms.ts`. Escrever texto novo direto no `docs.ts` recria o problema que `contents/` existe para evitar.
2. **Documento só existe enquanto a seção estiver ligada** em `settings.sections`. Publicar em Markdown o que a página não mostra cria uma segunda verdade — e `llms.txt` lê a mesma lista, então nunca aponta para arquivo que o build não gerou.
3. **O indefinido é declarado**, não omitido: `/docs/agents.md` traz a lista do que a organização ainda não publicou. É o que faz um assistente responder "ainda não foi anunciado" em vez de estimar.

`pageMetadata()` deriva o alternate sozinho — `/` → `/index.md` — e emite `<link rel="alternate" type="text/markdown">`. Rota nova nasce com espelho anunciado; passar `markdown: null` desliga quando a rota não tiver um. A convenção de nome só vale para a home: rota com documento próprio passa `markdown: markdownDaRota("/rota")`, que devolve `/docs/<slug>.md` enquanto o build gerar o arquivo — sem isso a página anuncia um Markdown que não existe.

### Os palestrantes em `/palestrantes`

Um arquivo `.mdx` por pessoa em `contents/palestrantes/`: o frontmatter traz nome, cargo, palestra, temas, certificações e onde já palestrou; o corpo é a bio longa, lida como texto puro e quebrada em parágrafos por `paragrafos()`. Não há runtime de MDX no projeto, e o corpo não aceita marcação.

Quatro decisões:

- **A rota não é governada pela seção da home.** `settings.sections.palestrantes` liga a vitrine da página inicial; a página existe enquanto houver registro em `contents/palestrantes/`, pelo `publicaSe` da entrada em `rotas.ts`. É o que permite anunciar nomes em página própria antes de abrir a seção na home, que é o estado atual.
- **O slug do frontmatter é a URL.** `/palestrantes/<slug>` é indexado; trocar o slug depois quebra endereço publicado e o espelho em Markdown que ele anuncia. O prefixo numérico do arquivo governa só a ordem no CMS.
- **Uma rota por pessoa nasce do conteúdo.** `rotasDePalestrantes()` expande o catálogo, e com isso o sitemap, a página `/sitemap`, o documento que a espelha e o item do menu saem de graça. `itensDoMenu()` esconde qualquer item que aponte para rota não publicada.
- **Sem foto, e sem espaço reservado para uma.** A coleção não tem campo de retrato. Nada de `PendingSlot`, monograma, ilustração ou banco de imagem: moldura vazia ocupa a fileira sem dizer nada, e campo de mídia sem consumidor no render é convite a preencher o que não aparece. O layout é consequência disso, não adaptação: a lista é de **linhas largas** (`SpeakerRow`, na mesma malha de 1px da grade), porque cartão em grade `auto-fit` existe para emoldurar retrato quadrado e, sem ele, espreme o título da palestra em três linhas. No perfil, o nome ocupa a largura inteira e só abaixo dele a página se divide, com a ficha numa faixa de 300px. Coluna larga guardando ficha de quatro linhas é o desenho de quem tirou a foto e não refez a página.

O JSON-LD é `ProfilePage` com `mainEntity: Person` (`knowsAbout`, `hasCredential`, `sameAs`, `performerIn` apontando para o `@id` do evento) e a palestra como `subjectOf`. O `Person` não declara `performerIn` quando é aninhado no `performer` do próprio evento, o que seria uma referência do evento para ele mesmo. A palestra **não** é `subEvent`: sem horário confirmado ela não tem `startDate`, e `subEvent` sem data é promessa que a grade ainda não sustenta.

### As edições anteriores em `/edicao/<ano>`

Uma página por edição que já aconteceu, alimentada por `contents/edicoes/index.json`. Além de ano, tema e foto, cada registro traz `local`, `endereco`, `startsAt`, `endsAt` e o `resumo` em prosa. O `publico` continua nulo e é assim que fica: número de público não se estima, e a ficha declara "A conferir" com `Tag` em vez de inventar.

Cinco decisões:

- **O ano é o slug, sob prefixo próprio.** `edicaoPath()` devolve `/edicao/2023`, não `/2023`: um segmento de ano na raiz seria um `[ano]` dinâmico disputando o endereço com toda rota do site, e o prefixo diz o que a página é antes de abrir. Endereço publicado não muda depois.
- **É o `resumo` que publica a página.** `edicaoPublicavel()` testa o texto escrito, e a feature flag `edicoes` governa as três de uma vez. Sem resumo sobram ano e foto, e três endereços rasos indexados valem menos que nenhum.
- **`rotasDeEdicoes()` expande o catálogo**, logo atrás de `/evento`, que é onde mora a linha do tempo que leva a elas. Com essa página fora do ar, seguem depois da home: a posição é de leitura e não pode depender de outra seção estar publicada. Sitemap, página `/sitemap`, espelho em `/docs/edicao/<ano>.md` e a lista do `llms.txt` saem daí.
- **O JSON-LD é `WebPage` com `about: Event` do próprio ano**, e não o `#event` da edição corrente: cada ano tem data e local próprios, ligados por `superEvent` a um `EventSeries` com o nome da marca. Sem `startsAt` não sai `Event` nenhum, porque `Event` sem `startDate` não é lido como evento. A descrição do `Event` é o primeiro parágrafo do resumo, nunca a da página, que chama para a edição de 2026 e anunciaria a data errada no resultado de busca.
- **A cobertura é listada pelo ano de publicação**, com esse rótulo. Uma matéria de março não fala do evento de setembro, e chamá-la de cobertura da edição inventaria um vínculo que a data não sustenta.

O título da página traz a marca com o ano, que é a consulta exata de quem procura por ela, e por isso `pageMetadata()` compara o título com `siteShortName`: título que já diz "XibéSec" não recebe o sufixo da edição corrente.

O caminho a partir da home é o cartão do baralho, cujo título vira link quando a edição tem página. No celular a carta inteira é o botão que troca de registro, e um link ali dentro seria conteúdo interativo aninhado: o acesso fica num link abaixo do trilho, seguindo a carta em foco.

### O quiz em `/quiz`

Nove perguntas, um arquétipo no fim e uma carta em imagem (1080×1920) para compartilhar. Roda inteira no navegador: nome e foto **não saem do aparelho**, e não há coleta de resposta. A rota existe sempre — o que a esconde do menu é `noMenu: true` em `contents/navegacao`.

`ArquetiposIndex` fecha a página com os arquétipos em HTML, renderizados no servidor. É o único conteúdo indexável da rota — o resto está atrás do JavaScript e das perguntas — e é o que o `ItemList` de `quizSchema()` declara: tirar a lista é tirar o assunto da página e mentir no JSON-LD.

Quatro decisões que não se desfazem sem quebrar algo:

- **A carta é DOM fotografado por `html-to-image`, não `canvas`.** O recorte sem borda são três máscaras em gradiente aninhadas, e `ctx.drawImage()` não aplica máscara. Aninhadas porque `mask-composite` diverge entre navegadores.
- **`cacheBust: false` na exportação.** Ligado, concatena `?<timestamp>` na URL de cada imagem — e `blob:` com query string não existe. O sintoma engana: baixar funciona com o mascote e só quebra depois que a pessoa envia a foto.
- **Os assets da carta são data URI** (`carta-assets.ts`), gerados de `public/images/`. Recurso por URL externa sai em branco no arquivo exportado. Regerar quando a marca mudar.
- **`onnxruntime-web` fixado em `1.21.0`**, a peer dependency exata de `@imgly/background-removal`. Com a `1.27` o recorte falha em runtime, e o erro só aparece depois de baixar ~91 MB.

**O recorte de fundo é opcional por construção.** São ~127 MB de um CDN externo, e o WASM leva o `dist/` de ~15 MB para ~175 MB — nada disso no bundle inicial, que segue em 48 KB. O download começa na abertura da página e **não começa** em conexão econômica ou 2g/3g. Falhando, a carta funciona com as máscaras em gradiente.

O WebKit não exporta a imagem, e a interface pede para abrir no Chrome. Detectado por motor, não por nome: todo navegador no iOS é WebKit, inclusive o Chrome de iPhone.

### O terminal em `/terminal`

Menu no topo, o xibesh ocupando a tela inteira sob a barra, e o rodapé — sem terminal — só depois de rolar. É o mesmo `ShellTerminal`: a prop `variant` escolhe entre `rodape`, que sangra a largura toda sob os links, e `palco`, que veste a moldura do terminal do CTF e preenche a altura que a rota reservar. O conteúdo vem de `contents/secoes` na chave `terminal`, e o sistema de arquivos continua saindo de `shell-fs.ts`.

Cinco decisões:

- **A moldura mora em `TerminalFrame`** — barra de título e varredura de fósforo. O `Terminal` do CTF e o xibesh a compartilham: a varredura escrita duas vezes divergiria na primeira mudança de cor.
- **O cabeçalho da página é a abertura do terminal.** Rótulo, `h1` e apoio entram pela prop `banner`, em mono, dentro da janela e acima do log — nunca dentro dele, que é `aria-live` e anunciaria o texto como se fosse saída de comando. Título em display acima da moldura empurraria para fora da vista justamente o que a rota existe para mostrar.
- **A sessão abre com o `neofetch`** (`neofetchNaAbertura`), e o `lede` da seção não vai para a tela: quem chega ao terminal quer o terminal, não a explicação de como ele funciona. A ficha responde data, local, trilhas e CTF na primeira tela, e o texto segue em `contents/secoes` alimentando `/docs/terminal.md`. Ela lê o relógio e a largura da janela, então roda em efeito de montagem, com guarda contra a montagem dupla do StrictMode — no estado inicial, a saída do build não bateria com a de agora.
- **`PaginaInterna` aceita `shellNoRodape={false}` e `folgaNoTopo={false}`**, e essa rota usa os dois. Dois shells na mesma página disputam o foco do teclado e dobram a medição de uso; a folga do topo somaria à barra e jogaria a mesma altura para fora da tela.
- **Quem rola é a janela, não a página.** Ela toma a altura que sobra da moldura, e o empurrão que traz o rodapé para a vista depois de cada comando fica desligado no palco — ali ele só tiraria a barra da tela.

A rota tem documento próprio em `/docs/terminal.md`, e é de lá que sai também a descrição na página `/sitemap` — quem escreve `resumo` no catálogo de `docs.ts` escreve para os dois. A árvore listada nele vem do próprio `shell-fs.ts`, só o primeiro nível e sem os ocultos: documento que lista a flag entrega o brinquedo antes da brincadeira.

O `open <seção>` do shell agora cai na home quando a âncora não existe na página em que ele está — vale para o rodapé de toda rota interna, onde antes o comando respondia "abrindo" e não saía do lugar.

## Git

**Nunca trocar de branch sem pedido explícito.** `git checkout`, `git switch` e qualquer coisa que mova o `HEAD` só acontecem quando a pessoa pede, com essas palavras. Trocar de branch por conta própria — para "organizar", para deixar o trabalho no lugar certo, para o commit sair da branch que parece a correta — muda o chão embaixo de quem está trabalhando: o editor recarrega, o servidor de dev perde o `dist/`, e mudança não commitada vai junto para uma branch que não era a esperada.

O trabalho é feito **na branch em que a sessão está**, seja ela qual for. Parecendo errada, diga isso e pergunte; não corrija sozinho.

Para levar commit de uma branch a outra sem sair da atual, `git fetch . origem:destino` faz o fast-forward sem mexer no `HEAD` nem no working tree. É a ferramenta certa quando o pedido é "puxar para a main" e há trabalho sujo em cima da mesa.

Vale também para o resto do que é irreversível ou compartilhado: sem `push`, sem `reset --hard`, sem reescrever histórico já publicado, sem apagar branch — a não ser que peçam.

## Regras de escrita de código

**Nenhuma copy dentro de `.tsx`.** Texto visível vem de `contents/`. Corrigir uma frase não pode exigir PR de código. Valor calculado no build entra como token `{placeholder}` no JSON e é interpolado no render.

**Indefinido é indefinido.** Campo ausente é `optional`/`nullable` no schema — nunca a string `"A definir"` gravada no dado, que vira copy real por acidente. O componente decide: `<PendingSlot>` para foto que não chegou, `<StatusTag>Em definição</StatusTag>` para grade e palestrante. Isso vale integralmente para número de público das edições anteriores, nomes de palestrantes e detalhes do CTF — ver `PRODUCT.md` → _Explicitamente indefinido_.

**Tailwind 4 CSS-first, sem `tailwind.config`.** Os tokens do `DESIGN.md` vivem em `:root` no `globals.css` e são mapeados em `@theme inline`. O scanner é estático: ``className={`bg-${cor}`}`` não é detectado e a classe some do CSS. Sempre `Record<string, string>` com as classes escritas por extenso.

**Nada de aleatoriedade no render.** `Math.random()` em componente causa mismatch de hidratação. Cor de trilha vem de mapa; destaque vem de `featured: true` no conteúdo.

**Tipos de dado que já deram errado nos projetos de referência:**

- preço em **centavos como `number`**, formatado no render com `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })` — string `"R$ 80,00"` não soma, não compara e não alimenta `Offer.price`;
- horário como **ISO com offset** (`startsAt`/`endsAt`), não `"10:35 - 11:00"` — string livre não ordena, não calcula duração e não gera `.ics`;
- relação palestrante↔palestra por **`speakerSlug`**, nunca por comparação de nome em lowercase.

**Nada de `as unknown as X`** para reconciliar o tipo gerado com o tipo de domínio. Se não bate, o schema está errado — corrija o schema.

**Tema escuro é intenção de marca, não preferência de sistema.** Sem toggle, sem `next-themes`, sem `darkMode: "class"`, sem bloco `prefers-color-scheme`. A única inversão é `.sec--light`, escopada na seção de patrocínio para receber logo com fundo branco chapado.

**shadcn/ui sob demanda.** No máximo `accordion` (FAQ) e `sheet` (menu mobile), pela acessibilidade de teclado. Botão e card são escritos à mão: o `DESIGN.md` proíbe canto arredondado e `box-shadow` em interface, exatamente o default do shadcn.

**Papéis de cor não se trocam:** laranja é ação e hierarquia de seção; menta é dado, hora e confirmação. A leitura do preço e do horário depende disso.

**Comentário é exceção, não hábito.** O código diz _o que_ faz; comentário só entra quando há um _porquê_ que o código não consegue dizer — uma armadilha do navegador, uma ordem que parece arbitrária mas não é, uma decisão contra-intuitiva que alguém desfaria por engano. Comentário que parafraseia a linha seguinte é ruído: ele envelhece, mente e some na revisão.

Não comentar: o óbvio (`// estado do carrossel`), a narração do diff (`// agora com três modos`), nem cada campo de um tipo que o nome já explica. Preferir nome melhor a comentário explicativo, e uma frase seca a um parágrafo literário — o JSDoc de um componente diz para que ele serve em duas ou três linhas, não conta a história de como chegou ali. Na dúvida, apagar: o que sobrevive é o que ninguém deduziria lendo o código.

## Léxico

**Nada de travessão.** O travessão (`—`) é a marca registrada de texto gerado por IA, e a skill `humanizer` o trata como sinal de origem. Não usar em copy de `contents/`, em texto que o site publica (incluindo o espelho em Markdown), em comentário de código nem em mensagem de commit. No lugar dele: vírgula, dois-pontos, ponto final ou parênteses, conforme a frase pedir. Períodos mais curtos costumam ser a resposta certa.

`PRODUCT.md` → _Percepção a Corrigir_ é normativo. Resumo operacional: a palavra _comunidade_ não pode aparecer como a categoria do evento; usar "encontro de cibersegurança", "edição", "programação", "trilhas", "participantes" e "organizações parceiras". Porte se demonstra com número verificável, nunca com adjetivo.

## Biblioteca de componentes

O Storybook é a bancada: componente novo nasce lá, com story, antes de entrar em qualquer rota. `.storybook/preview.tsx` já aplica as três famílias e o chão de igapó, então a story mostra o componente no ambiente real.

```
src/components/
├── primitives/   Button, Container, Section, SectionHeader (+ Eyebrow, SectionTitle),
│                 Tag, Note, Greca, Reveal, SkipLink, PendingSlot, HighlightPanel, KitBanner
├── cards/        TicketCard, SpeakerRow (+ SpeakerList), CallCard, EditionCard, SponsorSlot,
│                 LinkButton
├── data/         Countdown, FactStrip, AgendaGrade (+ AgendaFaixa, AgendaCell),
│                 TimelineList, Terminal, IncludedList
└── layout/       NavBar, Brand, Footer, Dock, BioHeader (+ SocialRow)
```

Regras que valem para todos:

- **Sem copy embutida.** Todo texto visível entra por prop. Os valores nas stories são exemplos de bancada, não conteúdo do site.
- **Estado de pendência é parte do componente**, não um caso à parte: `SpeakerRow` sem `name` declara "A confirmar"; `EditionCard` sem `photo` cai no `PendingSlot`; `SponsorSlot` sem `logo` escreve o nome na moldura, e sem `url` renderiza sem link.
- Componente com estado de navegador (`NavBar`, `Dock`, `Countdown`, `Greca`, `Reveal`) leva `"use client"`; o resto é server component.
- `Countdown` usa `useSyncExternalStore` com relógio compartilhado, não `setState` dentro de efeito — a regra `react-hooks/set-state-in-effect` do ESLint 9 barra o segundo, e o snapshot precisa ser estável entre ticks para não re-renderizar em laço.
- `Reveal` escreve a classe direto no nó via ref. Sem JavaScript o conteúdo aparece inteiro, como manda o `DESIGN.md`.

O addon MCP do Storybook está ligado e declarado em `.mcp.json` — o servidor responde em `http://localhost:6006/mcp` **enquanto `yarn storybook` estiver rodando**.

## Pendências

A home está composta e o build publica; ainda **não existem**:

- `src/lib/event.ts` — geração do `.ics` a partir de `contents/settings`;
- `app/manifest.ts`;
- `error.tsx`, `loading.tsx` e `not-found.tsx` seguem como placeholders vazios do scaffold — o `not-found` não tem nem navegação nem link de volta;
- script `predev` gerando `.studio/studio.d.ts` (o `prebuild` já existe);
- `scripts/validate-content.ts` com Zod;
- `app/programacao/[slug]`, a página de detalhe de cada atividade. Enquanto não existir, `AgendaCell` é renderizada **sem link para a atividade**: só o nome de quem palestra aponta para o perfil. Card que leva a 404 é pior que card sem link. Criando a página, devolver o `href` na seção e conferir sitemap e espelho em Markdown. A rota de palestrante já existe, e é o modelo a seguir;
- números de público e álbuns de fotos das edições anteriores: `publico` e `albumUrl` seguem vazios em `contents/edicoes/`, e a ficha de cada edição declara a pendência;
- logos da imprensa e de boa parte das organizações apoiadoras: `public/images/imprensa/` está vazio, e em `public/images/patrocinadores/` faltam CyberNorte, ITshow, Quantum Village BR, SOC Brazil, Ströngreen, Sympla e VP2 Turismo, que por isso saem com o nome escrito na moldura;
- perfis de rede dos palestrantes: `linkedin`, `github`, `twitter` e `site` estão vazios no frontmatter, e sem eles o `Person` do JSON-LD sai sem `sameAs`, que é o campo que amarra a pessoa à identidade dela fora do site.

As demais coleções em `contents/` existem com o schema declarado e **conteúdo vazio, de propósito**. Não preencher sem pedido explícito.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
