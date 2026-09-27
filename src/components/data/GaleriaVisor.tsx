"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type GaleriaVisorRotulos = {
  fechar: string;
  anterior: string;
  proxima: string;
  baixar: string;
};

export type GaleriaVisorProps = {
  children: ReactNode;
  rotulos: GaleriaVisorRotulos;
  className?: string;
};

type Aberta = {
  slug: string;
  src: string;
  alt: string;
  horario: string;
  posicao: number;
  total: number;
  anterior?: string;
  proxima?: string;
};

const REABRIR = "galeria:hash";

function assinar(avisar: () => void) {
  window.addEventListener("hashchange", avisar);
  window.addEventListener(REABRIR, avisar);
  return () => {
    window.removeEventListener("hashchange", avisar);
    window.removeEventListener(REABRIR, avisar);
  };
}

const lerHash = () => decodeURIComponent(window.location.hash.slice(1));

/**
 * O visor lê as fotos do HTML que o servidor já escreveu, e não de uma lista em
 * prop: a galeria tem centenas de itens, e repeti-los no payload do cliente
 * dobraria o peso da página para dizer o que os links já dizem.
 */
function fotoAberta(slug: string): Aberta | null {
  if (!slug) return null;
  const links = [...document.querySelectorAll<HTMLAnchorElement>("a[data-foto]")];
  const i = links.findIndex((link) => link.dataset.foto === slug);
  if (i === -1) return null;

  const link = links[i];
  return {
    slug,
    src: link.href,
    alt: link.querySelector("img")?.alt ?? "",
    horario: link.dataset.horario ?? "",
    posicao: i + 1,
    total: links.length,
    anterior: links[i - 1]?.dataset.foto,
    proxima: links[i + 1]?.dataset.foto,
  };
}

/** Troca de foto sem empilhar histórico: o voltar do celular fecha o visor inteiro. */
function irPara(slug: string) {
  window.location.replace(`#${slug}`);
}

function limparHash() {
  const { pathname, search } = window.location;
  window.history.replaceState(null, "", `${pathname}${search}`);
  window.dispatchEvent(new Event(REABRIR));
}

/**
 * Foto ampliada sobre a galeria, em `<dialog>` nativo: foco preso, `Esc` e o
 * leitor de tela tratando a camada como modal saem do navegador, não de código.
 *
 * O estado é o hash da URL. Abrir uma foto grava `#slug`, e é assim que a faixa
 * da home leva direto a ela e que o link de uma foto pode ser compartilhado.
 * Sem JavaScript o mesmo hash rola até a miniatura, que é link para o arquivo.
 */
export function GaleriaVisor({ children, rotulos, className }: GaleriaVisorProps) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const toque = useRef<number | null>(null);
  // Aberta por clique, a foto empilhou uma entrada no histórico, e fechar volta
  // por ela. Aberta por link, voltar sairia da página: aí só o hash some.
  const empilhou = useRef(false);
  const slug = useSyncExternalStore(assinar, lerHash, () => "");
  const aberta = slug ? fotoAberta(slug) : null;
  const estaAberta = aberta !== null;

  useEffect(() => {
    const el = dialogo.current;
    if (!el) return;
    if (estaAberta && !el.open) el.showModal();
    if (!estaAberta && el.open) el.close();
    document.documentElement.style.overflow = estaAberta ? "hidden" : "";
    if (!estaAberta) empilhou.current = false;
  }, [estaAberta]);

  // Trocar o hash é uma navegação por fragmento, e o navegador devolve o foco ao
  // `<body>`, fora do diálogo: a segunda seta já não chegaria ao `onKeyDown`, e o
  // leitor de tela perderia a camada.
  const aberto = aberta?.slug;
  useEffect(() => {
    const el = dialogo.current;
    if (aberto && el && !el.contains(document.activeElement)) el.focus();
  }, [aberto]);

  function fechar() {
    if (!lerHash()) return;
    if (empilhou.current) window.history.back();
    else limparHash();
  }

  // As vizinhas entram no cache antes do clique: é o que faz a seta parecer
  // instantânea numa conexão de celular.
  useEffect(() => {
    for (const vizinha of [aberta?.anterior, aberta?.proxima]) {
      const src = vizinha ? fotoAberta(vizinha)?.src : undefined;
      if (src) new Image().src = src;
    }
  }, [aberta?.anterior, aberta?.proxima]);

  function aoClicar(evento: React.MouseEvent) {
    const link = (evento.target as HTMLElement).closest<HTMLAnchorElement>("a[data-foto]");
    if (!link?.dataset.foto) return;
    // Ctrl, Cmd e botão do meio abrem o arquivo em outra aba, como link comum.
    if (evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.button !== 0) return;
    evento.preventDefault();
    empilhou.current = true;
    window.location.hash = link.dataset.foto;
  }

  function aoTeclar(evento: React.KeyboardEvent) {
    if (evento.key === "ArrowRight" && aberta?.proxima) irPara(aberta.proxima);
    if (evento.key === "ArrowLeft" && aberta?.anterior) irPara(aberta.anterior);
  }

  function aoSoltar(evento: React.PointerEvent) {
    if (toque.current === null || !aberta) return;
    const dx = evento.clientX - toque.current;
    toque.current = null;
    if (dx < -48 && aberta.proxima) irPara(aberta.proxima);
    if (dx > 48 && aberta.anterior) irPara(aberta.anterior);
  }

  const seta =
    "font-mono text-[22px] text-cream hover:text-mint focus-visible:text-mint ease-brand transition-colors duration-250 disabled:pointer-events-none disabled:opacity-20 max-[900px]:hidden";

  return (
    <div onClick={aoClicar} className={className}>
      {children}

      <dialog
        ref={dialogo}
        aria-label={aberta?.alt}
        onClose={fechar}
        onKeyDown={aoTeclar}
        tabIndex={-1}
        className="bg-ink-deep text-cream m-0 h-dvh max-h-none w-screen max-w-none p-0 outline-none backdrop:bg-transparent"
      >
        {aberta ? (
          <div className="grid h-full grid-rows-[auto_1fr]">
            <div className="border-line flex items-center justify-between gap-4 border-b px-(--gutter) py-3">
              <p className="font-mono text-[12px] tracking-[0.16em] uppercase">
                <span className="text-mint">
                  {aberta.posicao} / {aberta.total}
                </span>
                {aberta.horario ? (
                  <span className="text-cream-3 ml-4">{aberta.horario}</span>
                ) : null}
              </p>

              <div className="flex items-center gap-5">
                <a
                  href={aberta.src}
                  download={aberta.src.split("/").pop()}
                  className="text-cream-2 hover:text-mint focus-visible:text-mint ease-brand font-mono text-[12px] tracking-[0.16em] uppercase transition-colors duration-250"
                >
                  {rotulos.baixar}
                </a>
                <button
                  type="button"
                  onClick={fechar}
                  className="text-cream hover:text-orange focus-visible:text-orange ease-brand font-mono text-[12px] tracking-[0.16em] uppercase transition-colors duration-250"
                >
                  {rotulos.fechar} ✕
                </button>
              </div>
            </div>

            <div
              className="grid min-h-0 grid-cols-[64px_1fr_64px] grid-rows-1 items-center max-[900px]:grid-cols-1"
              onPointerDown={(evento) => (toque.current = evento.clientX)}
              onPointerUp={aoSoltar}
            >
              <button
                type="button"
                aria-label={rotulos.anterior}
                disabled={!aberta.anterior}
                onClick={() => aberta.anterior && irPara(aberta.anterior)}
                className={cn(seta, "h-full")}
              >
                ←
              </button>

              {/* eslint-disable-next-line @next/next/no-img-element -- o arquivo ampliado é trocado a cada seta, e `next/image` reservaria a caixa pela primeira foto. */}
              <img
                key={aberta.src}
                src={aberta.src}
                alt={aberta.alt}
                className="block h-full w-full touch-pan-y object-contain py-(--gutter) select-none max-[900px]:px-(--gutter)"
                draggable={false}
              />

              <button
                type="button"
                aria-label={rotulos.proxima}
                disabled={!aberta.proxima}
                onClick={() => aberta.proxima && irPara(aberta.proxima)}
                className={cn(seta, "h-full")}
              >
                →
              </button>
            </div>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
