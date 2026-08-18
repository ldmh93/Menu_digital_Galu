/**
 * Configuracion global del menu.
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
  /**
   * Orden en que aparecen los menus en la pagina (slugs de /data/menus.ts).
   * Los menus sin productos cargados se saltan automaticamente.
   */
  playlist: string[];
  /** Redes sociales y frase de marca. */
  footer: {
    /** Usuario, el mismo en todas las redes. */
    handle: string;
    /** Redes donde existe ese usuario. Decide que iconos se pintan. */
    networks: SocialNetwork[];
    message: string;
  };
  /** Firma de quien desarrolla el sitio. Va en la ultima linea de la pagina. */
  credits: {
    studio: string;
    tagline: string;
    /** Solo digitos, como se marca en Mexico. */
    phone: string;
    /** Prefijo internacional para los enlaces `tel:` y de WhatsApp. */
    phoneCountryCode: string;
  };
}

/** Redes con icono disponible en el pie. */
export type SocialNetwork = "instagram" | "facebook" | "tiktok";

export const site: SiteConfig = {
  brand: "GALU",
  subtitle: "Frozen Yogurt & Bobas",
  logo: "/logo.png",
  background: "/background.svg",
  // Vacia: solo Bobas la declara, en data/bobas.ts.
  preparation: "",
  /*
   * Orden de la carta. Frozen Yogurt y Bobas van primero porque son el
   * producto principal del negocio — es lo que dice el propio subtitulo de la
   * marca. En una pagina que se recorre de arriba abajo, el orden ES la
   * jerarquia: lo primero que se ve es lo que mas se pide.
   *
   * Malteadas y Especialidades estan pendientes de datos y se omiten solas.
   */
  playlist: [
    "frozen-yogurt",
    "bobas",
    "ice-rollers",
    "sodas-italianas",
    "blizz",
    "malteadas",
    "especialidades",
  ],
  footer: {
    handle: "@frozen.galu",
    networks: ["instagram", "facebook", "tiktok"],
    message: "Hecho al momento, siempre fresco",
  },
  credits: {
    studio: "Creaciones Luis David",
    tagline: "Soluciones digitales y web",
    phone: "4171279042",
    phoneCountryCode: "52",
  },
};

/** Direccion publica de cada red, a partir del usuario configurado. */
export function socialUrl(network: SocialNetwork): string {
  const user = site.footer.handle.replace(/^@/, "");

  if (network === "facebook") return `https://facebook.com/${user}`;
  if (network === "tiktok") return `https://tiktok.com/@${user}`;
  return `https://instagram.com/${user}`;
}

/** Telefono en formato internacional, sin espacios: +524171279042 */
export function phoneE164(): string {
  return `+${site.credits.phoneCountryCode}${site.credits.phone}`;
}

/** Telefono agrupado para leerlo de un vistazo: 417 127 9042 */
export function phoneLegible(): string {
  return site.credits.phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");
}
