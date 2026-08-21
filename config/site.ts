/**
 * Configuracion global del sitio.
 *
 * OJO: el ORDEN de los menus ya no vive aqui. Es contenido editable —se cambia
 * desde el panel— y por tanto esta en data/contenido.json, junto a la carta.
 * Lo que queda aqui es lo que no cambia de un dia para otro: la marca, el
 * fondo y la firma de quien desarrolla.
 *
 * Todo lo editable por el negocio vive aqui o en /data. Cuando exista el panel
 * administrativo, este objeto es lo unico que hay que reemplazar por un fetch:
 *   const site = await getSiteConfig()   // en vez de importar la constante
 */

export interface SiteConfig {
  /** Nombre de la marca (texto alternativo del logo). */
  brand: string;
  /** Subtitulo bajo el logo. Editable sin tocar componentes. */
  subtitle: string;
  /** Ruta del logo dentro de /public. */
  logo: string;
  /** Ruta del fondo oficial dentro de /public. NO modificar el arte. */
  background: string;
  /**
   * Forma de preparacion por defecto, bajo el titulo de los menus.
   *
   * Va vacia a proposito: no todo se sirve latte ni frape, y anunciarlo en
   * un menu donde no aplica confunde al cliente. Cada menu que SI la ofrece la
   * declara en su archivo de `/data` (hoy solo Bobas). Si algun dia la
   * mayoria la ofreciera, se pone aqui y los que no, con `preparation: null`.
   */
  preparation: string;
  /** Redes sociales y frase de marca. */
  footer: {
    /** Usuario, el mismo en todas las redes. */
    handle: string;
    /** Redes donde existe ese usuario. Decide que iconos se pintan. */
    networks: SocialNetwork[];
    message: string;
  };
}

/** Redes con icono disponible en el pie. */
export type SocialNetwork = "instagram" | "facebook" | "tiktok";

export const site: SiteConfig = {
  brand: "GALU",
  subtitle: "Frozen Yogurt & Bobas",
  logo: "/logo.png",
  background: "/background.svg",
  // Vacia: solo Bobas la declara, en su bloque de data/contenido.json.
  preparation: "",
  footer: {
    handle: "@frozen.galu",
    networks: ["instagram", "facebook", "tiktok"],
    message: "Hecho al momento, siempre fresco",
  },
};

/**
 * Firma de quien desarrolla el sitio.
 *
 * Vive aparte del contenido editable Y FUERA DEL PANEL a proposito. No es un
 * dato del negocio que cambie con la temporada, como los precios o las redes:
 * es la autoria del trabajo. Para cambiarla hay que tocar este archivo, que es
 * justo la barrera que se busca — no se puede borrar desde una pantalla de
 * administracion, ni por descuido ni queriendo.
 */
export const credits = {
  studio: "Creaciones Luis David",
  tagline: "Soluciones digitales y web",
  /** Solo digitos, como se marca en Mexico. */
  phone: "4171279042",
  /** Prefijo internacional para los enlaces `tel:` y de WhatsApp. */
  phoneCountryCode: "52",
} as const;

/** Direccion publica de cada red, a partir del usuario configurado. */
export function socialUrl(network: SocialNetwork): string {
  const user = site.footer.handle.replace(/^@/, "");

  if (network === "facebook") return `https://facebook.com/${user}`;
  if (network === "tiktok") return `https://tiktok.com/@${user}`;
  return `https://instagram.com/${user}`;
}

/** Telefono en formato internacional, sin espacios: +524171279042 */
export function phoneE164(): string {
  return `+${credits.phoneCountryCode}${credits.phone}`;
}

/** Telefono agrupado para leerlo de un vistazo: 417 127 9042 */
export function phoneLegible(): string {
  return credits.phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");
}
