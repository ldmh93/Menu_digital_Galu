import type { Transition, Variants } from "framer-motion";

/**
 * Lenguaje de movimiento de GALU.
 * Regla: nada rebota, nada gira, nada dura menos de medio segundo.
 * Todo entra desde una distancia corta con una curva muy suave.
 */

export const EASE_SUAVE = [0.22, 1, 0.36, 1] as const;

export const transicionSuave: Transition = {
  duration: 0.9,
  ease: EASE_SUAVE,
};

/** Contenedor que reparte la entrada de sus hijos uno por uno. */
export const contenedor = (stagger = 0.16, delay = 0): Variants => ({
  oculto: {},
  visible: {
    transition: { staggerChildren: stagger, delayChildren: delay },
  },
});

/** Entrada estandar: sube unos pixeles mientras aparece. */
export const subirYAparecer: Variants = {
  oculto: { opacity: 0, y: 34 },
  visible: { opacity: 1, y: 0, transition: transicionSuave },
};

/** Entrada del logo: baja desde arriba. */
export const bajarYAparecer: Variants = {
  oculto: { opacity: 0, y: -46 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 1.1, ease: EASE_SUAVE },
  },
};

/** Solo opacidad, para titulos. */
export const aparecer: Variants = {
  oculto: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 1.2, ease: EASE_SUAVE } },
};

/** Entrada de tarjeta: escala casi imperceptible + desplazamiento. */
export const entradaTarjeta: Variants = {
  oculto: { opacity: 0, y: 46, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 1, ease: EASE_SUAVE },
  },
};

/**
 * Entrada al entrar en pantalla al hacer scroll.
 *
 * Mas corta y mas discreta que `entradaTarjeta`: en el televisor la animacion
 * se veia una vez cada doce segundos, aqui se dispara mientras el dedo esta
 * moviendo la pagina, y cualquier exceso se siente como lentitud.
 */
export const entradaAlAparecer: Variants = {
  oculto: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE_SUAVE },
  },
};

/**
 * Margen de disparo comun para `whileInView`.
 * `once` es deliberado: reanimar al volver a subir marea.
 */
export const alEntrarEnPantalla = {
  once: true,
  margin: "0px 0px -12% 0px",
} as const;
