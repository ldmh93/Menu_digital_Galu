import { leerContenido, podarParaPublico } from "@/lib/contenido";
import type { MenuGroup, MenuScreen } from "./types";

/**
 * Registro unico de menus.
 *
 * Un menu es un GRUPO de pantallas: Ice Rollers cabe en una, pero Bobas
 * necesita cinco. Las rutas usan el grupo; la carta aplana todos los grupos de
 * la lista en una sola secuencia de bloques.
 *
 * Lo que antes era un `import` de siete archivos .ts ahora es una lectura de
 * `data/contenido.json`, que es lo que el panel de administracion reescribe.
 * Por eso todo esto es async: el contrato de datos no cambio ni un campo, pero
 * la fuente ya no es codigo compilado.
 *
 * Todo lo que sale de aqui va PODADO: sin los menus, bloques, categorias ni
 * productos que esten apagados en el panel. Quien necesite el contenido
 * completo —solo el panel— lee del almacen directamente.
 */

async function leerGrupos(): Promise<MenuGroup[]> {
  const { groups } = await leerContenido();
  return groups;
}

export async function getGroups(): Promise<Record<string, MenuGroup>> {
  const grupos = podarParaPublico(await leerGrupos());
  return Object.fromEntries(grupos.map((group) => [group.slug, group]));
}

export async function getGroup(slug: string): Promise<MenuGroup | undefined> {
  const grupos = podarParaPublico(await leerGrupos());
  return grupos.find((group) => group.slug === slug);
}

/** Grupos en el orden de la carta, que es la jerarquia definida en el panel. */
export async function getPlaylistGroups(): Promise<MenuGroup[]> {
  const { site, groups } = await leerContenido();
  const porSlug = new Map(groups.map((group) => [group.slug, group]));

  /*
   * Manda el orden de `playlist`, pero un menu que no aparezca en ella no
   * puede desaparecer en silencio: se anade al final. Antes eso no importaba
   * porque la lista la escribia a mano quien tocaba el codigo; ahora la mueve
   * el panel y un descuido dejaria un menu entero fuera de la carta sin que
   * nadie lo note.
   */
  const ordenados = [
    ...site.playlist
      .map((slug) => porSlug.get(slug))
      .filter((group): group is MenuGroup => Boolean(group)),
    ...groups.filter((group) => !site.playlist.includes(group.slug)),
  ];

  // Un menu sin productos es un menu pendiente de datos: no se emite.
  return podarParaPublico(ordenados);
}

/** Todos los bloques de la carta, en secuencia. */
export async function getPlaylistScreens(): Promise<MenuScreen[]> {
  const grupos = await getPlaylistGroups();
  return grupos.flatMap((group) => group.screens);
}

/**
 * Etiqueta que corresponde a cada bloque de la secuencia.
 * Sirve para que un indicador de progreso agrupe las cinco pantallas de Bobas
 * bajo un solo nombre en lugar de mostrar cinco marcas sueltas.
 */
export async function getPlaylistLabels(): Promise<string[]> {
  const grupos = await getPlaylistGroups();
  return grupos.flatMap((group) => group.screens.map(() => group.label));
}

/**
 * Slugs para las rutas estaticas de /menu/[slug].
 *
 * Aqui SI van todos, tambien los apagados: una URL que existia y de pronto
 * devuelve 404 rompe los enlaces que la gente ya tenga guardados. El grupo
 * apagado responde, pero la propia pagina decide que no hay nada que enseniar.
 */
export async function getAllSlugs(): Promise<string[]> {
  const grupos = await leerGrupos();
  return grupos.map((group) => group.slug);
}
