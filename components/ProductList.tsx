"use client";

import { Sparkles, Heart } from "lucide-react";

import { toMenuItem, type ItemTag, type MenuItemInput } from "@/data/types";
import type { AccentTokens } from "@/lib/accents";
import { formatPrice } from "@/lib/format";
import { normalizar } from "@/lib/layout";

interface ProductListProps {
  items: MenuItemInput[];
  /**
   * Ancho MINIMO de una columna (cualquier unidad CSS). El navegador mete
   * tantas como quepan: `9.5rem` da dos columnas en un celular y cuatro en un
   * monitor, sin que nadie tenga que calcular nada.
   */
  columnWidth: string;
  accent: AccentTokens;
  /** Tamano de letra de los nombres, normalmente un `clamp()`. */
  fontSize: string;
  /** Texto buscado, para resaltarlo dentro del nombre. */
  highlight?: string;
}

const iconos: Record<ItemTag, typeof Sparkles> = {
  nuevo: Sparkles,
  favorito: Heart,
};

const etiquetas: Record<ItemTag, string> = {
  nuevo: "Nuevo",
  favorito: "Favorito",
};

/**
 * Lista de productos de una categoria.
 *
 * Usa columnas de CSS (`column-width`), no una rejilla: el orden de lectura
 * queda vertical —se baja por una columna y se sigue por la siguiente, como en
 * una carta impresa— y ademas el numero de columnas lo decide el navegador
 * segun el ancho real del aparato. Con una rejilla habria que saber de antemano
 * cuantas caben, que es justo lo que no se puede saber cuando la misma pagina
 * se abre en un celular y en un monitor.
 */
export function ProductList({
  items,
  columnWidth,
  accent,
  fontSize,
  highlight,
}: ProductListProps) {
  const normalizados = items.map(toMenuItem);

  return (
    <ul
      className="[&>li]:break-inside-avoid"
      style={{
        columnWidth,
        columnGap: "1.5rem",
        // Sin esto, una lista de dos columnas puede repartirse 12 y 2.
        columnFill: "balance",
      }}
    >
      {normalizados.map((item) => {
        const Icono = item.tag ? iconos[item.tag] : null;

        return (
          <li
            key={item.name}
            className="flex items-start gap-2.5 py-[0.3em]"
            style={{ fontSize }}
          >
            {/* La vineta se alinea con la PRIMERA linea: si el nombre se parte
                en dos, la segunda queda sangrada debajo del texto. */}
            <span
              aria-hidden="true"
              className="mt-[0.5em] size-[0.42em] shrink-0 rounded-full"
              style={{ backgroundColor: accent.base }}
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2">
                <span
                  className="font-[family-name:var(--font-body)] font-medium text-tinta"
                  style={{ lineHeight: 1.26 }}
                >
                  <Resaltado texto={item.name} consulta={highlight} />
                  {/* La insignia va DENTRO del nombre para que se quede pegada
                      a la ultima palabra aunque el nombre ocupe dos lineas. */}
                  {Icono && item.tag ? (
                    <span
                      className="ml-1.5 inline-flex translate-y-[0.14em] items-center justify-center rounded-full p-[0.18em] align-baseline"
                      style={{ backgroundColor: accent.base }}
                      title={etiquetas[item.tag]}
                    >
                      <Icono
                        size="0.62em"
                        strokeWidth={2.4}
                        style={{ color: accent.onBase }}
                        aria-label={etiquetas[item.tag]}
                      />
                    </span>
                  ) : null}
                </span>

                {item.note ? (
                  <span className="mt-[0.2em] text-[0.76em] font-semibold whitespace-nowrap text-tinta-suave">
                    {item.note}
                  </span>
                ) : null}

                {/* Precio propio del renglon: se alinea a la derecha, como en
                    una carta impresa. */}
                {item.price !== undefined ? (
                  <span
                    className="ml-auto font-[family-name:var(--font-body)] font-semibold tabular-nums whitespace-nowrap text-tinta"
                    style={{ lineHeight: 1.26 }}
                  >
                    {formatPrice(item.price)}
                  </span>
                ) : null}
              </div>

              {/* Ingredientes de las combinaciones */}
              {item.description ? (
                <p className="mt-[0.15em] text-[0.7em] leading-[1.35] font-light text-tinta-suave">
                  <Resaltado texto={item.description} consulta={highlight} />
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Marca en amarillo de marca el tramo que coincide con la busqueda.
 *
 * Sin esto, buscar "coco" devuelve treinta renglones y hay que releerlos uno a
 * uno para ver por que aparecen: unos lo llevan en el nombre y otros escondido
 * entre los ingredientes.
 */
function Resaltado({ texto, consulta }: { texto: string; consulta?: string }) {
  if (!consulta) return <>{texto}</>;

  // El texto puede llevar acentos y la consulta no ("platano" → "Plátano"). Se
  // compara sobre la misma copia normalizada que usa el filtro, que conserva la
  // longitud del original; asi los indices valen tal cual sobre el texto real.
  const plano = normalizar(texto);

  // Red de seguridad: si por algun caracter raro la copia cambiara de largo,
  // se pinta el texto sin marcar antes que marcarlo en el sitio equivocado.
  if (plano.length !== texto.length) return <>{texto}</>;

  const partes: Array<{ texto: string; marcado: boolean }> = [];
  let desde = 0;

  for (
    let encontrado = plano.indexOf(consulta);
    encontrado !== -1;
    encontrado = plano.indexOf(consulta, desde)
  ) {
    if (encontrado > desde) {
      partes.push({ texto: texto.slice(desde, encontrado), marcado: false });
    }
    partes.push({
      texto: texto.slice(encontrado, encontrado + consulta.length),
      marcado: true,
    });
    desde = encontrado + consulta.length;
  }

  if (partes.length === 0) return <>{texto}</>;
  if (desde < texto.length) {
    partes.push({ texto: texto.slice(desde), marcado: false });
  }

  return (
    <>
      {partes.map((parte, indice) =>
        parte.marcado ? (
          <mark
            key={indice}
            className="rounded-[0.2em] bg-amarillo/70 px-[0.1em] text-inherit"
          >
            {parte.texto}
          </mark>
        ) : (
          <span key={indice}>{parte.texto}</span>
        ),
      )}
    </>
  );
}
