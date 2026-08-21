"use client";

import Image from "next/image";
import { motion } from "framer-motion";

import { useSitio } from "./SitioProvider";
import { bajarYAparecer } from "@/lib/motion";
import { cx } from "@/lib/format";

const RELACION_ASPECTO = 266 / 108; // dimensiones nativas de /public/logo.png

interface LogoProps {
  /** Clases de ancho. El alto sale solo de la proporcion del archivo. */
  className?: string;
  priority?: boolean;
}

/**
 * Logo de GALU con entrada descendente.
 * Se apoya en un halo blanco muy difuso para separarlo del arte del fondo sin
 * necesidad de recuadros ni marcos.
 */
export function Logo({
  className = "w-44 sm:w-56 lg:w-64",
  priority = true,
}: LogoProps) {
  const sitio = useSitio();

  return (
    <motion.div
      variants={bajarYAparecer}
      className={cx("relative flex items-center justify-center", className)}
      style={{ aspectRatio: RELACION_ASPECTO }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -m-8 rounded-full sm:-m-12"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgb(255 255 255 / 0.55) 0%, rgb(255 255 255 / 0.35) 40%, transparent 70%)",
        }}
      />
      <Image
        src={sitio.logo}
        alt={sitio.brand}
        width={532}
        height={216}
        priority={priority}
        sizes="(min-width: 1024px) 16rem, (min-width: 640px) 14rem, 11rem"
        className="relative h-full w-full object-contain"
        draggable={false}
      />
    </motion.div>
  );
}
