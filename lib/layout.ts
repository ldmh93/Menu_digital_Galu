import {
  hasDescriptions,
  toMenuItem,
  type MenuCategory,
  type MenuItemInput,
  type MenuLayout,
  type MenuScreen,
} from "@/data/types";

/**
 * Reglas de composicion.
 *
 * En la version de televisor todo se calculaba en pixeles contra un lienzo fijo
 * de 1080 px: cuantas columnas cabian y con que tamano de letra. Aqui no hay
 * lienzo — hay un celular de 360 px, una tablet y un monitor — asi que el
 * reparto lo hace el navegador y este archivo solo declara las INTENCIONES:
 * cuanto de ancho quiere como minimo cada columna y como se agrupan las
 * tarjetas cuando sobra sitio.
 */

/**
 * Ancho minimo de una columna de productos, en `rem`.
 *
 * Se usa con `column-width` de CSS: el navegador mete tantas columnas de ese
 * ancho como quepan y reparte el resto. En un celular salen dos columnas de
 * sabores sueltos y una sola de combinaciones (que llevan ingredientes debajo
 * y necesitan renglon largo); en un monitor salen tres o cuatro.
 */
export function anchoColumna(category: MenuCategory): string {
  if (category.columns === 1) return "100%";

  // 8.5rem esta medido: en un celular de 390 px el interior de una tarjeta son
  // ~318 px, que dan justo para dos columnas de 136 px con su calle de 24. Un
  // pelo mas ancho y se cae a una sola columna, que es la diferencia entre ver
  // veintiun sabores de una vez o tener que arrastrar el dedo por todos.
  return hasDescriptions(category.items) ? "16rem" : "8.5rem";
}

/**
 * Tamano de letra de la lista, en `clamp(minimo, fluido, maximo)`.
 *
 * Una lista de siete tamanos no debe leerse igual de pequena que una de
 * cuarenta sabores: si sobra sitio, la letra crece. Es la misma idea que en la
 * version de televisor, pero expresada en CSS para que se adapte sola al ancho
 * real del aparato en vez de a un lienzo imaginario.
 */
export function tamanoLista(items: MenuItemInput[]): string {
  const conDescripcion = hasDescriptions(items);

  if (items.length <= 8) {
    return conDescripcion
      ? "clamp(0.95rem, 0.85rem + 0.5vw, 1.15rem)"
      : "clamp(1.05rem, 0.9rem + 0.7vw, 1.35rem)";
  }

  if (items.length <= 16) {
    return conDescripcion
      ? "clamp(0.9rem, 0.82rem + 0.4vw, 1.08rem)"
      : "clamp(0.95rem, 0.86rem + 0.45vw, 1.15rem)";
  }

  return conDescripcion
    ? "clamp(0.875rem, 0.8rem + 0.35vw, 1rem)"
    : "clamp(0.9rem, 0.84rem + 0.3vw, 1.05rem)";
}

/**
 * Elige la distribucion automaticamente cuando el menu no la declara.
 *
 * Con una o dos categorias la respuesta es obvia. Con tres, si una tiene casi
 * tantos productos como las otras dos juntas conviene darle una tarjeta ancha
 * propia (`feature`) en lugar de tres columnas estrechas.
 */
export function resolveLayout(
  declared: MenuLayout | undefined,
  categories: MenuCategory[],
): MenuLayout {
  if (declared) return declared;
  if (categories.length <= 1) return "solo";
  if (categories.length === 2) return "duo";
  if (categories.length > 3) return "feature";

  const counts = categories.map((category) => category.items.length);
  const largest = Math.max(...counts);
  const rest = counts.reduce((sum, count) => sum + count, 0) - largest;

  return largest > rest * 0.9 || largest > 14 ? "feature" : "trio";
}

/**
 * Clases de rejilla para un grupo de tarjetas.
 *
 * Siempre una sola columna en el celular; el reparto solo entra cuando hay
 * ancho de sobra. `items-start` a proposito: las tarjetas conservan su altura
 * natural en lugar de estirarse hasta la mas alta, que dejaba un vacio raro
 * bajo las listas cortas.
 */
export function clasesRejilla(cuantas: MenuLayout): string {
  const base = "grid items-start gap-5 sm:gap-6";

  if (cuantas === "duo") return `${base} md:grid-cols-2`;
  if (cuantas === "trio") return `${base} md:grid-cols-2 xl:grid-cols-3`;

  return base;
}

/** Rejilla de las tarjetas secundarias de una distribucion `feature`. */
export function clasesRejillaSecundaria(cuantas: number): string {
  const base = "grid items-start gap-5 sm:gap-6";

  if (cuantas >= 3) return `${base} md:grid-cols-2 xl:grid-cols-3`;
  if (cuantas === 2) return `${base} md:grid-cols-2`;

  return base;
}

/**
 * Nota al pie y extras comunes a TODOS los bloques de un menu.
 *
 * En el televisor cada pantalla repetia "Todas disponibles en 16 y 24 oz" y las
 * cuatro pastillas de extras, porque cada pantalla se veia sola. En una pagina
 * que se recorre de un tiron, repetirlo cinco veces es ruido: si el dato es el
 * mismo en todos los bloques se saca una sola vez, al final del menu.
 */
export function comunesDelGrupo(screens: MenuScreen[]): {
  footnote?: string;
  extras?: MenuScreen["extras"];
} {
  const conCategorias = screens.filter((screen) => screen.categories.length > 0);
  if (conCategorias.length < 2) return {};

  const [primera] = conCategorias;

  const footnote =
    primera.footnote &&
    conCategorias.every((screen) => screen.footnote === primera.footnote)
      ? primera.footnote
      : undefined;

  const firma = (screen: MenuScreen) =>
    (screen.extras ?? []).map((extra) => `${extra.name}:${extra.price}`).join("|");

  const extras =
    primera.extras?.length &&
    conCategorias.every((screen) => firma(screen) === firma(primera))
      ? primera.extras
      : undefined;

  return { footnote, extras };
}

/** True si el texto de busqueda aparece en el nombre o los ingredientes. */
export function coincide(item: MenuItemInput, consulta: string): boolean {
  if (!consulta) return true;

  const { name, description, note } = toMenuItem(item);

  return normalizar(`${name} ${description ?? ""} ${note ?? ""}`).includes(
    consulta,
  );
}

/**
 * Texto comparable: sin mayusculas y sin acentos.
 * Quien busca "platano" en el celular no escribe la tilde.
 *
 * Se quitan las marcas sin espaciado (`\p{Mn}`, las tildes y la virgulilla que
 * NFD deja sueltas) y NO los "diacriticos" en general. `\p{Diacritic}` incluye
 * el punto medio "·", que es justo lo que separa los ingredientes de cada
 * combinacion: al borrarlo, esta cadena salia mas corta que el texto original y
 * las posiciones que devuelve dejaban de servir para marcar lo encontrado.
 * Quitando solo `\p{Mn}` la longitud se conserva carecter a caracter.
 */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "");
}
