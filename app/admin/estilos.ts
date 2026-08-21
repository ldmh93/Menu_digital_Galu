/**
 * Clases compartidas del panel.
 *
 * Viven en un archivo NEUTRO —sin "use client"— a proposito, y esto no es un
 * detalle de organizacion: una constante exportada desde un modulo de cliente
 * no se puede leer desde el servidor. Next la sustituye por una referencia, y
 * al interpolarla en `className` lo que acaba en el HTML es el texto de un
 * error en vez de las clases. El boton se pinta, pero sin ningun estilo, y no
 * salta ningun aviso en consola: simplemente se ve mal.
 *
 * Al estar aqui, las importan por igual las paginas de servidor y los
 * formularios de cliente.
 */

/**
 * Campo de formulario. NO fija el ancho a proposito: quien lo usa dice si va
 * a todo lo ancho (`w-full`) o si es estrecho, como el precio dentro de una
 * fila. Traer el ancho aqui haria imposible estrecharlo, porque dos clases de
 * anchura compiten y gana la que Tailwind escriba mas abajo en el CSS.
 */
export const campo =
  "rounded-lg border border-black/12 bg-white px-3 py-2 text-sm text-tinta outline-none transition-colors focus:border-morado focus:ring-2 focus:ring-morado/25";

const botonBase =
  "inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

/** Accion principal de la pantalla. Solo deberia haber una a la vista. */
export const botonPrimario = `${botonBase} bg-morado px-3.5 py-2 text-white hover:bg-morado/90`;

/** Accion secundaria: la mayoria de los botones del panel. */
export const botonSuave = `${botonBase} border border-black/12 bg-white px-3 py-1.5 text-tinta hover:bg-black/[0.04]`;

/** Solo para confirmar algo que no se puede deshacer. */
export const botonPeligro = `${botonBase} border border-red-300 bg-white px-3 py-1.5 text-red-700 hover:bg-red-50`;

/** Iconos de accion dentro de una lista, donde un borde por fila seria ruido. */
export const botonFantasma = `${botonBase} px-2 py-1 text-tinta-suave hover:bg-black/[0.05] hover:text-tinta`;
