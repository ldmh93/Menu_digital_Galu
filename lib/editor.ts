import type {
  Accent,
  ItemTag,
  MenuCategory,
  MenuItem,
  MenuLayout,
  PriceTier,
} from "@/data/types";
import type { Contenido } from "./contenido";

/**
 * Operaciones de edicion del contenido.
 *
 * Funciones puras: reciben el contenido y devuelven uno nuevo, sin tocar disco
 * ni cookies. La parte web —sesion, guardado y revalidacion— vive en
 * app/admin/acciones.ts. Separarlo permite razonar sobre las reglas del menu
 * sin montar medio Next alrededor, y evita la clase de error mas cara aqui:
 * dejar escrito en disco un arbol que quedo a medias.
 */

/** Donde vive una categoria dentro de la carta. */
export interface Ubicacion {
  grupo: string;
  bloque: string;
  categoria: string;
}

export interface DatosProducto {
  name: string;
  description?: string;
  price?: number;
  note?: string;
  tag?: ItemTag;
  active?: boolean;
}

export interface DatosCategoria {
  name: string;
  description?: string;
  accent: Accent;
  precioUnico?: number;
  tramos?: PriceTier[];
  columns?: number;
  active?: boolean;
}

export interface DatosBloque {
  title: string;
  section?: string;
  tagline?: string;
  preparation?: string | null;
  layout?: MenuLayout;
  footnote?: string;
  active?: boolean;
}

/** Los cinco acentos de la marca. Fuera de esta lista no hay color valido. */
export const ACENTOS: Accent[] = [
  "rosa",
  "lavanda",
  "menta",
  "amarillo",
  "morado",
];

export const REPARTOS: MenuLayout[] = ["solo", "duo", "trio", "feature"];

export const ETIQUETAS: ItemTag[] = ["nuevo", "favorito"];

/** Copia honda, para no mutar por accidente lo que ya esta en memoria. */
function clonar(contenido: Contenido): Contenido {
  return JSON.parse(JSON.stringify(contenido)) as Contenido;
}

/** Normaliza a objeto los productos que vinieran como cadena suelta. */
function comoObjeto(item: MenuItem | string): MenuItem {
  return typeof item === "string" ? { name: item } : item;
}

/** Convierte un texto en identificador: sin acentos, minusculas y con guiones. */
function slugificar(texto: string, respaldo: string): string {
  const limpio = texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return limpio || respaldo;
}

/**
 * Quita las claves vacias.
 *
 * Sin esto el JSON se llena de `"description": ""` y de `"price": null`, que
 * no son lo mismo que "no tiene": la carta pinta una linea de apoyo en blanco
 * y una pastilla de precio vacia donde no deberia haber nada.
 */
function limpiar<T extends object>(objeto: T): T {
  return Object.fromEntries(
    Object.entries(objeto).filter(
      ([, valor]) => valor !== undefined && valor !== "" && valor !== null,
    ),
  ) as T;
}

function buscarBloque(contenido: Contenido, grupoSlug: string, bloqueSlug: string) {
  const grupo = contenido.groups.find((g) => g.slug === grupoSlug);
  if (!grupo) throw new Error(`No existe el menu "${grupoSlug}".`);

  const bloque = grupo.screens.find((s) => s.slug === bloqueSlug);
  if (!bloque) throw new Error(`No existe el bloque "${bloqueSlug}".`);

  return { grupo, bloque };
}

function buscarCategoria(contenido: Contenido, donde: Ubicacion): MenuCategory {
  const { bloque } = buscarBloque(contenido, donde.grupo, donde.bloque);
  const categoria = bloque.categories.find((c) => c.id === donde.categoria);
  if (!categoria) throw new Error(`No existe la categoria "${donde.categoria}".`);

  return categoria;
}

/**
 * Identificador de producto libre en TODA la carta.
 *
 * Se comprueba contra todos los productos y no solo contra los de su
 * categoria: el panel localiza cada renglon por su id sin saber donde esta, y
 * al mover un producto de sitio su id no puede chocar con el de otro.
 */
export function idLibre(contenido: Contenido, base: string): string {
  const usados = new Set<string>();
  for (const grupo of contenido.groups) {
    for (const bloque of grupo.screens) {
      for (const categoria of bloque.categories) {
        for (const item of categoria.items) {
          const id = comoObjeto(item).id;
          if (id) usados.add(id);
        }
      }
    }
  }

  const raiz = slugificar(base, "producto");
  let id = raiz;
  let n = 2;
  while (usados.has(id)) id = `${raiz}-${n++}`;

  return id;
}

/** Busca un producto por id y devuelve tambien en que categoria estaba. */
export function localizarProducto(
  contenido: Contenido,
  id: string,
): { categoria: MenuCategory; indice: number; donde: Ubicacion } | null {
  for (const grupo of contenido.groups) {
    for (const bloque of grupo.screens) {
      for (const categoria of bloque.categories) {
        const indice = categoria.items.findIndex(
          (item) => comoObjeto(item).id === id,
        );

        if (indice !== -1) {
          return {
            categoria,
            indice,
            donde: {
              grupo: grupo.slug,
              bloque: bloque.slug,
              categoria: categoria.id,
            },
          };
        }
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Productos
// ---------------------------------------------------------------------------

export function agregarProducto(
  contenido: Contenido,
  donde: Ubicacion,
  datos: DatosProducto,
): Contenido {
  const copia = clonar(contenido);
  const categoria = buscarCategoria(copia, donde);

  const nuevo = limpiar<MenuItem>({
    id: idLibre(copia, `${donde.categoria}-${datos.name}`),
    active: datos.active ?? true,
    name: datos.name.trim(),
    description: datos.description?.trim(),
    price: datos.price,
    note: datos.note?.trim(),
    tag: datos.tag,
  });

  categoria.items.push(nuevo);
  return copia;
}

/**
 * Edita un producto y, si se pide, lo cambia de categoria.
 *
 * Mover es quitar y volver a poner CONSERVANDO el id: si cambiara, el
 * formulario que lo acaba de guardar quedaria apuntando a un renglon que ya no
 * existe, y el siguiente guardado fallaria sin motivo aparente.
 */
export function editarProducto(
  contenido: Contenido,
  id: string,
  datos: DatosProducto,
  destino?: Ubicacion,
): Contenido {
  const copia = clonar(contenido);
  const encontrado = localizarProducto(copia, id);
  if (!encontrado) throw new Error(`No existe el producto "${id}".`);

  const { categoria, indice, donde } = encontrado;
  const anterior = comoObjeto(categoria.items[indice]);

  const actualizado = limpiar<MenuItem>({
    id: anterior.id ?? id,
    active: datos.active ?? anterior.active ?? true,
    name: datos.name.trim(),
    description: datos.description?.trim(),
    price: datos.price,
    note: datos.note?.trim(),
    tag: datos.tag,
  });

  const seQueda =
    !destino ||
    (destino.grupo === donde.grupo &&
      destino.bloque === donde.bloque &&
      destino.categoria === donde.categoria);

  if (seQueda) {
    categoria.items[indice] = actualizado;
    return copia;
  }

  categoria.items.splice(indice, 1);
  buscarCategoria(copia, destino).items.push(actualizado);
  return copia;
}

export function alternarProducto(contenido: Contenido, id: string): Contenido {
  const copia = clonar(contenido);
  const encontrado = localizarProducto(copia, id);
  if (!encontrado) throw new Error(`No existe el producto "${id}".`);

  const { categoria, indice } = encontrado;
  const item = comoObjeto(categoria.items[indice]);
  categoria.items[indice] = { ...item, active: item.active === false };

  return copia;
}

export function eliminarProducto(contenido: Contenido, id: string): Contenido {
  const copia = clonar(contenido);
  const encontrado = localizarProducto(copia, id);
  if (!encontrado) throw new Error(`No existe el producto "${id}".`);

  encontrado.categoria.items.splice(encontrado.indice, 1);
  return copia;
}

// ---------------------------------------------------------------------------
// Categorias — las tarjetas, con su cinta de color
// ---------------------------------------------------------------------------

/**
 * Aplica el precio de una tarjeta: unico, por tamanios, o ninguno.
 *
 * "Ninguno" no es un descuido. El Frozen Yogurt no lleva precio de tarjeta
 * porque cada renglon trae el suyo, y por eso se BORRA la clave en vez de
 * dejarla en cero: un cero la carta lo pinta como una pastilla de "$0".
 */
function aplicarPrecio(categoria: MenuCategory, datos: DatosCategoria): void {
  const tramos = (datos.tramos ?? []).filter(
    (tramo) => tramo.label.trim() !== "" || Number.isFinite(tramo.value),
  );

  if (tramos.length > 0) {
    categoria.price = tramos.map((tramo) => ({
      label: tramo.label.trim(),
      value: tramo.value,
    }));
  } else if (typeof datos.precioUnico === "number") {
    categoria.price = datos.precioUnico;
  } else {
    delete categoria.price;
  }
}

export function editarCategoria(
  contenido: Contenido,
  donde: Ubicacion,
  datos: DatosCategoria,
): Contenido {
  const copia = clonar(contenido);
  const categoria = buscarCategoria(copia, donde);

  categoria.name = datos.name.trim();
  categoria.accent = datos.accent;
  categoria.active = datos.active ?? true;

  if (datos.description?.trim()) {
    categoria.description = datos.description.trim();
  } else {
    delete categoria.description;
  }

  if (datos.columns) categoria.columns = datos.columns;
  else delete categoria.columns;

  aplicarPrecio(categoria, datos);
  return copia;
}

export function agregarCategoria(
  contenido: Contenido,
  grupoSlug: string,
  bloqueSlug: string,
  datos: DatosCategoria,
): Contenido {
  const copia = clonar(contenido);
  const { bloque } = buscarBloque(copia, grupoSlug, bloqueSlug);

  // El id solo tiene que ser unico dentro del bloque: es lo que lo identifica
  // junto al menu y al bloque, no por si solo.
  const usados = new Set(bloque.categories.map((c) => c.id));
  const raiz = slugificar(datos.name, "categoria");
  let id = raiz;
  let n = 2;
  while (usados.has(id)) id = `${raiz}-${n++}`;

  const nueva: MenuCategory = {
    id,
    active: datos.active ?? true,
    name: datos.name.trim(),
    accent: datos.accent,
    items: [],
  };

  if (datos.description?.trim()) nueva.description = datos.description.trim();
  if (datos.columns) nueva.columns = datos.columns;
  aplicarPrecio(nueva, datos);

  bloque.categories.push(nueva);
  return copia;
}

export function alternarCategoria(
  contenido: Contenido,
  donde: Ubicacion,
): Contenido {
  const copia = clonar(contenido);
  const categoria = buscarCategoria(copia, donde);
  categoria.active = categoria.active === false;

  return copia;
}

export function eliminarCategoria(
  contenido: Contenido,
  donde: Ubicacion,
): Contenido {
  const copia = clonar(contenido);
  const { bloque } = buscarBloque(copia, donde.grupo, donde.bloque);

  bloque.categories = bloque.categories.filter((c) => c.id !== donde.categoria);
  return copia;
}

// ---------------------------------------------------------------------------
// Bloques y menus
// ---------------------------------------------------------------------------

export function editarBloque(
  contenido: Contenido,
  grupoSlug: string,
  bloqueSlug: string,
  datos: DatosBloque,
): Contenido {
  const copia = clonar(contenido);
  const { bloque } = buscarBloque(copia, grupoSlug, bloqueSlug);

  bloque.title = datos.title.trim();
  bloque.active = datos.active ?? true;

  if (datos.section?.trim()) bloque.section = datos.section.trim();
  else delete bloque.section;

  if (datos.tagline?.trim()) bloque.tagline = datos.tagline.trim();
  else delete bloque.tagline;

  if (datos.footnote?.trim()) bloque.footnote = datos.footnote.trim();
  else delete bloque.footnote;

  if (datos.layout) bloque.layout = datos.layout;
  else delete bloque.layout;

  /*
   * Preparacion, con tres estados que hacen falta los tres:
   *   texto  → esa pastilla ("Latte o Frape")
   *   null   → sin pastilla, aunque la configuracion general traiga una
   *   ausente→ lo que diga la configuracion general
   */
  if (datos.preparation === null) {
    bloque.preparation = null;
  } else if (datos.preparation?.trim()) {
    bloque.preparation = datos.preparation.trim();
  } else {
    delete bloque.preparation;
  }

  return copia;
}

export function editarMenu(
  contenido: Contenido,
  grupoSlug: string,
  datos: { label: string; active?: boolean },
): Contenido {
  const copia = clonar(contenido);
  const grupo = copia.groups.find((g) => g.slug === grupoSlug);
  if (!grupo) throw new Error(`No existe el menu "${grupoSlug}".`);

  grupo.label = datos.label.trim();
  grupo.active = datos.active ?? true;

  return copia;
}

export function alternarMenu(contenido: Contenido, grupoSlug: string): Contenido {
  const copia = clonar(contenido);
  const grupo = copia.groups.find((g) => g.slug === grupoSlug);
  if (!grupo) throw new Error(`No existe el menu "${grupoSlug}".`);

  grupo.active = grupo.active === false;
  return copia;
}

/**
 * Orden de los menus en la carta, que es su jerarquia: en una pagina que se
 * recorre de arriba abajo, lo primero que se ve es lo que mas se pide.
 *
 * Se mueve de uno en uno con dos botones en vez de arrastrando, porque
 * arrastrar con el dedo en una lista larga dentro de un movil es un suplicio.
 */
export function moverMenu(
  contenido: Contenido,
  grupoSlug: string,
  direccion: "arriba" | "abajo",
): Contenido {
  const copia = clonar(contenido);

  /*
   * La lista guardada puede estar incompleta o traer menus que ya no existen.
   * Se sanea ANTES de mover: sobre una lista con huecos, el indice del menu no
   * corresponde con lo que se ve en pantalla y el boton lo mandaria a un sitio
   * que no es el de al lado.
   */
  const orden = [
    ...copia.site.playlist.filter((slug) =>
      copia.groups.some((g) => g.slug === slug),
    ),
    ...copia.groups
      .map((g) => g.slug)
      .filter((slug) => !copia.site.playlist.includes(slug)),
  ];

  const desde = orden.indexOf(grupoSlug);
  if (desde === -1) throw new Error(`No existe el menu "${grupoSlug}".`);

  const hasta = direccion === "arriba" ? desde - 1 : desde + 1;
  // En los extremos no se hace nada, en vez de dar error: el boton de subir
  // del primero simplemente no tiene a donde ir.
  if (hasta < 0 || hasta >= orden.length) return copia;

  [orden[desde], orden[hasta]] = [orden[hasta], orden[desde]];
  copia.site.playlist = orden;

  return copia;
}
