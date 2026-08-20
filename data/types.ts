/**
 * Contratos de datos del menu.
 *
 * Estos tipos son el "esquema" del futuro panel administrativo: el dia que los
 * datos vengan de una base de datos, los archivos de /data se sustituyen por
 * funciones async que devuelvan exactamente estas mismas formas.
 */

/** Acentos disponibles, tomados del fondo oficial de la marca. */
export type Accent = "rosa" | "lavanda" | "menta" | "amarillo" | "morado";

/** Etiquetas destacables de un producto. */
export type ItemTag = "nuevo" | "favorito";

export interface MenuItem {
  /**
   * Llave estable del producto: la que usa el panel para saber que renglon
   * esta editando. No sirve el nombre, porque cambiarlo es justo una de las
   * cosas que se editan. Opcional para que un producto pueda seguir
   * declarandose como cadena suelta.
   */
  id?: string;
  /**
   * Visible en la carta publica. `false` lo apaga sin borrarlo, que es lo que
   * hace falta cuando un sabor se acaba y vuelve la semana siguiente.
   * Si no se pone, se da por visible.
   */
  active?: boolean;
  name: string;
  /** Ingredientes o composicion. Se muestra bajo el nombre, en letra ligera. */
  description?: string;
  /**
   * Precio propio del producto, alineado a la derecha. Se usa cuando cada
   * renglon cuesta distinto (p. ej. los tamanos del frozen yogurt) en lugar de
   * un precio unico para toda la categoria.
   */
  price?: number;
  /** Insignia opcional a la derecha del nombre. */
  tag?: ItemTag;
  /** Excepcion de precio o aclaracion corta, p. ej. "$79" o "+$10". */
  note?: string;
}

/** Un producto puede declararse como texto plano o como objeto completo. */
export type MenuItemInput = string | MenuItem;

/** Un precio por tamano: "16 oz" → $72. */
export interface PriceTier {
  label: string;
  value: number;
}

/** Precio unico, o varios precios por tamano. */
export type Price = number | PriceTier[];

export interface MenuCategory {
  id: string;
  /** Visible en la carta publica. Apagarla esconde la tarjeta entera. */
  active?: boolean;
  /** Titulo de la tarjeta: "Agua", "Especiales", "Premium"... */
  name: string;
  /**
   * Precio unico o tabla de precios por tamano. Se omite cuando cada producto
   * lleva su propio precio (ver `MenuItem.price`).
   */
  price?: Price;
  /**
   * Fuerza el numero de columnas de la lista. Normalmente se deja sin poner y
   * lo calcula lib/layout.ts; sirve para listas tipo tarifa que se leen mejor
   * en una sola columna.
   */
  columns?: number;
  /** Linea de apoyo bajo el titulo (opcional). */
  description?: string;
  /** Color de acento de la tarjeta. */
  accent: Accent;
  items: MenuItemInput[];
}

/**
 * Reparto de las tarjetas cuando hay ancho de sobra (tablet y escritorio).
 * En el celular SIEMPRE es una tarjeta por fila; esto solo decide como se
 * agrupan cuando la pantalla da para mas de una columna.
 *
 * - `solo`   → una unica tarjeta a todo lo ancho.
 * - `duo`    → hasta dos tarjetas por fila.
 * - `trio`   → hasta tres tarjetas por fila.
 * - `feature`→ la primera a todo lo ancho y el resto repartidas debajo. Se usa
 *              cuando una categoria tiene muchos mas productos que las otras.
 */
export type MenuLayout = "solo" | "duo" | "trio" | "feature";

/** Complemento de pago aparte que se muestra como pastilla bajo las tarjetas. */
export interface MenuExtra {
  name: string;
  price: number;
}

/**
 * Un bloque del menu. Antes era literalmente una pantalla de televisor; ahora
 * es un tramo de la pagina, pero el contrato de datos no cambia.
 */
export interface MenuScreen {
  /** Identificador estable, tambien usado como ancla en la pagina. */
  slug: string;
  /** Visible en la carta publica. Apaga el bloque entero. */
  active?: boolean;
  /** Titulo grande del menu. */
  title: string;
  /**
   * Seccion dentro del menu. Se usa cuando un menu se reparte en varios
   * bloques: el titulo no cambia y la seccion si.
   */
  section?: string;
  /** Frase corta bajo el titulo. */
  tagline?: string;
  /**
   * Anula la forma de preparacion de config/site.ts en ESTE bloque.
   * `null` la oculta (util si un menu no se sirve latte ni frape).
   */
  preparation?: string | null;
  layout?: MenuLayout;
  categories: MenuCategory[];
  /** Nota al pie especifica de este menu. */
  footnote?: string;
  /** Extras con costo adicional (leche vegetal, toppings...). */
  extras?: MenuExtra[];
}

/** Agrupacion de bloques que pertenecen al mismo menu (p. ej. Bobas). */
export interface MenuGroup {
  /** Slug de la ruta: /menu/{slug} y ancla de la pagina principal. */
  slug: string;
  /** Nombre corto para la barra de navegacion. */
  label: string;
  /** Visible en la carta publica. Apaga el menu completo. */
  active?: boolean;
  /**
   * Foto del producto que encabeza el menu, dentro de /public.
   *
   * Se espera un PNG o WebP con el producto RECORTADO sobre transparente: en
   * la carta no se enmarca, flota sobre el fondo de marca con su propia
   * sombra. Una foto con fondo opaco se veria como un cuadro pegado encima.
   *
   * Es opcional: un menu sin foto se pinta exactamente como antes, sin hueco
   * ni marcador de posicion.
   */
  image?: string;
  /**
   * Que se ve en la foto, para quien no puede verla.
   *
   * No repite el nombre del menu —el titulo va justo al lado y un lector de
   * pantalla lo diria dos veces—, sino que describe el producto real.
   */
  imageAlt?: string;
  /**
   * Proporcion de la foto (ancho / alto), para reservarle el sitio antes de
   * que cargue. Sin esto la carta da un salto cuando la imagen aparece y se
   * lleva por delante el renglon que se estaba leyendo.
   */
  imageRatio?: number;
  screens: MenuScreen[];
}

/** Normaliza `string | MenuItem` a `MenuItem`. */
export function toMenuItem(input: MenuItemInput): MenuItem {
  return typeof input === "string" ? { name: input } : input;
}

/** Normaliza cualquier precio a lista de tramos. */
export function toPriceTiers(price: Price | undefined): PriceTier[] {
  if (price === undefined) return [];
  return typeof price === "number" ? [{ label: "", value: price }] : price;
}

/** True si alguno de los productos trae descripcion de ingredientes. */
export function hasDescriptions(items: MenuItemInput[]): boolean {
  return items.some((item) => Boolean(toMenuItem(item).description));
}
