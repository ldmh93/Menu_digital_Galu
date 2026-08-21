"use client";

import { motion, useReducedMotion } from "framer-motion";

import { useSitio } from "./SitioProvider";

/**
 * Fondo de la pagina: arte oficial de GALU + capa atmosferica.
 *
 * Va en `fixed`, no dentro del flujo: la carta se desliza por encima y el arte
 * se queda quieto, que es lo que da la sensacion de profundidad al bajar. Es
 * ademas lo mas barato que existe — el compositor no tiene que volver a pintar
 * nada mientras se hace scroll.
 *
 * El arte es un lienzo 9:16 con una trama de chispas repetida y manchas de
 * color en las esquinas. En un celular entra practicamente tal cual; en un
 * monitor ancho se recorta y quedaria solo la trama, asi que los halos pastel
 * de esta misma capa devuelven las manchas de color a cualquier proporcion.
 */
export function SiteBackground() {
  const sitio = useSitio();
  const reducirMovimiento = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-crema"
    >
      {/*
        Solo se desplaza; NO se anima la escala.
        Al cambiar la escala de forma continua el navegador tiene que volver a
        rasterizar el SVG del fondo (que es vectorial y muy detallado) para
        mantener la nitidez, cuadro tras cuadro y para siempre. Un
        desplazamiento, en cambio, lo resuelve el compositor moviendo una
        textura ya dibujada. La escala fija de 1.06 se queda: evita que se vean
        los bordes al desplazarse.
      */}
      <motion.div
        className="absolute inset-0"
        style={{ scale: 1.06, willChange: "transform" }}
        animate={reducirMovimiento ? undefined : { x: [0, -14, 0], y: [0, 11, 0] }}
        transition={{ duration: 46, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sitio.background}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
        />
      </motion.div>

      <Halos reducirMovimiento={Boolean(reducirMovimiento)} />

      {/* Velo crema: unifica la paleta y suaviza el arte bajo las tarjetas. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_38%,rgba(255,245,245,0.66)_0%,rgba(255,245,245,0.28)_46%,transparent_74%)]" />

      {/* Vineta muy tenue: enfoca la mirada al centro. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,transparent_58%,rgba(59,42,77,0.09)_100%)]" />
    </div>
  );
}

interface Halo {
  color: string;
  /** Lado del halo en `vmax`, para que escale con el aparato. */
  size: number;
  x: string;
  y: string;
  duration: number;
  delay: number;
}

/**
 * Halos pastel que se desplazan muy lento.
 *
 * NO usan `filter: blur()`. Un degradado radial ya es difuso por definicion, y
 * el filtro obligaba al navegador a reservar una textura enorme por cada halo
 * (el desenfoque agranda los limites de la capa). En un celular esas texturas
 * agotan la memoria de video y Chrome mata la pestana.
 *
 * El tamano va en `vmax` y no en pixeles: en un celular de 390 px un halo de
 * 760 px tapaba la pantalla entera y el efecto se perdia.
 */
const halos: Halo[] = [
  { color: "rgba(247,191,217,0.55)", size: 62, x: "-16%", y: "4%", duration: 34, delay: 0 },
  { color: "rgba(157,210,197,0.42)", size: 68, x: "58%", y: "26%", duration: 42, delay: 3 },
  { color: "rgba(209,206,233,0.5)", size: 58, x: "6%", y: "58%", duration: 38, delay: 6 },
  { color: "rgba(255,232,116,0.34)", size: 52, x: "56%", y: "78%", duration: 46, delay: 2 },
];

function Halos({ reducirMovimiento }: { reducirMovimiento: boolean }) {
  return (
    <>
      {halos.map((halo, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full"
          style={{
            width: `${halo.size}vmax`,
            height: `${halo.size}vmax`,
            left: halo.x,
            top: halo.y,
            // Varias paradas para que el borde muera suave sin necesitar blur.
            background: `radial-gradient(circle at 50% 50%, ${halo.color} 0%, ${halo.color} 18%, transparent 68%)`,
          }}
          animate={
            reducirMovimiento
              ? undefined
              : {
                  x: [0, 34, -22, 0],
                  y: [0, -28, 20, 0],
                  opacity: [0.75, 1, 0.8, 0.75],
                }
          }
          transition={{
            duration: halo.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: halo.delay,
          }}
        />
      ))}
    </>
  );
}
