import type { Contenido } from "@/lib/contenido";

/**
 * Registro de modulos del panel.
 *
 * Esta es la pieza que evita rediseniar el panel cada vez que aparece algo
 * nuevo que administrar: un modulo se declara AQUI y solo aqui, y con eso ya
 * sale en la portada como tarjeta y en la barra de navegacion, con su icono,
 * su descripcion y su recuento. Anadir "Promociones" el dia de manana es
 * escribir una entrada en esta lista y una pagina en su carpeta.
 *
 * El recuento se calcula sobre el contenido real, no se escribe a mano. Un
 * numero que hay que acordarse de actualizar es un numero que acaba mintiendo,
 * y en una portada que se mira de un vistazo, mentir es peor que no decir.
 */

export interface Recuento {
  /** Numero grande de la tarjeta. */
  valor: number;
  /** Que son esos elementos: "productos", "categorias"... */
  unidad: string;
  /** Segunda linea, para matizar: "225 visibles", "5 con insignia". */
  detalle?: string;
  /** Algo que pide atencion, en tono de aviso. */
  alerta?: string;
}

export interface Modulo {
  /** Ultimo tramo de la URL dentro de /admin. Vacio para la portada. */
  slug: string;
  nombre: string;
  /** Emoji del modulo. Se lee mas rapido que un icono de trazo a tamanio pequenio. */
  icono: string;
  /** Una linea que diga que se administra aqui, sin tecnicismos. */
  descripcion: string;
  /**
   * Que parte de la carta toca. Se enseña dentro del modulo para responder de
   * inmediato a "¿que estoy administrando y que puedo cambiar?".
   */
  alcance: string;
  /** Recuento para la tarjeta de la portada. Sin esto, la tarjeta no lo pinta. */
  contar?: (contenido: Contenido) => Recuento;
}

/** Recorre todos los productos de la carta. */
export function* productos(contenido: Contenido) {
  for (const grupo of contenido.groups) {
    for (const bloque of grupo.screens) {
      for (const categoria of bloque.categories) {
        for (const item of categoria.items) {
          const producto = typeof item === "string" ? { name: item } : item;
          yield { producto, categoria, bloque, grupo };
        }
      }
    }
  }
}

export const MODULOS: Modulo[] = [
  {
    slug: "portada",
    nombre: "Portada",
    icono: "🏠",
    descripcion: "Lo primero que ve quien escanea el código QR.",
    alcance: "El logo, el subtítulo de la marca y la frase de bienvenida.",
    contar: () => ({ valor: 3, unidad: "elementos", detalle: "logo, subtítulo y bienvenida" }),
  },
  {
    slug: "categorias",
    nombre: "Categorías",
    icono: "📂",
    descripcion: "Los menús de la carta, su orden y su foto.",
    alcance:
      "Cada menú (Bobas, Frozen Yogurt…), el orden en que aparecen y las tarjetas de dentro.",
    contar: (contenido) => {
      const total = contenido.groups.length;
      const visibles = contenido.groups.filter((g) => g.active !== false).length;
      const sinFoto = contenido.groups.filter(
        (g) => !g.image && g.screens.some((s) => s.categories.length > 0),
      ).length;

      return {
        valor: total,
        unidad: total === 1 ? "categoría" : "categorías",
        detalle: `${visibles} visibles en la carta`,
        alerta: sinFoto > 0 ? `${sinFoto} sin foto` : undefined,
      };
    },
  },
  {
    slug: "productos",
    nombre: "Productos",
    icono: "🍔",
    descripcion: "Todos los sabores y bebidas, con sus precios.",
    alcance: "Nombre, precio, ingredientes, categoría, insignia y disponibilidad.",
    contar: (contenido) => {
      let total = 0;
      let visibles = 0;
      for (const { producto } of productos(contenido)) {
        total++;
        if (producto.active !== false) visibles++;
      }

      const ocultos = total - visibles;
      return {
        valor: total,
        unidad: total === 1 ? "producto" : "productos",
        detalle: `${visibles} disponibles`,
        alerta: ocultos > 0 ? `${ocultos} sin disponibilidad` : undefined,
      };
    },
  },
  {
    slug: "destacados",
    nombre: "Destacados",
    icono: "⭐",
    descripcion: "Los que llevan insignia de nuevo o favorito.",
    alcance:
      "Qué productos llevan insignia de novedad o de favorito junto a su nombre.",
    contar: (contenido) => {
      let nuevos = 0;
      let favoritos = 0;
      for (const { producto } of productos(contenido)) {
        if (producto.tag === "nuevo") nuevos++;
        if (producto.tag === "favorito") favoritos++;
      }

      const total = nuevos + favoritos;
      return {
        valor: total,
        unidad: total === 1 ? "destacado" : "destacados",
        detalle: `${nuevos} nuevos · ${favoritos} favoritos`,
      };
    },
  },
  {
    slug: "imagenes",
    nombre: "Imágenes",
    icono: "🖼️",
    descripcion: "Las fotos del sitio y dónde se usa cada una.",
    alcance: "El logo, el fondo de marca y la foto que encabeza cada menú.",
    contar: (contenido) => {
      const deMenus = contenido.groups.filter((g) => g.image).length;
      return {
        valor: deMenus + 2,
        unidad: "imágenes",
        detalle: `${deMenus} de menús · logo y fondo`,
      };
    },
  },
  {
    slug: "apariencia",
    nombre: "Apariencia",
    icono: "🎨",
    descripcion: "Los colores y las letras de la marca.",
    alcance: "La paleta de acentos, las tipografías y el logo.",
    contar: () => ({ valor: 5, unidad: "colores", detalle: "2 tipografías" }),
  },
  {
    slug: "configuracion",
    nombre: "Configuración",
    icono: "⚙️",
    descripcion: "Datos del negocio, redes y contacto.",
    alcance: "Nombre de la marca, subtítulo, redes sociales, teléfono y la firma del pie.",
    contar: (contenido) => ({
      valor: contenido.site.footer.networks.length,
      unidad: "redes",
      detalle: contenido.site.footer.handle,
    }),
  },
];

/** El modulo que corresponde a una ruta, para saber donde esta uno parado. */
export function moduloDe(slug: string): Modulo | undefined {
  return MODULOS.find((modulo) => modulo.slug === slug);
}
