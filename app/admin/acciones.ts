"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { Accent, ItemTag, MenuLayout, PriceTier } from "@/data/types";
import { guardarContenido, leerContenido } from "@/lib/contenido";
import {
  ACENTOS,
  ETIQUETAS,
  REPARTOS,
  agregarCategoria,
  agregarProducto,
  alternarCategoria,
  alternarMenu,
  alternarProducto,
  editarBloque,
  editarCategoria,
  editarMenu,
  editarProducto,
  eliminarCategoria,
  eliminarProducto,
  moverMenu,
  type DatosBloque,
  type DatosCategoria,
  type DatosProducto,
  type Ubicacion,
} from "@/lib/editor";
import {
  abrirSesion,
  cerrarSesion,
  contraseniaValida,
  exigirSesion,
} from "@/lib/sesion";

/**
 * Acciones del panel: lo unico que puede escribir en el contenido.
 *
 * Cada una hace siempre los mismos cuatro pasos —comprobar sesion, leer,
 * transformar con una funcion pura de lib/editor y guardar— y termina
 * revalidando. Ese ultimo paso es el que hace que esto NO sea un panel de
 * mentira: sin el, la carta publica seguiria sirviendo la version que Next
 * dejo cacheada y el precio nuevo no aparecería hasta el siguiente despliegue.
 */

export interface Resultado {
  ok: boolean;
  mensaje?: string;
}

/**
 * Refresca la carta publica y el propio panel.
 *
 * Se revalida con "layout" para que caigan tambien las paginas de cada menu
 * (/menu/bobas y demas), que comparten datos con la portada: cambiar un precio
 * y verlo actualizado en la carta completa pero no en su menu suelto seria
 * peor que no actualizarlo en ninguna parte.
 */
function refrescar(): void {
  revalidatePath("/", "layout");
}

/** Ejecuta una transformacion sobre el contenido y la deja guardada. */
async function aplicar(
  transformar: (contenido: Awaited<ReturnType<typeof leerContenido>>) => Awaited<
    ReturnType<typeof leerContenido>
  >,
): Promise<Resultado> {
  await exigirSesion();

  try {
    const contenido = await leerContenido();
    await guardarContenido(transformar(contenido));
    refrescar();
    return { ok: true };
  } catch (error) {
    // El mensaje se devuelve, no se traga: quien esta editando tiene que saber
    // por que no se guardo su cambio.
    return {
      ok: false,
      mensaje: error instanceof Error ? error.message : "No se pudo guardar.",
    };
  }
}

// ---------------------------------------------------------------------------
// Entrar y salir
// ---------------------------------------------------------------------------

export async function entrar(
  _previo: Resultado | null,
  formulario: FormData,
): Promise<Resultado> {
  const clave = String(formulario.get("password") ?? "");

  if (!contraseniaValida(clave)) {
    return { ok: false, mensaje: "Contraseña incorrecta." };
  }

  await abrirSesion();
  redirect("/admin");
}

export async function salir(): Promise<void> {
  await cerrarSesion();
  redirect("/admin/entrar");
}

// ---------------------------------------------------------------------------
// Lectura de formularios
// ---------------------------------------------------------------------------

/** Texto de un campo, ya recortado. Cadena vacia si no venia. */
function texto(formulario: FormData, campo: string): string {
  return String(formulario.get(campo) ?? "").trim();
}

/**
 * Numero de un campo, o `undefined` si venia vacio.
 *
 * Vacio y cero son cosas distintas: vacio es "esta categoria no lleva precio
 * porque cada renglon trae el suyo", y cero es un precio de cero pesos. Si se
 * confundieran, el Frozen Yogurt acabaria con una pastilla de "$0".
 */
function numero(formulario: FormData, campo: string): number | undefined {
  const crudo = texto(formulario, campo);
  if (crudo === "") return undefined;

  const valor = Number(crudo.replace(",", "."));
  return Number.isFinite(valor) ? valor : undefined;
}

function siMarcado(formulario: FormData, campo: string): boolean {
  return formulario.get(campo) === "on" || formulario.get(campo) === "true";
}

/** Solo deja pasar los valores del catalogo; cualquier otro es respaldo. */
function deLista<T extends string>(
  valor: string,
  permitidos: readonly T[],
  respaldo: T,
): T {
  return (permitidos as readonly string[]).includes(valor)
    ? (valor as T)
    : respaldo;
}

function ubicacionDe(formulario: FormData, prefijo = ""): Ubicacion {
  return {
    grupo: texto(formulario, `${prefijo}grupo`),
    bloque: texto(formulario, `${prefijo}bloque`),
    categoria: texto(formulario, `${prefijo}categoria`),
  };
}

function productoDe(formulario: FormData): DatosProducto {
  const etiqueta = texto(formulario, "tag");

  return {
    name: texto(formulario, "name"),
    description: texto(formulario, "description"),
    price: numero(formulario, "price"),
    note: texto(formulario, "note"),
    tag: etiqueta
      ? deLista<ItemTag>(etiqueta, ETIQUETAS, "nuevo")
      : undefined,
    active: siMarcado(formulario, "active"),
  };
}

/**
 * Los tramos de precio por tamanio llegan como dos listas paralelas
 * (`tramoLabel[]` y `tramoValue[]`), que es como el navegador manda varios
 * campos con el mismo nombre. Se emparejan por posicion y se tiran los que
 * vengan a medias: un tamanio sin importe no es un precio.
 */
function tramosDe(formulario: FormData): PriceTier[] {
  const etiquetas = formulario.getAll("tramoLabel").map((v) => String(v).trim());
  const valores = formulario.getAll("tramoValue").map((v) => String(v).trim());

  const tramos: PriceTier[] = [];
  for (let i = 0; i < etiquetas.length; i++) {
    const valor = Number(valores[i]);
    if (etiquetas[i] === "" || valores[i] === "" || !Number.isFinite(valor)) {
      continue;
    }
    tramos.push({ label: etiquetas[i], value: valor });
  }

  return tramos;
}

function categoriaDe(formulario: FormData): DatosCategoria {
  return {
    name: texto(formulario, "name"),
    description: texto(formulario, "description"),
    accent: deLista<Accent>(texto(formulario, "accent"), ACENTOS, "rosa"),
    precioUnico: numero(formulario, "precioUnico"),
    tramos: tramosDe(formulario),
    columns: numero(formulario, "columns"),
    active: siMarcado(formulario, "active"),
  };
}

function bloqueDe(formulario: FormData): DatosBloque {
  const modo = texto(formulario, "modoPreparacion");
  const reparto = texto(formulario, "layout");

  return {
    title: texto(formulario, "title"),
    section: texto(formulario, "section"),
    tagline: texto(formulario, "tagline"),
    // Tres estados: heredar de la configuracion, ocultar, o texto propio.
    preparation:
      modo === "ocultar"
        ? null
        : modo === "propia"
          ? texto(formulario, "preparation")
          : undefined,
    layout: reparto ? deLista<MenuLayout>(reparto, REPARTOS, "trio") : undefined,
    footnote: texto(formulario, "footnote"),
    active: siMarcado(formulario, "active"),
  };
}

// ---------------------------------------------------------------------------
// Productos
// ---------------------------------------------------------------------------

export async function accionAgregarProducto(
  _previo: Resultado | null,
  formulario: FormData,
): Promise<Resultado> {
  const donde = ubicacionDe(formulario);
  const datos = productoDe(formulario);

  if (!datos.name) return { ok: false, mensaje: "El nombre no puede ir vacío." };

  return aplicar((contenido) => agregarProducto(contenido, donde, datos));
}

export async function accionEditarProducto(
  _previo: Resultado | null,
  formulario: FormData,
): Promise<Resultado> {
  const id = texto(formulario, "id");
  const datos = productoDe(formulario);

  if (!datos.name) return { ok: false, mensaje: "El nombre no puede ir vacío." };

  /*
   * El desplegable de categoria manda "grupo|bloque|categoria" en un solo
   * campo. Tres desplegables encadenados obligarian a recargar la lista de
   * bloques al cambiar de menu, y eso en un movil es un parpadeo por toque.
   */
  const destinoCrudo = texto(formulario, "destino");
  const [grupo, bloque, categoria] = destinoCrudo.split("|");
  const destino =
    grupo && bloque && categoria ? { grupo, bloque, categoria } : undefined;

  return aplicar((contenido) =>
    editarProducto(contenido, id, datos, destino),
  );
}

export async function accionAlternarProducto(formulario: FormData): Promise<void> {
  const id = texto(formulario, "id");
  await aplicar((contenido) => alternarProducto(contenido, id));
}

export async function accionEliminarProducto(formulario: FormData): Promise<void> {
  const id = texto(formulario, "id");
  await aplicar((contenido) => eliminarProducto(contenido, id));
}

// ---------------------------------------------------------------------------
// Categorias
// ---------------------------------------------------------------------------

export async function accionEditarCategoria(
  _previo: Resultado | null,
  formulario: FormData,
): Promise<Resultado> {
  const donde = ubicacionDe(formulario);
  const datos = categoriaDe(formulario);

  if (!datos.name) return { ok: false, mensaje: "El nombre no puede ir vacío." };

  return aplicar((contenido) => editarCategoria(contenido, donde, datos));
}

export async function accionAgregarCategoria(
  _previo: Resultado | null,
  formulario: FormData,
): Promise<Resultado> {
  const grupo = texto(formulario, "grupo");
  const bloque = texto(formulario, "bloque");
  const datos = categoriaDe(formulario);

  if (!datos.name) return { ok: false, mensaje: "El nombre no puede ir vacío." };

  return aplicar((contenido) =>
    agregarCategoria(contenido, grupo, bloque, datos),
  );
}

export async function accionAlternarCategoria(formulario: FormData): Promise<void> {
  const donde = ubicacionDe(formulario);
  await aplicar((contenido) => alternarCategoria(contenido, donde));
}

export async function accionEliminarCategoria(formulario: FormData): Promise<void> {
  const donde = ubicacionDe(formulario);
  await aplicar((contenido) => eliminarCategoria(contenido, donde));
}

// ---------------------------------------------------------------------------
// Bloques y menus
// ---------------------------------------------------------------------------

export async function accionEditarBloque(
  _previo: Resultado | null,
  formulario: FormData,
): Promise<Resultado> {
  const grupo = texto(formulario, "grupo");
  const bloque = texto(formulario, "bloque");
  const datos = bloqueDe(formulario);

  if (!datos.title) return { ok: false, mensaje: "El título no puede ir vacío." };

  return aplicar((contenido) => editarBloque(contenido, grupo, bloque, datos));
}

export async function accionEditarMenu(
  _previo: Resultado | null,
  formulario: FormData,
): Promise<Resultado> {
  const grupo = texto(formulario, "grupo");
  const label = texto(formulario, "label");

  if (!label) return { ok: false, mensaje: "El nombre no puede ir vacío." };

  return aplicar((contenido) =>
    editarMenu(contenido, grupo, {
      label,
      active: siMarcado(formulario, "active"),
    }),
  );
}

export async function accionAlternarMenu(formulario: FormData): Promise<void> {
  const grupo = texto(formulario, "grupo");
  await aplicar((contenido) => alternarMenu(contenido, grupo));
}

export async function accionMoverMenu(formulario: FormData): Promise<void> {
  const grupo = texto(formulario, "grupo");
  const direccion = texto(formulario, "direccion") === "arriba" ? "arriba" : "abajo";
  await aplicar((contenido) => moverMenu(contenido, grupo, direccion));
}
