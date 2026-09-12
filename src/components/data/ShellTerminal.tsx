"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/primitives/Container";
import { TerminalFrame } from "@/components/data/TerminalFrame";
import { EVENTOS } from "@/lib/analytics";
import { evento } from "@/lib/analytics-client";
import { cn } from "@/lib/utils";

export type ShellNode = string[] | { [name: string]: ShellNode };

type Tom = "dim" | "ok" | "warn" | "dir" | "oculto" | null;
type Segmento = { texto: string; tom?: Tom; cor?: string };
type Linha = { id: number; segmentos: Segmento[] };

export type ShellTerminalProps = {
  fs: ShellNode;
  /** Data-alvo do evento, para o `uptime`. */
  target: string;
  usuario?: string;
  /**
   * `rodape` sangra a largura toda sob os links; `palco` preenche a caixa que o
   * envolve — na rota do shell, a tela inteira sob a barra.
   */
  variant?: "rodape" | "palco";
  /** Abertura estática acima do log, onde o palco carrega o assunto da página. */
  banner?: ReactNode;
  /** Roda `neofetch` ao abrir: a ficha do evento no lugar de uma tela vazia. */
  neofetchNaAbertura?: boolean;
  className?: string;
};

/**
 * A cuia do logotipo, com os circuitos brotando. Cada parede recua uma coluna
 * por linha: fora dessa conta a boca e o fundo deixam de se encontrar.
 */
const CUIA = [
  "      o   o   o",
  "      |   |   |",
  "   ___|___|___|___",
  "   \\             /",
  "    \\  /\\/\\/\\/  /",
  "     \\         /",
  "      \\_______/",
];

const PALETA = ["#152310", "#1E3218", "#00B368", "#4FE3AC", "#EE7B2E", "#FA8F45", "#F2E4C4"];

/** As seis campeãs de todo relatório de vazamento. A piada é o recado. */
const SENHAS = new Set(["admin", "123456", "12345678", "000000", "00000000", "xibesec@2026"]);

/** Existe e aparece no `ls -a`, mas só abre com privilégio. */
const SO_ROOT = new Set([".flag", ".premio.txt"]);

const SEGREDO: Record<string, ShellNode> = {
  // A flag saiu: era estática num site estático, e bastou a primeira pessoa
  // colar no grupo para o resto não precisar procurar. Prêmio por descoberta
  // só volta com valor conferido fora do bundle.
  ".premio.txt": [
    "Você virou root num rodapé. Isso não conta como pentest,",
    "mas conta como curiosidade — que é o que a gente procura.",
    "",
    "Leve essa curiosidade para setembro: o CTF do XibéSec",
    "premia quem procura de verdade.",
  ],
};

const SECOES: Record<string, string> = {
  evento: "#evento",
  programacao: "#programacao",
  ingressos: "#ingressos",
  local: "#local",
  ctf: "#ctf",
  palestrantes: "#palestrantes",
  participe: "#participe",
  patrocinio: "#patrocinio",
  edicoes: "#origem",
  origem: "#origem",
  trilhas: "#programacao",
};

const AJUDA: Record<string, string[]> = {
  ls: [
    "Uso: ls [OPÇÃO]... [ARQUIVO]...",
    "Lista o conteúdo do diretório.",
    "",
    "  -a   mostra também os itens ocultos",
    "  -l   formato longo, com permissões e dono",
  ],
  cd: [
    "Uso: cd [DIRETÓRIO]",
    "Muda o diretório atual. Sem argumento, volta para ~.",
    "",
    "  ..   sobe um nível",
  ],
  cat: [
    "Uso: cat ARQUIVO...",
    "Escreve o conteúdo do arquivo na saída.",
    "",
    "Arquivos de leitura restrita exigem privilégio.",
  ],
  open: [
    "Uso: open SEÇÃO",
    "Rola a página até a seção correspondente.",
    "",
    "Seções: evento, programacao, ctf, palestrantes, ingressos,",
    "        participe, patrocinio, local",
  ],
  sudo: [
    "Uso: sudo COMANDO",
    "Executa um comando com privilégio de root.",
    "",
    "  sudo su   abre uma sessão root até você digitar exit",
  ],
  su: ["Uso: su", "Atalho para sudo su."],
  pwd: ["Uso: pwd", "Escreve o caminho do diretório atual."],
  whoami: ["Uso: whoami", "Escreve o nome do usuário atual."],
  date: ["Uso: date", "Escreve a data e a hora de agora."],
  uptime: ["Uso: uptime", "Tempo desta sessão e quanto falta para o evento."],
  neofetch: ["Uso: neofetch", "Ficha do evento ao lado da cuia em ASCII."],
  echo: ["Uso: echo [TEXTO]...", "Repete o texto na saída."],
  history: ["Uso: history", "Lista os comandos já digitados nesta sessão."],
  clear: ["Uso: clear", "Limpa a saída. Ctrl+L faz o mesmo."],
  exit: ["Uso: exit", "Encerra a sessão root e volta ao usuário comum."],
  help: ["Uso: help", "Lista os comandos. Use COMANDO --help para o detalhe."],
};

const COMANDOS = [
  "ls",
  "cd",
  "cat",
  "open",
  "pwd",
  "whoami",
  "date",
  "uptime",
  "neofetch",
  "echo",
  "history",
  "clear",
  "sudo",
  "su",
  "exit",
  "help",
];

const ehDir = (no: ShellNode | undefined): no is { [name: string]: ShellNode } =>
  !!no && typeof no === "object" && !Array.isArray(no);

const TOM_CLASS: Record<string, string> = {
  dim: "text-cream/45",
  ok: "text-mint",
  warn: "text-orange",
  dir: "text-mint font-bold",
  oculto: "text-cream/40",
};

/**
 * Terminal do rodapé: um shell de brincadeira sobre um sistema de arquivos que
 * espelha o conteúdo do site. Tem `sudo` que aceita as senhas mais vazadas do
 * mundo — a piada é o recado —, uma flag escondida e um prêmio para quem virar
 * root.
 *
 * No rodapé o bloco sangra a largura toda e a cor é a de lá: não é um painel à
 * parte, e qualquer fundo próprio ali desenha uma caixa com beirada visível. Em
 * `/terminal` o shell é o assunto da página: ganha a moldura do `Terminal` e
 * preenche a altura que a rota reservar para ele.
 *
 * No toque os atalhos de teclado — `Tab` completa, `↑ ↓` repetem, `Ctrl+L` limpa
 * — não existem, e os comandos precisam ser digitados por extenso.
 */
export function ShellTerminal({
  fs,
  target,
  usuario = "xibesec@2026",
  variant = "rodape",
  banner,
  neofetchNaAbertura = false,
  className,
}: ShellTerminalProps) {
  const palco = variant === "palco";
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [valor, setValor] = useState("");
  const [cwd, setCwd] = useState<string[]>([]);
  const [root, setRoot] = useState(false);
  const [senhaPendente, setSenhaPendente] = useState<string[] | null>(null);

  const router = useRouter();

  const raizRef = useRef<HTMLDivElement>(null);
  const janelaRef = useRef<HTMLDivElement>(null);
  const campoRef = useRef<HTMLInputElement>(null);
  const historico = useRef<string[]>([]);
  const posicao = useRef(0);
  const contador = useRef(0);
  const abertura = useRef(0);
  const tentativas = useRef(0);
  const navegou = useRef(false);
  /** O terminal está sempre na página: quem conta como uso é o primeiro comando. */
  const usou = useRef(false);
  const montou = useRef(false);

  useEffect(() => {
    // A ficha lê o relógio e a largura da janela, por isso nasce aqui e não no
    // estado inicial; o guarda é a montagem dupla do StrictMode.
    if (montou.current) return;
    montou.current = true;
    abertura.current = Date.now();
    if (neofetchNaAbertura) executar(["neofetch"]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const arvore = useMemo(() => (root && ehDir(fs) ? { ...fs, ...SEGREDO } : fs), [fs, root]);

  const buscar = useCallback(
    (partes: string[]): ShellNode | undefined =>
      partes.reduce<ShellNode | undefined>(
        (no, parte) => (ehDir(no) ? no[parte] : undefined),
        arvore,
      ),
    [arvore],
  );

  const resolver = useCallback(
    (arg: string): string[] => {
      const absoluto = /^[~/]/.test(arg);
      const base = absoluto ? [] : cwd.slice();
      for (const parte of arg.replace(/^[~/]+/, "").split("/")) {
        if (!parte || parte === ".") continue;
        if (parte === "..") base.pop();
        else base.push(parte);
      }
      return base;
    },
    [cwd],
  );

  const caminho = "~" + (cwd.length ? "/" + cwd.join("/") : "");
  const quem = root ? "root@2026" : usuario;
  const prompt = `${quem}:${caminho}${root ? "#" : "$"}`;
  const PEDIDO = `[sudo] senha para ${usuario.split("@")[0]}:`;

  const push = (segmentos: Segmento[]) => {
    contador.current += 1;
    setLinhas((atual) => [...atual, { id: contador.current, segmentos }]);
  };
  const escrever = (texto: string, tom?: Tom) => push([{ texto, tom }]);
  const erro = (texto: string) => escrever(texto, "warn");

  const listar = (no: { [name: string]: ShellNode }, ocultos: boolean) =>
    Object.keys(no)
      .filter((nome) => ocultos || nome[0] !== ".")
      .sort((a, b) => a.localeCompare(b, "pt-BR"));

  const irPara = (seletor: string) => {
    const alvo = document.querySelector(seletor);
    // As seções são da home, e o shell também roda fora dela: sem a âncora nesta
    // página, `open` carrega a home no lugar de não sair do lugar.
    if (!alvo) {
      navegou.current = true;
      router.push(`/${seletor}`);
      return;
    }
    navegou.current = true;
    const calmo = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    alvo.scrollIntoView({ behavior: calmo ? "auto" : "smooth", block: "start" });
  };

  /** Depois de cada comando o terminal encosta a base na borda inferior. */
  const trazerParaVista = () => {
    const raiz = raizRef.current;
    if (!raiz) return;
    const r = raiz.getBoundingClientRect();
    const folga = 16;
    const excedeAbaixo = r.bottom - (window.innerHeight - folga);
    const excedeAcima = folga - r.top;
    const d = excedeAbaixo > 0 ? excedeAbaixo : excedeAcima > 0 ? -excedeAcima : 0;
    if (Math.abs(d) < 2) return;
    const calmo = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Salto longo vai direto: rolagem suave por meia página vira espera.
    const suave = !calmo && Math.abs(d) < window.innerHeight * 1.5;
    window.scrollBy({ top: d, behavior: suave ? "smooth" : "auto" });
  };

  // Declaração de função, não `useCallback`: `sudo` chama `executar` de volta, e
  // uma const só existe depois da linha em que é declarada.
  function executar(partes: string[], comoRoot = root) {
    {
      const [nome, ...args] = partes;
      const chave = (nome ?? "").toLowerCase();

      if (args.some((a) => a === "--help" || a === "-h")) {
        const texto = AJUDA[chave];
        if (!texto) return erro(`${chave}: sem página de ajuda`);
        texto.forEach((l) => escrever(l, l.startsWith("Uso:") ? "ok" : null));
        return;
      }

      switch (chave) {
        case "help": {
          escrever("Comandos: ls, cd, cat, open, pwd, whoami, date, uptime, neofetch,");
          escrever("          echo, history, clear, help");
          escrever("Atalhos:  Tab completa, ↑ ↓ repetem, Ctrl+L limpa");
          escrever("Detalhe de cada um: COMANDO --help");
          escrever("O que não está aqui você descobre olhando.", "dim");
          return;
        }

        case "ls": {
          const flags = args.filter((a) => a[0] === "-").join("");
          const ocultos = flags.includes("a");
          const longo = flags.includes("l");
          const alvo = args.find((a) => a[0] !== "-");
          const no = buscar(alvo ? resolver(alvo) : cwd);

          if (no === undefined) {
            return erro(`ls: não foi possível acessar '${alvo}': Arquivo ou diretório inexistente`);
          }
          if (!ehDir(no)) return escrever(alvo ?? "");

          const nomes = listar(no, ocultos);
          if (!nomes.length) return;

          if (longo) {
            nomes.forEach((n) => {
              const dir = ehDir(no[n]);
              const restrito = SO_ROOT.has(n);
              const modo = dir ? "drwxr-xr-x" : restrito ? "-rw-------" : "-rw-r--r--";
              const dono = restrito ? "root     root    " : "xibesec  xibesec ";
              const item = no[n];
              const tam = dir ? "4096" : String((item as string[]).join("\n").length);
              push([
                { texto: `${modo}  ${dono}${tam.padStart(5)}  ` },
                { texto: n + (dir ? "/" : ""), tom: dir ? "dir" : n[0] === "." ? "oculto" : null },
              ]);
            });
          } else {
            push(
              nomes.flatMap((n, i) => {
                const dir = ehDir(no[n]);
                const seg: Segmento[] = [
                  {
                    texto: n + (dir ? "/" : ""),
                    tom: dir ? "dir" : n[0] === "." ? "oculto" : null,
                  },
                ];
                if (i < nomes.length - 1) seg.push({ texto: "   " });
                return seg;
              }),
            );
          }

          if (!ocultos) {
            const n = listar(no, true).length - nomes.length;
            if (n > 0) escrever(`(${n}${n === 1 ? " item oculto" : " itens ocultos"})`, "dim");
          }
          return;
        }

        case "cd": {
          const alvo = args[0] || "~";
          const destino = resolver(alvo);
          const no = buscar(destino);
          if (no === undefined) return erro(`cd: ${alvo}: Arquivo ou diretório inexistente`);
          if (!ehDir(no)) return erro(`cd: ${alvo}: Não é um diretório`);
          setCwd(destino);
          return;
        }

        case "cat": {
          if (!args.length) return erro("cat: falta operando");
          for (const a of args) {
            const partesCaminho = resolver(a);
            const nomeArquivo = partesCaminho[partesCaminho.length - 1] ?? "";
            const no = buscar(partesCaminho);
            if (no === undefined) return erro(`cat: ${a}: Arquivo ou diretório inexistente`);
            if (ehDir(no)) return erro(`cat: ${a}: É um diretório`);
            // Nega e cala, como o shell de verdade: quem souber, sabe.
            const restrito = SO_ROOT.has(nomeArquivo);
            if (restrito && !comoRoot) return erro(`cat: ${a}: Permissão negada`);
            // O nome do arquivo, nunca o conteúdo: a flag é o segredo do desafio.
            if (restrito) evento(EVENTOS.shellFlagEncontrada, { arquivo: nomeArquivo });
            no.forEach((linha) => escrever(linha, restrito ? "ok" : null));
          }
          return;
        }

        case "open": {
          const bruto = (args[0] ?? "")
            .replace(/\/+$/, "")
            .replace(/\.txt$/, "")
            .replace(/^[.~/]+/, "");
          const sel = SECOES[bruto];
          if (!sel) return erro(`open: ${args[0] ?? ""}: não há seção com esse nome`);
          escrever(`abrindo ${sel} …`, "dim");
          irPara(sel);
          return;
        }

        case "pwd":
          return escrever("/home/xibesec" + caminho.slice(1));

        case "whoami":
          return escrever(comoRoot ? "root" : "xibesec");

        case "date":
          return escrever(
            new Date().toLocaleString("pt-BR", { dateStyle: "full", timeStyle: "short" }),
          );

        case "echo":
          return escrever(args.join(" "));

        case "history":
          return historico.current.forEach((h, i) =>
            escrever(`${String(i + 1).padStart(4)}  ${h}`),
          );

        case "clear":
          return setLinhas([]);

        case "uptime": {
          const seg = Math.floor((Date.now() - abertura.current) / 1000);
          const h = Math.floor(seg / 3600);
          const m = Math.floor(seg / 60) % 60;
          const ligado = h ? `${h} h ${m} min` : m ? `${m} min` : `${seg} s`;
          escrever(
            ` ${new Date().toLocaleTimeString("pt-BR")}  no ar há ${ligado},  1 usuário,  fome: alta`,
          );
          const resta = new Date(target).getTime() - Date.now();
          if (resta > 0) {
            const d = Math.floor(resta / 86400000);
            const hh = Math.floor(resta / 3600000) % 24;
            escrever(` faltam ${d} dias e ${hh} horas para o XibéSec 2026`, "ok");
          } else {
            escrever(" é hoje.", "ok");
          }
          return;
        }

        case "neofetch": {
          const seg = Math.floor((Date.now() - abertura.current) / 1000);
          const m = Math.floor(seg / 60);
          const info: Array<[string, string]> = [
            [usuario, ""],
            ["-".repeat(usuario.length), ""],
            ["Evento", "XibéSec 2026 · 4ª edição"],
            ["Data", "19 de setembro de 2026, 09h às 19h"],
            ["Local", "Bristol Marambaia Hotel, Belém/PA"],
            ["Trilhas", "técnica e gerencial, em paralelo"],
            ["CTF", "captura de flags, incluso no ingresso"],
            ["Shell", "xibesh 1.0"],
            ["Sessão", m ? `${m} min` : `${seg} s`],
          ];
          const texto = info.map(([k, v]) => (k && v ? k.padEnd(10) + v : k)).filter(Boolean);

          if (window.innerWidth < 760) {
            CUIA.forEach((l) => escrever(l, "ok"));
            escrever("");
            texto.forEach((l) => escrever(l));
          } else {
            const total = Math.max(CUIA.length, texto.length);
            for (let i = 0; i < total; i++) {
              push([{ texto: (CUIA[i] ?? "").padEnd(20), tom: "ok" }, { texto: texto[i] ?? "" }]);
            }
          }

          escrever("");
          push(PALETA.map((cor) => ({ texto: "", cor })));
          return;
        }

        case "sudo": {
          if (!args.length) return erro("uso: sudo <comando>");
          if (comoRoot) return executar(args, true);
          tentativas.current = 0;
          setSenhaPendente(args);
          return;
        }

        case "su":
          return executar(["sudo", "su", ...args], comoRoot);

        case "exit": {
          if (!comoRoot) return escrever("Não dá para sair. O evento é presencial.", "dim");
          setRoot(false);
          escrever("saindo do root.", "dim");
          return;
        }

        default:
          return erro(`bash: ${nome}: comando não encontrado`);
      }
    }
  }

  const ecoar = (texto: string, senha = false) =>
    push([{ texto: senha ? PEDIDO : prompt, tom: senha ? "dim" : "ok" }, { texto: ` ${texto}` }]);

  const conferirSenha = (tentada: string) => {
    const args = senhaPendente ?? [];
    if (SENHAS.has(tentada.trim().toLowerCase())) {
      evento(EVENTOS.shellSudoSucesso, { tentativas: tentativas.current + 1 });
      setSenhaPendente(null);
      escrever("Senha aceita. E é por isso que existe evento de segurança.", "dim");
      if (/^(su|-s|-i)$/.test(args[0] ?? "")) {
        // `sudo su` não anuncia nada: o prompt virando # é o aviso.
        setRoot(true);
        return;
      }
      executar(args, true);
      return;
    }

    tentativas.current += 1;
    evento(EVENTOS.shellSudoTentativa, { tentativa: tentativas.current });
    if (tentativas.current >= 3) {
      setSenhaPendente(null);
      return erro("sudo: 3 tentativas incorretas de senha");
    }
    escrever("Desculpe, tente novamente.", "warn");
  };

  const rodar = (bruto: string) => {
    if (senhaPendente) {
      ecoar("", true);
      conferirSenha(bruto);
    } else {
      const linha = bruto.trim();
      if (!linha) return;

      if (!usou.current) {
        usou.current = true;
        evento(EVENTOS.shellAberto);
      }
      // Só o nome do comando: o que vem depois dele a pessoa digitou.
      evento(EVENTOS.shellComando, { comando: linha.split(/\s+/)[0]?.slice(0, 20) });

      ecoar(linha);
      historico.current.push(linha);
      posicao.current = historico.current.length;
      navegou.current = false;
      executar(linha.split(/\s+/));
    }

    window.requestAnimationFrame(() => {
      const janela = janelaRef.current;
      if (janela) janela.scrollTop = janela.scrollHeight;
      // No palco o shell já ocupa a tela: puxar a página aqui só empurraria a
      // barra do topo para fora a cada comando.
      if (!navegou.current && !palco) trazerParaVista();
    });
  };

  /** Tab completa com o diretório atual, ou com um comando no início da linha. */
  const completar = () => {
    const corte = valor.lastIndexOf(" ") + 1;
    const parcial = valor.slice(corte);
    const barra = parcial.lastIndexOf("/") + 1;
    const dir = buscar(resolver(parcial.slice(0, barra) || "."));
    const prefixo = parcial.slice(barra);

    const universo = corte === 0 ? COMANDOS : ehDir(dir) ? listar(dir, prefixo[0] === ".") : [];
    const achados = universo.filter((n) => n.startsWith(prefixo));
    if (!achados.length) return;

    if (achados.length === 1) {
      const n = achados[0];
      const sufixo = corte !== 0 && ehDir(dir) && ehDir(dir[n]) ? "/" : " ";
      setValor(valor.slice(0, corte + barra) + n + sufixo);
    } else {
      ecoar(valor);
      escrever(achados.join("   "));
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      rodar(valor);
      setValor("");
      return;
    }
    if (event.key === "Tab") {
      event.preventDefault();
      return completar();
    }
    if (event.key === "l" && event.ctrlKey) {
      event.preventDefault();
      return setLinhas([]);
    }
    if (event.key === "c" && event.ctrlKey) {
      event.preventDefault();
      ecoar(valor + "^C");
      return setValor("");
    }
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      if (!historico.current.length) return;
      event.preventDefault();
      posicao.current += event.key === "ArrowUp" ? -1 : 1;
      posicao.current = Math.max(0, Math.min(historico.current.length, posicao.current));
      setValor(historico.current[posicao.current] ?? "");
    }
  };

  const eco = senhaPendente ? "*".repeat(valor.length) : valor;

  const janela = (
    <div
      ref={janelaRef}
      className={cn(
        "[scrollbar-width:thin] [scrollbar-color:rgb(79_227_172/0.28)_transparent] overflow-x-hidden overflow-y-auto overscroll-contain",
        // No palco a janela toma a altura que sobra da moldura, e é ela que rola:
        // crescendo por comando, a página inteira pularia a cada `Enter`.
        palco ? "min-h-0 flex-1" : "max-h-[clamp(140px,24vh,210px)]",
      )}
    >
      {banner}

      <div role="log" aria-live="polite" className={linhas.length ? "mb-1" : undefined}>
        {linhas.map((linha) => (
          <p key={linha.id} className="text-cream-2 [white-space:pre-wrap]">
            {linha.segmentos.map((seg, i) =>
              seg.cor ? (
                <span
                  key={i}
                  style={{ background: seg.cor }}
                  className="mr-0.5 inline-block h-[11px] w-[22px]"
                />
              ) : (
                <span key={i} className={seg.tom ? TOM_CLASS[seg.tom] : undefined}>
                  {seg.texto}
                </span>
              ),
            )}
          </p>
        ))}
      </div>

      <label className="text-cream relative flex cursor-text items-baseline">
        <span
          aria-hidden="true"
          className={cn("mr-[0.6em] select-none", senhaPendente ? "text-cream/60" : "text-mint")}
        >
          {senhaPendente ? PEDIDO : prompt}
        </span>
        <span aria-hidden="true" className="[white-space:pre]">
          {eco}
        </span>
        <span
          aria-hidden="true"
          className="animate-blink bg-mint inline-block h-[1.05em] w-[0.6em] align-[-0.16em] opacity-45 peer-focus:opacity-100"
        />
        <input
          ref={campoRef}
          value={valor}
          onChange={(event) => setValor(event.target.value)}
          onKeyDown={onKeyDown}
          type="text"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label="Terminal: digite help para ver os comandos disponíveis"
          className="absolute inset-0 m-0 w-full border-0 bg-transparent p-0 font-[inherit] text-transparent caret-transparent outline-0"
        />
      </label>
    </div>
  );

  return (
    <div
      ref={raizRef}
      onMouseDown={(event) => {
        // O bloco inteiro é área de clique. Uma seleção de texto não rouba foco.
        const alvo = event.target as HTMLElement;
        if (alvo.closest("a, button, input")) return;
        if (String(window.getSelection())) return;
        event.preventDefault();
        campoRef.current?.focus();
      }}
      className={cn(
        "cursor-text font-mono",
        palco ? "h-full text-[13px] leading-[1.95]" : "pb-5 text-[12px] leading-[1.9]",
        className,
      )}
    >
      {palco ? (
        // O caminho na barra de título é o mesmo dado do prompt, não decoração:
        // é por ele que se acompanha o `cd` com a janela já rolada. A moldura
        // sangra a largura da tela, e o filete lateral morreria na borda.
        <TerminalFrame
          name={`${quem}:${caminho}`}
          className="flex h-full flex-col border-x-0"
          bodyClassName="flex min-h-0 flex-1 flex-col px-(--gutter) py-[clamp(14px,2vw,22px)]"
        >
          {janela}
        </TerminalFrame>
      ) : (
        <Container className="border-line border-t pt-[22px]">{janela}</Container>
      )}
    </div>
  );
}
