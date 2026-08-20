"use client";

import Image from "next/image";
import { motion } from "framer-motion";

import type { Accent } from "@/data/types";
import { getAccent } from "@/lib/accents";
import { alEntrarEnPantalla, entradaAlAparecer } from "@/lib/motion";

interface CategoryPhotoProps {
  /** Ruta dentro de /public. */
  src: string;
  /** Que se ve en la foto. Nunca el nombre del menu, que ya va en el titulo. */
  alt: string;
  /** Ancho / alto de la foto, para reservarle el sitio y no dar un salto. */
  ratio: number;
  /** Color de marca del menu, el mismo que sus tarjetas. */
  accent: Accent;
  /** Primera foto de la pagina: se carga con prioridad. */
  prioritaria?: boolean;
}

/**
 * Foto del producto que encabeza un menu.
 *
 * No va enmarcada. Las fotos vienen recortadas sobre transparente, asi que el
 * producto FLOTA sobre el fondo de marca igual que flotan las tarjetas: mismo
 * halo radial de color y misma sombra difusa que ya usa CategoryCard. Meterla
 * en un marco con borde la delataria como una foto pegada encima de un diseno
 * que no la esperaba, que es justo lo que hay que evitar.
 *
 * Se dimensiona por ALTURA y no por anchura, a proposito. Los productos no
 * comparten proporcion —el vaso de boba es alargado, el de frozen yogurt es
 * casi cuadrado— y fijando el ancho, el vaso alto se vuelve gigante y el
 * cuenco ancho se queda enano. Igualando la altura, todos se ven del mismo
 * tamanio al recorrer la carta.
 */
export function CategoryPhoto({
  src,
  alt,
  ratio,
  accent,
  prioritaria,
}: CategoryPhotoProps) {
  const tokens = getAccent(accent);

  return (
    <motion.div
      variants={entradaAlAparecer}
      initial="oculto"
      whileInView="visible"
      viewport={alEntrarEnPantalla}
      className="relative mt-7 flex justify-center sm:mt-9"
    >
      {/*
        Contenedor a la medida exacta de la foto. Sin esto el halo se centraria
        sobre la fila entera y no sobre el producto, que es lo que hace que
        parezca iluminado desde atras.
      */}
      <div className="relative">
        {/* Halo de color, el mismo recurso que llevan las tarjetas por detras.
            Muere antes del borde para que no se adivine el rectangulo. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-10 -inset-y-8 sm:-inset-x-16 sm:-inset-y-10"
          style={{
            background: `radial-gradient(58% 58% at 50% 52%, ${tokens.glow} 0%, transparent 100%)`,
          }}
        />

        {/* Sombra de apoyo: una elipse muy difusa bajo el producto. Es lo que
            hace que se vea posado y no recortado y pegado. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[12%] bottom-[-2%] h-[9%]"
          style={{
            background:
              "radial-gradient(50% 50% at 50% 50%, rgb(59 42 77 / 0.28) 0%, transparent 100%)",
          }}
        />

        <Image
          src={src}
          alt={alt}
          // El tamanio real lo manda el CSS de abajo; estos dos numeros solo
          // le dicen al navegador la proporcion, para que reserve el hueco.
          width={Math.round(880 * ratio)}
          height={880}
          sizes="(min-width: 1280px) 360px, (min-width: 1024px) 320px, (min-width: 640px) 34vw, 45vw"
          priority={prioritaria}
          // Crece con la pantalla para que en un monitor no quede perdida
          // sobre una tarjeta que ocupa todo el ancho, pero sin llegar nunca a
          // empujar los precios fuera de la primera pantalla del movil.
          className="relative h-40 w-auto object-contain sm:h-52 lg:h-72 xl:h-80"
          style={{
            // Sombra propia del producto, siguiendo su silueta recortada.
            // `drop-shadow` sigue el alfa; `box-shadow` dibujaria el cuadro.
            filter: "drop-shadow(0 18px 26px rgb(59 42 77 / 0.22))",
          }}
        />
      </div>
    </motion.div>
  );
}
