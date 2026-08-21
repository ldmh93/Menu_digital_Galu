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

/** Redes con icono en el pie. Fuera de esta lista no hay red valida. */
export const REDES = ["instagram", "facebook", "tiktok"];

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

// ---------------------------------------------------------------------------
// Acciones rapidas
//
// Lo que se hace muchas veces al dia tiene que costar un toque, no abrir un
// formulario, rellenarlo y guardarlo. Estas son las operaciones que el panel
// ofrece como botones sueltos dentro de las listas.
// ---------------------------------------------------------------------------

/**
 * Copia un producto y deja la copia justo debajo del original.
 *
 * Sirve para las familias de sabores que solo cambian en una palabra —"Fresa
 * con Crema", "Fresas con Crema y Nuez"—, donde volver a escribir los
 * ingredientes enteros es justo donde se cuelan las erratas. Se anade al lado
 * y no al final para no perderla de vista en una lista de sesenta.
 */
export function duplicarProducto(contenido: Contenido, id: string): Contenido {
  const copia = clonar(contenido);
  const encontrado = localizarProducto(copia, id);
  if (!encontrado) throw new Error(`No existe el producto "${id}".`);

  const { categoria, indice, donde } = encontrado;
  const original = comoObjeto(categoria.items[indice]);

  const duplicado: MenuItem = {
    ...original,
    id: idLibre(copia, `${donde.categoria}-${original.name}-copia`),
    name: `${original.name} (copia)`,
    /*
     * Nace apagada a proposito. Una copia recien hecha todavia no es un
     * producto: le falta el nombre de verdad y a veces el precio. Si saliera
     * publicada al instante, el cliente leeria "Fresa (copia)" en la carta.
     */
    active: false,
  };

  categoria.items.splice(indice + 1, 0, duplicado);
  return copia;
}

/** Sube o baja un producto dentro de su tarjeta. */
export function moverProducto(
  contenido: Contenido,
  id: string,
  direccion: "arriba" | "abajo",
): Contenido {
  const copia = clonar(contenido);
  const encontrado = localizarProducto(copia, id);
  if (!encontrado) throw new Error(`No existe el producto "${id}".`);

  const { categoria, indice } = encontrado;
  const hasta = direccion === "arriba" ? indice - 1 : indice + 1;
  if (hasta < 0 || hasta >= categoria.items.length) return copia;

  const [item] = categoria.items.splice(indice, 1);
  categoria.items.splice(hasta, 0, item);

  return copia;
}

/**
 * Pone, cambia o quita la insignia de un producto.
 *
 * Pasarle la insignia que ya tiene la quita, para que el mismo boton sirva de
 * ida y de vuelta: marcar y desmarcar un favorito son la misma intencion y no
 * merecen dos controles distintos.
 */
export function destacarProducto(
  contenido: Contenido,
  id: string,
  etiqueta: ItemTag | null,
): Contenido {
  const copia = clonar(contenido);
  const encontrado = localizarProducto(copia, id);
  if (!encontrado) throw new Error(`No existe el producto "${id}".`);

  const { categoria, indice } = encontrado;
  const item = comoObjeto(categoria.items[indice]);
  const siguiente: MenuItem = { ...item };

  if (etiqueta === null || item.tag === etiqueta) delete siguiente.tag;
  else siguiente.tag = etiqueta;

  categoria.items[indice] = siguiente;
  return copia;
}

/** Cambia solo el precio, sin tocar nada mas del producto. */
export function cambiarPrecioProducto(
  contenido: Contenido,
  id: string,
  precio: number | undefined,
): Contenido {
  const copia = clonar(contenido);
  const encontrado = localizarProducto(copia, id);
  if (!encontrado) throw new Error(`No existe el producto "${id}".`);

  const { categoria, indice } = encontrado;
  const item = comoObjeto(categoria.items[indice]);
  const siguiente: MenuItem = { ...item };

  // Vacio no es cero: vacio significa "usa el precio de la tarjeta".
  if (precio === undefined) delete siguiente.price;
  else siguiente.price = precio;

  categoria.items[indice] = siguiente;
  return copia;
}

/** Sube o baja una tarjeta dentro de su bloque. */
export function moverCategoria(
  contenido: Contenido,
  donde: Ubicacion,
  direccion: "arriba" | "abajo",
): Contenido {
  const copia = clonar(contenido);
  const { bloque } = buscarBloque(copia, donde.grupo, donde.bloque);

  const indice = bloque.categories.findIndex((c) => c.id === donde.categoria);
  if (indice === -1) {
    throw new Error(`No existe la categoria "${donde.categoria}".`);
  }

  const hasta = direccion === "arriba" ? indice - 1 : indice + 1;
  if (hasta < 0 || hasta >= bloque.categories.length) return copia;

  const [tarjeta] = bloque.categories.splice(indice, 1);
  bloque.categories.splice(hasta, 0, tarjeta);

  return copia;
}

// ---------------------------------------------------------------------------
// Menus completos
// ---------------------------------------------------------------------------

/**
 * Crea un menu con su primer bloque ya puesto.
 *
 * Lleva bloque de entrada porque un menu sin el no admite tarjetas, y quien
 * acaba de crearlo espera poder anadirle productos ya. El slug se calcula una
 * vez y no se vuelve a tocar: es la URL publica (/menu/bobas) y el ancla de la
 * pagina, asi que cambiarlo romperia los enlaces que la gente ya tenga
 * guardados.
 */
export function crearMenu(contenido: Contenido, label: string): Contenido {
  const copia = clonar(contenido);

  const usados = new Set(copia.groups.map((g) => g.slug));
  const raiz = slugificar(label, "menu");
  let slug = raiz;
  let n = 2;
  while (usados.has(slug)) slug = `${raiz}-${n++}`;

  copia.groups.push({
    slug,
    label: label.trim(),
    active: true,
    screens: [{ slug, title: label.trim(), active: true, categories: [] }],
  });

  copia.site.playlist = [...copia.site.playlist, slug];
  return copia;
}

export function eliminarMenu(contenido: Contenido, grupoSlug: string): Contenido {
  const copia = clonar(contenido);

  if (!copia.groups.some((g) => g.slug === grupoSlug)) {
    throw new Error(`No existe el menu "${grupoSlug}".`);
  }

  copia.groups = copia.groups.filter((g) => g.slug !== grupoSlug);
  copia.site.playlist = copia.site.playlist.filter((slug) => slug !== grupoSlug);

  return copia;
}

/** Pone, cambia o quita la foto que encabeza un menu. */
export function asignarImagenMenu(
  contenido: Contenido,
  grupoSlug: string,
  imagen: { src: string; alt: string; ratio: number } | null,
): Contenido {
  const copia = clonar(contenido);
  const grupo = copia.groups.find((g) => g.slug === grupoSlug);
  if (!grupo) throw new Error(`No existe el menu "${grupoSlug}".`);

  if (imagen === null) {
    delete grupo.image;
    delete grupo.imageAlt;
    delete grupo.imageRatio;
    return copia;
  }

  grupo.image = imagen.src;
  grupo.imageAlt = imagen.alt;
  grupo.imageRatio = Number(imagen.ratio.toFixed(4));

  return copia;
}

// ---------------------------------------------------------------------------
// Datos del negocio
// ---------------------------------------------------------------------------

export interface DatosSitio {
  brand: string;
  subtitle: string;
  intro: string;
  handle: string;
  networks: string[];
  message: string;
  studio: string;
  tagline: string;
  phone: string;
  phoneCountryCode: string;
}

/**
 * Guarda los datos del negocio.
 *
 * Cada campo se toca solo si viene: asi un formulario que edita media docena
 * de datos no borra los que no incluye, que es como se pierde el telefono al
 * guardar el subtitulo.
 *
 * El telefono se queda solo con digitos. Se usa para construir enlaces `tel:`
 * y de WhatsApp, y un espacio o un guion de mas los rompe sin que se note
 * hasta que alguien intenta llamar desde la carta.
 */
export function editarSitio(
  contenido: Contenido,
  datos: Partial<DatosSitio>,
): Contenido {
  const copia = clonar(contenido);
  const sitio = copia.site;

  if (datos.brand !== undefined) sitio.brand = datos.brand.trim();
  if (datos.subtitle !== undefined) sitio.subtitle = datos.subtitle.trim();
  if (datos.intro !== undefined) sitio.intro = datos.intro.trim();

  if (datos.handle !== undefined) {
    // Se guarda siempre con una sola arroba delante, la escriba quien la
    // escriba: el pie la pinta tal cual y "@@galu" se ve como un error.
    const limpio = datos.handle.trim().replace(/^@+/, "");
    sitio.footer.handle = limpio ? `@${limpio}` : "";
  }
  if (datos.networks !== undefined) sitio.footer.networks = datos.networks;
  if (datos.message !== undefined) sitio.footer.message = datos.message.trim();

  if (datos.studio !== undefined) sitio.credits.studio = datos.studio.trim();
  if (datos.tagline !== undefined) sitio.credits.tagline = datos.tagline.trim();
  if (datos.phone !== undefined) {
    sitio.credits.phone = datos.phone.replace(/\D/g, "");
  }
  if (datos.phoneCountryCode !== undefined) {
    sitio.credits.phoneCountryCode = datos.phoneCountryCode.replace(/\D/g, "");
  }

  return copia;
}
