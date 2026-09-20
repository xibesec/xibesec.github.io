import Image from "next/image";
import { Button } from "@/components/primitives/Button";
import { BotaoMedido } from "@/components/analytics/BotaoMedido";
import { Mascote } from "@/components/primitives/Mascote";
import { Gaviao } from "@/components/primitives/Gaviao";
import { EVENTOS } from "@/lib/analytics";
import { asset, site } from "@/lib/site";
import type { LinkAlvo } from "@/lib/links";
import type { Hero as HeroContent, Settings } from "@/lib/cms";

// Texto alternativo é acessibilidade da imagem, não conteúdo editável.
const MASCOTE_ALT =
  "Mascote do XibéSec: personagem ciber-amazônico de máscara respiratória, com braçadeiras em grafismo marajoara, segurando um dispositivo conectado por cabo.";

// Rótulos de interface: com o evento encerrado, a ficha do hero passa a
// anunciar a próxima edição, ainda sem local nem horário definidos.
const PROXIMA_EDICAO_LABEL = "Próxima edição";
const LOCAL_A_DEFINIR = "Local a definir";

export type HeroProps = {
  hero: HeroContent;
  settings: Settings;
  /** Destino do botão primário: a tabela de preços ou, sem ela, o checkout. */
  ctaPrimario: LinkAlvo;
  /** Destino do botão secundário. Ausente, o botão não é renderizado. */
  ctaSecundarioHref?: string;
};

/**
 * Arte de fundo com véu que abre para a direita, lockup e manchete à esquerda,
 * mascote flutuando sobre o brilho menta. Em tela estreita o véu vira vertical:
 * o texto atravessaria a parte clara da mata.
 */
export function Hero({ hero, settings, ctaPrimario, ctaSecundarioHref }: HeroProps) {
  return (
    <section id="topo" className="border-line relative overflow-hidden border-b">
      {/* `isolate` prende o blend da névoa a esta pilha: sem contexto próprio
          ela mistura com o fundo da página, não com a arte da mata. */}
      <div aria-hidden="true" className="absolute inset-0 isolate">
        <div
          className="absolute inset-0 bg-cover bg-no-repeat max-[900px]:bg-[78%_center]"
          style={{
            backgroundImage: `url("${asset("/images/hero/hero-bg.webp")}")`,
            backgroundPosition: "72% center",
          }}
        />
        {/* Abaixo do véu de leitura de propósito: a névoa é cena, e passar por
            cima do degradê reduziria o contraste da manchete. */}
        <div className="nevoa nevoa--longe absolute inset-0" />
        <div className="nevoa nevoa--perto absolute inset-0" />

        <div className="absolute inset-0 bg-[linear-gradient(100deg,#0F1A0C_4%,rgba(15,26,12,.88)_30%,rgba(15,26,12,.34)_56%,rgba(15,26,12,.18)_100%),linear-gradient(#12200D_0%,transparent_14%),linear-gradient(0deg,#152310_0%,rgba(21,35,16,.55)_12%,transparent_30%)] max-[720px]:bg-[linear-gradient(#12200D_0%,rgba(15,26,12,.72)_26%,rgba(15,26,12,.42)_62%,rgba(21,35,16,.28)_100%),linear-gradient(100deg,rgba(15,26,12,.72)_0%,rgba(15,26,12,.34)_58%,transparent_100%),linear-gradient(0deg,#152310_0%,rgba(21,35,16,.6)_10%,transparent_26%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(620px_620px_at_72%_58%,rgba(79,227,172,.13),transparent_68%)]" />

        {/* Sobrevoa o dossel, atrás da névoa de perto para entrar na cena em vez
            de pousar sobre ela. O piso do clamp existe porque `vw` sozinho
            encolhe até virar borrão. */}
        <div className="animate-floaty absolute top-[7%] right-[7%] w-[clamp(120px,13vw,210px)] max-[720px]:hidden">
          <Gaviao className="w-full drop-shadow-[0_18px_30px_rgba(0,0,0,.5)]" />
        </div>
      </div>

      <div className="max-w-site relative mx-auto grid min-h-[min(760px,calc(100svh-var(--nav-h)))] grid-cols-[1.12fr_.88fr] items-center gap-[clamp(24px,3vw,48px)] px-(--gutter) pt-[clamp(40px,5vw,64px)] pb-[clamp(48px,6vw,76px)] max-[720px]:min-h-0 max-[720px]:grid-cols-1 max-[720px]:items-start max-[720px]:gap-0 max-[720px]:pt-[clamp(20px,5vw,36px)] max-[720px]:pb-[clamp(28px,6vw,76px)]">
        <div>
          <p className="text-mint mb-[26px] font-mono text-[12px] tracking-[0.28em] uppercase max-[720px]:mb-2 max-[720px]:text-[11px]">
            {hero.lugares.map((lugar, index) => (
              <span key={lugar}>
                {index > 0 ? <span className="text-mint/50 mx-[0.3em]">·</span> : null}
                {lugar}
              </span>
            ))}
          </p>

          <Image
            src={asset("/images/marca/logo-xibesec.webp")}
            alt={site.siteName}
            width={800}
            height={641}
            priority
            className="mb-[clamp(22px,2.6vw,32px)] w-[min(100%,clamp(260px,26vw,390px))] max-[900px]:w-[min(100%,62vw)] max-[720px]:mb-3 max-[720px]:w-[min(100%,300px)]"
          />

          <h1 className="font-display mb-5 text-[clamp(2.1rem,4.3vw,3.25rem)] leading-[1.02] font-bold tracking-[0.01em] uppercase max-[720px]:mb-4 max-[720px]:max-w-[60%] max-[720px]:text-[clamp(1.5rem,6.6vw,2.1rem)]">
            {hero.tituloLinha}
            <br />
            <em className="text-orange not-italic">{hero.tituloDestaque}</em>
          </h1>

          <p className="text-cream-2 mb-8 max-w-[520px] text-[17px] leading-[1.6] max-[720px]:mb-5 max-[720px]:max-w-[62%] max-[720px]:text-[15px]">
            {hero.lede}
          </p>

          <div className="mb-9 flex flex-wrap gap-3.5 max-[720px]:mb-5 [&>a]:max-[720px]:flex-auto">
            <BotaoMedido
              medirComo={
                settings.sections.ingressos ? EVENTOS.ingressoClicado : EVENTOS.redeSocialClicada
              }
              local="hero"
              {...ctaPrimario}
              arrow
            >
              {hero.ctaPrimario}
            </BotaoMedido>
            {hero.ctaSecundario && ctaSecundarioHref ? (
              <Button href={ctaSecundarioHref} variant="ghost">
                {hero.ctaSecundario}
              </Button>
            ) : null}
          </div>

          <p className="text-cream-3 flex flex-wrap gap-x-7 gap-y-2.5 font-mono text-[13px]">
            <span>
              {PROXIMA_EDICAO_LABEL}{" "}
              <time dateTime={settings.nextEditionDate}>{settings.nextEditionDisplayDate}</time>
            </span>
            <span aria-hidden="true" className="text-cream/25">
              /
            </span>
            <span>{LOCAL_A_DEFINIR}</span>
          </p>
        </div>

        {/* No celular sai da grade e vira camada: dentro dela, a coluna estreita
            que a arte exige espremia também o CTA e a data, que precisam da
            linha inteira. Encostada na direita porque a `section` tem
            `overflow-hidden` e recuo negativo decepa o mascote. */}
        <div className="relative flex translate-x-[-7%] translate-y-[6%] items-end justify-center max-[720px]:pointer-events-none max-[720px]:absolute max-[720px]:top-[44%] max-[720px]:right-0 max-[720px]:w-[31vw] max-[720px]:max-w-[138px] max-[720px]:translate-x-0 max-[720px]:translate-y-0 max-[720px]:flex-col max-[720px]:items-end max-[720px]:gap-[2vw]">
          <span
            aria-hidden="true"
            className="absolute aspect-square w-[78%] rounded-full bg-[radial-gradient(circle,rgba(79,227,172,.18),transparent_65%)] max-[720px]:hidden"
          />
          <Mascote
            alt={MASCOTE_ALT}
            className="mascote animate-floaty relative w-full max-w-[min(46vw,520px)] drop-shadow-[0_30px_50px_rgba(0,0,0,.55)] max-[720px]:order-2 max-[720px]:w-full"
          />
          <div className="animate-floaty absolute top-[4%] -right-[46%] hidden w-[min(19vw,74px)] max-[720px]:relative max-[720px]:top-0 max-[720px]:right-0 max-[720px]:order-1 max-[720px]:block max-[720px]:w-[62%] max-[720px]:self-end">
            <Gaviao className="w-full drop-shadow-[0_18px_30px_rgba(0,0,0,.5)]" />
          </div>
        </div>
      </div>
    </section>
  );
}
