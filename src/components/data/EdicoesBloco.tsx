"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { TimelineList, type TimelineEntry } from "./TimelineList";
import { EditionCard } from "@/components/cards/EditionCard";
import { Eyebrow } from "@/components/primitives/SectionHeader";
import { useDesktop } from "@/lib/use-media";
import { cn } from "@/lib/utils";

export type EdicaoResumo = { ano: number; tema: string; foto?: string; href?: string };

export type EdicoesBlocoProps = {
  edicoes: EdicaoResumo[];
  /** A edição corrente, que fecha a linha do tempo sem carta no baralho. */
  atual: TimelineEntry;
  /** A próxima edição, anunciada sem carta e sem link: ainda não tem registro. */
  proxima?: TimelineEntry;
  edicoesLabel: string;
  registroPendente: string;
  /** Rótulo do link para a página da edição em foco, no carrossel do celular. */
  paginaLabel: string;
  /** Texto da origem do nome, renderizado no servidor. */
  children: ReactNode;
};

const NAV_FALLBACK = 66;

/**
 * Linha do tempo à esquerda e baralho de registros à direita, sincronizados.
 *
 * Duas sutilezas herdadas do protótipo:
 *
 * 1. As cartas são `sticky`. Tanto o salto por âncora quanto `offsetTop` enxergam
 *    a posição GRUDADA, não a de fluxo — com a carta colada no topo, as duas
 *    leituras dizem que ela já está visível e o clique não faz nada. A saída é
 *    desligar o sticky por um instante, medir, e religar antes da pintura.
 *
 * 2. Marcar a carta pelo ponto de cola erra por um: quando a seguinte sobe por
 *    cima, a anterior continua grudada e ainda passaria no teste. O critério é
 *    uma linha de leitura a 45% da altura da janela — a última carta que a
 *    cruzou é a que o olho está vendo.
 *
 * No celular o mesmo baralho vira carrossel horizontal, e quem manda na carta em
 * vista deixa de ser a rolagem e passa a ser o índice. Não é preferência de
 * composição: empilhar por rolagem precisa de uma altura que a dobra não tem, e
 * a carta grudada no topo ignora o clique da linha do tempo.
 */
export function EdicoesBloco({
  edicoes,
  atual,
  proxima,
  edicoesLabel,
  registroPendente,
  paginaLabel,
  children,
}: EdicoesBlocoProps) {
  const desktop = useDesktop();
  const deckRef = useRef<HTMLDivElement>(null);
  const trilhoRef = useRef<HTMLDivElement>(null);
  const [ativo, setAtivo] = useState(-1);
  // A tira abre na edição mais recente, não na primeira.
  const [foco, setFoco] = useState(() => Math.max(0, edicoes.length - 1));
  // Enquanto o trilho anda por conta de um clique, o `onScroll` que a própria
  // animação dispara não pode reescrever o foco — chegaria com a posição do meio
  // do caminho e desfaria o clique.
  const conduzindo = useRef(0);

  const alturaNav = () =>
    parseInt(getComputedStyle(document.documentElement).getPropertyValue("--nav-h"), 10) ||
    NAV_FALLBACK;

  const cartas = useCallback(
    () => Array.from(deckRef.current?.querySelectorAll<HTMLElement>("[data-carta]") ?? []),
    [],
  );

  // Vivo no celular, este listener faria a rolagem da página roubar o foco da tira.
  useEffect(() => {
    if (!desktop) return;
    let frame = 0;

    const marcar = () => {
      frame = 0;
      const lista = cartas();
      if (lista.length === 0) return;

      const linhaLeitura = window.innerHeight * 0.45;
      const piso = alturaNav();
      let atualIndex = -1;

      lista.forEach((carta, index) => {
        const r = carta.getBoundingClientRect();
        if (r.top <= linhaLeitura && r.bottom > piso) atualIndex = index;
      });

      setAtivo(atualIndex);
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(marcar);
    };

    marcar();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [cartas, desktop]);

  // Deslocamento na mão porque `scrollIntoView` arrastaria a página junto para
  // alinhar o eixo vertical; aqui só o trilho se move.
  const irParaFoco = useCallback((index: number, animar = true) => {
    const trilho = trilhoRef.current;
    const carta = trilho?.children[index] as HTMLElement | undefined;
    if (!trilho || !carta) return;

    const calmo = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const suave = animar && !calmo;

    // A trava cai por tempo porque não existe evento de fim de `scrollTo`.
    window.clearTimeout(conduzindo.current);
    conduzindo.current = window.setTimeout(() => (conduzindo.current = 0), suave ? 700 : 80);

    // Centraliza, para bater com o `snap-center` que o gesto obedece — mirar a
    // borda esquerda deixaria a carta a meio encaixe e o snap a puxaria de volta.
    const alvo = carta.offsetLeft + carta.offsetWidth / 2 - trilho.clientWidth / 2;
    trilho.scrollTo({ left: Math.max(0, alvo), behavior: suave ? "smooth" : "auto" });
  }, []);

  const focar = useCallback(
    (index: number) => {
      setFoco(index);
      irParaFoco(index);
    },
    [irParaFoco],
  );

  // O estado nasce na edição mais recente, mas o trilho nasce em zero: sem este
  // alinhamento a tira abriria na primeira carta contradizendo a linha do tempo.
  useEffect(() => {
    if (!desktop) irParaFoco(Math.max(0, edicoes.length - 1), false);
  }, [desktop, edicoes.length, irParaFoco]);

  // O arrasto do dedo não é interceptado: lê-se onde a rolagem nativa parou, e é
  // assim que a linha do tempo segue o gesto e não só o clique.
  const aoRolarTrilho = () => {
    const trilho = trilhoRef.current;
    if (!trilho || conduzindo.current) return;

    const meio = trilho.scrollLeft + trilho.clientWidth / 2;
    const cartasTira = Array.from(trilho.children) as HTMLElement[];
    let perto = 0;
    let menor = Infinity;

    cartasTira.forEach((carta, index) => {
      const centro = carta.offsetLeft + carta.offsetWidth / 2;
      const dist = Math.abs(centro - meio);
      if (dist < menor) {
        menor = dist;
        perto = index;
      }
    });

    setFoco(perto);
  };

  const irParaCarta = (index: number) => {
    const deck = deckRef.current;
    const lista = cartas();
    const carta = lista[index];
    if (!deck || !carta) return;

    // Mede o fluxo real com o sticky desligado, e religa antes da pintura.
    deck.dataset.semCola = "true";
    const y = carta.getBoundingClientRect().top + window.scrollY;
    delete deck.dataset.semCola;

    const parada = alturaNav() + 38 + index * 16;
    const calmo = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: Math.max(0, y - parada), behavior: calmo ? "auto" : "smooth" });
  };

  const emVista = desktop ? ativo : foco;

  const entries: TimelineEntry[] = [
    ...edicoes.map((edicao, index) => ({
      year: edicao.ano,
      label: edicao.tema,
      href: `#ed-${edicao.ano}`,
      onNavigate: () => (desktop ? irParaCarta(index) : focar(index)),
      active: index === emVista,
    })),
    atual,
    ...(proxima ? [proxima] : []),
  ];

  return (
    <>
      <div className="sticky top-[calc(var(--nav-h)+30px)] max-[900px]:static">
        {children}

        <Eyebrow tone="dim" className="mt-[clamp(24px,3.6vw,44px)] mb-4">
          {edicoesLabel}
        </Eyebrow>

        <TimelineList entries={entries} />
      </div>

      <div className="min-w-0">
        {desktop ? (
          <div
            ref={deckRef}
            className="grid gap-[clamp(20px,2.6vw,32px)] [&[data-sem-cola]_[data-carta]]:static"
          >
            {edicoes.map((edicao, index) => (
              <EditionCard
                key={edicao.ano}
                id={`ed-${edicao.ano}`}
                year={edicao.ano}
                title={edicao.tema}
                caption={registroPendente}
                photo={edicao.foto || undefined}
                href={edicao.href}
                index={index}
                active={index === ativo}
                data-carta=""
                className="sticky top-[calc(var(--nav-h)+38px+var(--i)*16px)] scroll-mt-[calc(var(--nav-h)+38px)]"
              />
            ))}
          </div>
        ) : (
          <div
            ref={trilhoRef}
            onScroll={aoRolarTrilho}
            // `touch-pan-x` entrega o eixo horizontal ao trilho e mantém o
            // vertical com a página: sem isso o polegar em diagonal trava a
            // rolagem da página em cima da tira.
            className="-mx-4 flex touch-pan-x snap-x snap-mandatory [scrollbar-width:none] gap-3 overflow-x-auto overscroll-x-contain px-4 [&::-webkit-scrollbar]:hidden"
          >
            {edicoes.map((edicao, index) => {
              const emFoco = index === foco;
              // Carta ao lado se aproxima; a que já está no centro avança. Fazer
              // a de fora avançar move uma terceira carta e desorienta.
              const destino = emFoco ? (index + 1) % edicoes.length : index;

              return (
                <button
                  key={edicao.ano}
                  type="button"
                  // Nomeia o destino, não o gesto: quem não vê a tira não deduz
                  // qual é a "próxima".
                  aria-label={`Ver ${edicoes[destino].tema}`}
                  aria-current={emFoco ? "true" : undefined}
                  onClick={() => focar(destino)}
                  className={cn(
                    "w-[84%] shrink-0 snap-center text-left",
                    "ease-brand transition-opacity duration-300",
                    "focus-visible:outline-mint focus-visible:outline-2 focus-visible:outline-offset-4",
                    emFoco ? "opacity-100" : "opacity-55",
                  )}
                >
                  <EditionCard
                    id={`ed-${edicao.ano}`}
                    year={edicao.ano}
                    title={edicao.tema}
                    caption={registroPendente}
                    photo={edicao.foto || undefined}
                    // Sem pilha não há o que inclinar, e 1 é o índice sem desvio.
                    index={1}
                    active={emFoco}
                  />
                </button>
              );
            })}
          </div>
        )}

        {/* No celular a carta inteira é o botão que troca de registro, e um link
            dentro dele seria conteúdo interativo aninhado. O caminho para a
            página da edição fica aqui embaixo, seguindo a carta em foco. */}
        {!desktop && edicoes[foco]?.href ? (
          <a
            href={edicoes[foco].href}
            className="text-cream-2 ease-brand hover:text-orange focus-visible:text-orange mt-4 inline-block font-mono text-[12px] tracking-[0.14em] uppercase transition-colors duration-250"
          >
            {`${paginaLabel} ${edicoes[foco].tema.toLocaleLowerCase("pt-BR")}`}
          </a>
        ) : null}
      </div>
    </>
  );
}
