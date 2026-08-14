"use client";

import { motion } from "framer-motion";

import { site } from "@/config/site";
import { aparecer, contenedor, subirYAparecer } from "@/lib/motion";
import { Logo } from "./Logo";

interface SiteHeaderProps {
  /** Permite sobrescribir el subtitulo; por defecto usa config/site.ts. */
  subtitle?: string;
  /** Frase de bienvenida bajo el subtitulo. */
  intro?: string;
}

/**
 * Portada de la carta: logo, subtitulo y una linea de bienvenida.
 *
 * Ocupa bastante en el celular a proposito. Es lo primero que ve alguien que
 * acaba de escanear el codigo QR en la mesa, y sirve para confirmarle de un
 * vistazo que abrio lo que queria abrir; en cuanto empieza a bajar, la barra
 * de menus toma el relevo y esta portada ya no vuelve a estorbar.
 */
export function SiteHeader({
  subtitle = site.subtitle,
  intro = "Toca un menú para ir directo, o desliza para verlo todo",
}: SiteHeaderProps) {
  return (
    <motion.header
      variants={contenedor(0.18)}
      initial="oculto"
      animate="visible"
      className="flex flex-col items-center px-5 pt-10 pb-8 text-center sm:pt-14 sm:pb-10"
    >
      <Logo />

      <motion.div
        variants={aparecer}
        className="mt-4 flex w-full max-w-md items-center gap-3 sm:mt-5 sm:gap-5"
      >
        <Guion />
        <p className="font-[family-name:var(--font-body)] text-[0.7rem] font-medium tracking-[0.32em] whitespace-nowrap text-tinta-suave uppercase sm:text-sm sm:tracking-[0.4em]">
          {subtitle}
        </p>
        <Guion />
      </motion.div>

      {intro ? (
        <motion.p
          variants={subirYAparecer}
          className="mt-4 max-w-xs text-sm leading-relaxed font-light text-balance text-tinta-suave sm:mt-5 sm:max-w-sm sm:text-base"
        >
          {intro}
        </motion.p>
      ) : null}
    </motion.header>
  );
}

function Guion() {
  return (
    <span
      aria-hidden="true"
      className="h-px min-w-6 flex-1 bg-gradient-to-r from-transparent via-[#9371b0]/45 to-transparent"
    />
  );
}
