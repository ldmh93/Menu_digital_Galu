"use client";

import { motion } from "framer-motion";
import { Facebook, Instagram, Phone } from "lucide-react";

import { credits, phoneE164, phoneLegible, type SocialNetwork } from "@/config/site";
import { alEntrarEnPantalla, entradaAlAparecer } from "@/lib/motion";
import { TikTok } from "./icons/TikTok";
import { urlDeRed, useSitio } from "./SitioProvider";

/**
 * Icono de una red social. TikTok es solido y los de Lucide son de trazo,
 * asi que va un punto mas pequeno: a igual altura una silueta llena pesa
 * mas que un contorno. En el mismo morado se leen como un conjunto.
 */
function IconoRed({ red }: { red: SocialNetwork }) {
  if (red === "facebook") return <Facebook size={22} strokeWidth={2} />;
  if (red === "tiktok") return <TikTok size={20} />;
  return <Instagram size={22} strokeWidth={2} />;
}

const nombreRed: Record<SocialNetwork, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
};

interface SiteFooterProps {
  /**
   * Año del aviso de derechos.
   *
   * Llega desde el servidor en vez de calcularse aqui: este componente se
   * pinta primero en el servidor y luego en el navegador, y si el reloj de
   * cada lado cayera a distinto lado de una Nochevieja, React encontraria dos
   * textos distintos y avisaria de un error de hidratacion.
   */
  anio: number;
}

/**
 * Pie de la pagina: redes de GALU, aviso de derechos y firma de quien hizo el
 * sitio.
 *
 * En el televisor los iconos eran decorativos —nadie iba a tocarlos—, asi que
 * el usuario se escribia una sola vez y los iconos hacian de prefijo. Aqui son
 * enlaces de verdad: quien esta viendo la carta en su celular puede irse al
 * Instagram de un toque, que es medio motivo para poner un menu en linea.
 */
export function SiteFooter({ anio }: SiteFooterProps) {
  const sitio = useSitio();

  return (
    <motion.footer
      variants={entradaAlAparecer}
      initial="oculto"
      whileInView="visible"
      viewport={alEntrarEnPantalla}
      className="mt-4 px-5 pb-8 sm:pb-10"
      style={{ paddingBottom: "calc(2.5rem + env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center">
        <div
          aria-hidden="true"
          className="h-px w-full max-w-sm bg-gradient-to-r from-transparent via-[#9371b0]/35 to-transparent"
        />

        <p className="mt-7 text-center text-sm font-light text-balance text-tinta-suave sm:text-base">
          {sitio.footer.message}
        </p>

        {/* Redes: el usuario es el mismo en las tres, asi que se escribe una
            vez y cada icono lleva a su red. */}
        <div className="mt-4 flex items-center gap-3">
          {(sitio.footer.networks as SocialNetwork[]).map((red) => (
            <a
              key={red}
              href={urlDeRed(sitio, red)}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={`${sitio.brand} en ${nombreRed[red]}`}
              className="flex size-11 items-center justify-center rounded-full bg-white/75 text-morado transition-transform duration-200 hover:scale-110"
              style={{ border: "1px solid rgb(147 113 176 / 0.22)" }}
            >
              <IconoRed red={red} />
            </a>
          ))}
        </div>

        <a
          href={urlDeRed(sitio, "instagram")}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-3 text-base font-semibold text-tinta sm:text-lg"
        >
          {sitio.footer.handle}
        </a>

        <AvisoLegal marca={sitio.brand} anio={anio} />
        <Creditos />
      </div>
    </motion.footer>
  );
}

/**
 * Derechos y letra pequena de la carta.
 *
 * Las dos notas de abajo no son relleno legal: en una carta con precios y
 * fotos son exactamente lo que evita una discusion en el mostrador. El precio
 * de la pantalla puede haber cambiado esta manana, y una foto de estudio nunca
 * sale igual que el vaso que se sirve.
 */
function AvisoLegal({ marca, anio }: { marca: string; anio: number }) {
  return (
    <div className="mt-8 flex flex-col items-center gap-1.5 text-center">
      <p className="text-[0.78rem] font-medium text-tinta-suave sm:text-[0.85rem]">
        © {anio} {marca}. Todos los derechos reservados.
      </p>

      <p className="max-w-md text-[0.7rem] leading-relaxed text-balance text-tinta-suave/75 sm:text-[0.75rem]">
        Precios sujetos a cambio sin previo aviso. Las imágenes son
        ilustrativas y pueden variar respecto al producto servido. La
        disponibilidad de sabores depende del día.
      </p>
    </div>
  );
}

/**
 * Firma del desarrollo.
 *
 * Va en el ultimo escalon de la jerarquia —letra pequena, tono suave— porque
 * la pagina es de GALU, no del taller que la hizo; pero va dentro de una
 * pastilla propia, separada del aviso de derechos, para que se lea como una
 * firma y no como una linea mas de letra pequena.
 *
 * Los datos salen de `config/site.ts` y NO del contenido editable: es la firma
 * de quien desarrolla, no un dato del negocio, y no tiene por que poder
 * borrarse ni cambiarse desde el panel.
 */
function Creditos() {
  return (
    <div className="mt-6 flex flex-col items-center">
      <div
        aria-hidden="true"
        className="mb-4 size-1 rounded-full bg-[#9371b0]/35"
      />

      <div
        className="flex flex-col items-center gap-1 rounded-2xl bg-white/60 px-5 py-3 text-center"
        style={{ border: "1px solid rgb(147 113 176 / 0.16)" }}
      >
        <span className="text-[0.62rem] font-medium tracking-[0.18em] text-tinta-suave/70 uppercase">
          Desarrollado por
        </span>

        <span className="font-[family-name:var(--font-display)] text-[0.95rem] font-semibold text-tinta sm:text-base">
          {credits.studio}
        </span>

        <span className="text-[0.72rem] leading-snug text-tinta-suave sm:text-[0.78rem]">
          {credits.tagline}
        </span>

        {/* El telefono es un enlace `tel:` de verdad: en un celular un numero
            que no se puede marcar de un toque no sirve de nada. */}
        <a
          href={`tel:${phoneE164()}`}
          className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-[0.75rem] font-medium text-morado transition-colors hover:bg-white sm:text-[0.8rem]"
          style={{ border: "1px solid rgb(147 113 176 / 0.2)" }}
        >
          <Phone size={13} strokeWidth={2.2} aria-hidden="true" />
          <span className="tabular-nums">{phoneLegible()}</span>
        </a>
      </div>
    </div>
  );
}
