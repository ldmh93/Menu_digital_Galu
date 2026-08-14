"use client";

import { motion } from "framer-motion";
import { Facebook, Instagram, Phone } from "lucide-react";

import {
  phoneE164,
  phoneLegible,
  site,
  socialUrl,
  type SocialNetwork,
} from "@/config/site";
import { alEntrarEnPantalla, entradaAlAparecer } from "@/lib/motion";
import { TikTok } from "./icons/TikTok";

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

/**
 * Pie de la pagina: redes de GALU y firma de quien hizo el sitio.
 *
 * En el televisor los iconos eran decorativos —nadie iba a tocarlos—, asi que
 * el usuario se escribia una sola vez y los iconos hacian de prefijo. Aqui son
 * enlaces de verdad: quien esta viendo la carta en su celular puede irse al
 * Instagram de un toque, que es medio motivo para poner un menu en linea.
 */
export function SiteFooter() {
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
          {site.footer.message}
        </p>

        {/* Redes: el usuario es el mismo en las tres, asi que se escribe una
            vez y cada icono lleva a su red. */}
        <div className="mt-4 flex items-center gap-3">
          {site.footer.networks.map((red) => (
            <a
              key={red}
              href={socialUrl(red)}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={`${site.brand} en ${nombreRed[red]}`}
              className="flex size-11 items-center justify-center rounded-full bg-white/75 text-morado transition-transform duration-200 hover:scale-110"
              style={{ border: "1px solid rgb(147 113 176 / 0.22)" }}
            >
              <IconoRed red={red} />
            </a>
          ))}
        </div>

        <a
          href={socialUrl("instagram")}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-3 text-base font-semibold text-tinta sm:text-lg"
        >
          {site.footer.handle}
        </a>

        <Creditos />
      </div>
    </motion.footer>
  );
}

/**
 * Firma del desarrollo.
 *
 * Va deliberadamente en el ultimo escalon de la jerarquia —letra pequena, tono
 * suave— porque la pagina es de GALU, no del taller que la hizo. El telefono si
 * es un enlace `tel:` de verdad: en un celular un numero que no se puede marcar
 * de un toque no sirve de nada.
 */
function Creditos() {
  return (
    <div className="mt-8 flex flex-col items-center gap-2 text-center">
      <div
        aria-hidden="true"
        className="size-1 rounded-full bg-[#9371b0]/35"
      />

      {/* En un celular estrecho las dos mitades no caben en una linea: el
          "·" desaparece y la descripcion baja sola. */}
      <p className="text-[0.8rem] leading-relaxed text-tinta-suave/90 sm:text-sm">
        <span className="font-semibold text-tinta-suave">
          {site.credits.studio}
        </span>
        <span aria-hidden="true" className="mx-1.5 hidden text-[#9371b0]/50 sm:inline">
          ·
        </span>
        <span className="block sm:inline">{site.credits.tagline}</span>
      </p>

      <a
        href={`tel:${phoneE164()}`}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.8rem] font-medium text-tinta-suave transition-colors hover:text-morado sm:text-sm"
      >
        <Phone size={14} strokeWidth={2.2} aria-hidden="true" />
        <span className="tabular-nums">{phoneLegible()}</span>
      </a>
    </div>
  );
}
