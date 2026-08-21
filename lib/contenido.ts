import { promises as fs } from "node:fs";
import path from "node:path";

import type { MenuGroup } from "@/data/types";

/**
 * Almacen del contenido editable.
 *
 * Antes la carta eran literales de TypeScript: para cambiar un precio habia
 * que tocar codigo y volver a compilar. Ahora vive en `data/contenido.json`,
 * que el panel puede reescribir en caliente.
 *
 * TODO EL ACCESO A DISCO ESTA AQUI a proposito. El dia que el contenido pase a
 * una base de datos —que es lo que hara falta para editar desde el movil con
 * el sitio ya desplegado, porque en Vercel el disco es de solo lectura— basta
 * con reimplementar `leerContenido` y `guardarContenido`; ni el panel ni la
 * carta publica se enteran.
 */

export interface ContenidoSite {
  brand: string;
  subtitle: string;
  /**
   * Frase de bienvenida bajo el subtitulo, en la portada de la carta.
   *
   * Opcional: si no viene, el encabezado usa la suya de siempre. Asi el
   * contenido que ya estaba guardado antes de que este campo existiera sigue
   * pintando exactamente igual.
   */
  intro?: string;
  logo: string;
  background: string;
  preparation: string;
  /** Orden de los menus en la carta. Es la jerarquia: lo primero es lo que mas se pide. */
  playlist: string[];
  footer: {
    handle: string;
    networks: string[];
    message: string;
  };
  credits: {
    studio: string;
    tagline: string;
    phone: string;
    phoneCountryCode: string;
  };
}

export interface Contenido {
  site: ContenidoSite;
  groups: MenuGroup[];
}

const ARCHIVO = path.join(process.cwd(), "data", "contenido.json");

export async function leerContenido(): Promise<Contenido> {
  const crudo = await fs.readFile(ARCHIVO, "utf8");
  return JSON.parse(crudo) as Contenido;
}

/**
 * Escritura atomica: se escribe en un archivo aparte y se renombra encima.
 *
 * Renombrar es una sola operacion para el sistema de archivos, asi que la
 * carta nunca puede leer un JSON a medio escribir. Sin esto, guardar justo
 * mientras alguien carga la pagina la dejaria con un menu partido por la
 * mitad, o directamente rota.
 */
export async function guardarContenido(contenido: Contenido): Promise<void> {
  const temporal = `${ARCHIVO}.${process.pid}.tmp`;

  try {
    await fs.writeFile(temporal, JSON.stringify(contenido, null, 2) + "\n", "utf8");
    await fs.rename(temporal, ARCHIVO);
  } catch (error) {
    /*
     * En un hospedaje sin disco de escritura —Vercel y parecidos— esto falla
     * siempre. El codigo que devuelve el sistema (EROFS) no le dice nada a
     * quien solo queria cambiar un precio, asi que se traduce a lo unico
     * accionable: aqui no se puede guardar, y cual es la salida.
     */
    const codigo = (error as NodeJS.ErrnoException).code;
    if (codigo === "EROFS" || codigo === "EACCES" || codigo === "EPERM") {
      throw new Error(
        "Este servidor no deja guardar en disco. El panel funciona en tu " +
          "computadora; para editar desde el sitio publicado hay que mover el " +
          "contenido a una base de datos.",
      );
    }

    throw error;
  }
}

/**
 * ¿Se puede guardar en este servidor?
 *
 * Vercel marca los suyos con esta variable, y su disco es de solo lectura
 * salvo /tmp, que se vacia entre peticiones y por tanto no sirve de almacen.
 * Se comprueba para AVISAR en el panel por adelantado, en vez de dejar que
 * alguien reescriba media carta y lo descubra al darle a guardar.
 */
export function sePuedeGuardar(): boolean {
  return !process.env.VERCEL;
}

/** True salvo que este explicitamente apagado. Lo que no se declara, se ve. */
export function visible(elemento: { active?: boolean }): boolean {
  return elemento.active !== false;
}

/**
 * La carta tal y como la ve un cliente: sin nada apagado desde el panel.
 *
 * Se poda de dentro afuera —productos, luego categorias vacias, luego bloques
 * vacios— por el mismo motivo que la busqueda en MenuBrowser: si no, apagar
 * los seis sabores de "Premium" dejaria la tarjeta con su titulo y su precio
 * pero sin un solo renglon debajo.
 */
export function podarParaPublico(groups: MenuGroup[]): MenuGroup[] {
  return groups
    .filter(visible)
    .map((group) => ({
      ...group,
      screens: group.screens
        .filter(visible)
        .map((screen) => ({
          ...screen,
          categories: screen.categories
            .filter(visible)
            .map((category) => ({
              ...category,
              items: category.items.filter((item) =>
                typeof item === "string" ? true : visible(item),
              ),
            }))
            .filter((category) => category.items.length > 0),
        }))
        .filter((screen) => screen.categories.length > 0),
    }))
    .filter((group) => group.screens.length > 0);
}
