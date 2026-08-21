import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Subida de imagenes desde el panel.
 *
 * Guarda el archivo en /public y averigua sus medidas, que hacen falta para
 * reservarle el hueco en la carta y que la pagina no de un salto al cargar.
 *
 * Lo que aqui NO se hace es recortar ni comprimir: eso necesita decodificar la
 * imagen, y para eso haria falta una dependencia nativa (sharp) que complica
 * la instalacion del proyecto entero por una operacion que se hace cuatro
 * veces al anio. En su lugar se AVISA cuando el archivo pesa de mas y se
 * apunta al script que ya hace ese trabajo bien:
 *
 *   node scripts/preparar-imagenes.cjs
 */

const PUBLICO = path.join(process.cwd(), "public");
const CARPETA = "categorias";

/** Lo que se acepta subir. */
const TIPOS: Record<string, string> = {
  "image/png": "png",
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/avif": "avif",
};

/**
 * Peso a partir del cual se avisa.
 *
 * 400 KB es de sobra para una foto que se pinta a 320 px de alto. Por encima
 * de eso, quien abre la carta con datos moviles lo paga en segundos de espera.
 */
const PESO_AVISO = 400 * 1024;

export interface ImagenGuardada {
  /** Ruta publica, la que va en el contenido: "/categorias/bobas.webp". */
  ruta: string;
  ancho: number;
  alto: number;
  ratio: number;
  /** Mensaje para quien acaba de subirla, si hay algo que decirle. */
  aviso?: string;
}

/**
 * Medidas de una imagen leyendo solo su cabecera.
 *
 * Cada formato guarda el tamanio en un sitio distinto de los primeros bytes,
 * asi que se leen a mano en vez de decodificar el archivo entero: son tres
 * casos conocidos y evita arrastrar una libreria de imagenes al servidor.
 */
export function medidasDeImagen(datos: Buffer): { ancho: number; alto: number } {
  // PNG: firma de 8 bytes y luego el chunk IHDR con ancho y alto.
  if (datos.length > 24 && datos.toString("hex", 0, 8) === "89504e470d0a1a0a") {
    return { ancho: datos.readUInt32BE(16), alto: datos.readUInt32BE(20) };
  }

  // WebP: contenedor RIFF. Hay tres variantes y cada una lo guarda distinto.
  if (
    datos.length > 30 &&
    datos.toString("ascii", 0, 4) === "RIFF" &&
    datos.toString("ascii", 8, 12) === "WEBP"
  ) {
    const tipo = datos.toString("ascii", 12, 16);

    if (tipo === "VP8X") {
      return {
        ancho: 1 + datos.readUIntLE(24, 3),
        alto: 1 + datos.readUIntLE(27, 3),
      };
    }
    if (tipo === "VP8L") {
      const bits = datos.readUInt32LE(21);
      return {
        ancho: 1 + (bits & 0x3fff),
        alto: 1 + ((bits >> 14) & 0x3fff),
      };
    }
    if (tipo === "VP8 ") {
      return {
        ancho: datos.readUInt16LE(26) & 0x3fff,
        alto: datos.readUInt16LE(28) & 0x3fff,
      };
    }
  }

  // JPEG: hay que recorrer los marcadores hasta dar con el del fotograma.
  if (datos.length > 4 && datos[0] === 0xff && datos[1] === 0xd8) {
    let posicion = 2;
    while (posicion + 9 < datos.length) {
      if (datos[posicion] !== 0xff) {
        posicion++;
        continue;
      }

      const marcador = datos[posicion + 1];
      // SOF0..SOF15, saltando los que no describen el fotograma.
      const esFotograma =
        marcador >= 0xc0 &&
        marcador <= 0xcf &&
        marcador !== 0xc4 &&
        marcador !== 0xc8 &&
        marcador !== 0xcc;

      if (esFotograma) {
        return {
          alto: datos.readUInt16BE(posicion + 5),
          ancho: datos.readUInt16BE(posicion + 7),
        };
      }

      posicion += 2 + datos.readUInt16BE(posicion + 2);
    }
  }

  throw new Error(
    "No se reconoce el formato de la imagen. Usa PNG, WebP o JPG.",
  );
}

/** Nombre de archivo seguro a partir de un texto cualquiera. */
function slugificar(texto: string): string {
  return (
    texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "imagen"
  );
}

/**
 * Guarda la foto de una categoria y devuelve como referenciarla.
 *
 * El nombre lleva una marca de tiempo. Sin ella, sustituir la foto de un menu
 * conservando el nombre haria que el navegador —y el optimizador de Next—
 * siguieran enseniando la vieja durante horas, y quien la acaba de cambiar
 * pensaria que el panel no funciona.
 */
export async function guardarImagenDeMenu(
  archivo: File,
  grupoSlug: string,
): Promise<ImagenGuardada> {
  const extension = TIPOS[archivo.type];
  if (!extension) {
    throw new Error(
      `Formato no admitido (${archivo.type || "desconocido"}). Usa PNG, WebP o JPG.`,
    );
  }

  const datos = Buffer.from(await archivo.arrayBuffer());
  const { ancho, alto } = medidasDeImagen(datos);

  const nombre = `${slugificar(grupoSlug)}-${Date.now()}.${extension}`;
  const destino = path.join(PUBLICO, CARPETA, nombre);

  await fs.mkdir(path.join(PUBLICO, CARPETA), { recursive: true });
  await fs.writeFile(destino, datos);

  const pesaDeMas = datos.length > PESO_AVISO;
  const kb = Math.round(datos.length / 1024);

  return {
    ruta: `/${CARPETA}/${nombre}`,
    ancho,
    alto,
    ratio: ancho / alto,
    aviso: pesaDeMas
      ? `Guardada, pero pesa ${kb} KB y eso se nota en un celular con datos. ` +
        `Para dejarla ligera: pásala por "node scripts/preparar-imagenes.cjs".`
      : undefined,
  };
}

/** Archivos que hay en la carpeta de fotos de categoria. */
export async function listarImagenes(): Promise<
  { ruta: string; peso: number }[]
> {
  const carpeta = path.join(PUBLICO, CARPETA);

  try {
    const nombres = await fs.readdir(carpeta);
    const archivos = await Promise.all(
      nombres
        .filter((nombre) => /\.(png|webp|jpe?g|avif)$/i.test(nombre))
        .map(async (nombre) => {
          const info = await fs.stat(path.join(carpeta, nombre));
          return { ruta: `/${CARPETA}/${nombre}`, peso: info.size };
        }),
    );

    return archivos.sort((a, b) => a.ruta.localeCompare(b.ruta));
  } catch {
    // La carpeta puede no existir todavia; eso no es un error que contar.
    return [];
  }
}

/**
 * Borra una imagen del disco.
 *
 * Quien llama tiene que haber comprobado ANTES que no la usa ningun menu. Una
 * carta con el hueco de una foto que ya no existe es peor que una carta sin
 * foto: el navegador deja el icono de imagen rota en mitad del diseno.
 */
export async function borrarImagen(ruta: string): Promise<void> {
  const nombre = path.basename(ruta);
  const destino = path.join(PUBLICO, CARPETA, nombre);

  // Se comprueba que el resultado siga dentro de la carpeta: sin esto, una
  // ruta con ".." podria salirse y borrar cualquier archivo del proyecto.
  const dentro = path.resolve(destino);
  const raiz = path.resolve(path.join(PUBLICO, CARPETA));
  if (!dentro.startsWith(raiz + path.sep)) {
    throw new Error("Ruta de imagen no válida.");
  }

  await fs.unlink(dentro);
}
