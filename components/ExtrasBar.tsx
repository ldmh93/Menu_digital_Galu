"use client";

import type { MenuExtra } from "@/data/types";
import { formatPrice } from "@/lib/format";

/**
 * Complementos con costo aparte.
 *
 * Vive junto a las tarjetas, no en el pie de la pagina: son una extension del
 * menu ("a lo que acabas de leer le puedes anadir esto"), asi que tienen que
 * leerse como parte del mismo bloque.
 *
 * Son venta adicional, asi que destacan: el nombre en tinta plena y el precio
 * en morado de marca, un punto mas grande. El ojo salta de precio en precio,
 * que es como se lee una lista de complementos.
 */
export function ExtrasBar({ extras }: { extras?: MenuExtra[] }) {
  if (!extras || extras.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
      <span className="mr-0.5 text-[0.65rem] font-semibold tracking-[0.18em] text-morado uppercase sm:text-xs">
        Extras
      </span>
      {extras.map((extra) => (
        <span
          key={extra.name}
          className="inline-flex items-baseline gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[0.8rem] font-medium whitespace-nowrap text-tinta sm:px-4 sm:py-2 sm:text-[0.95rem]"
          style={{
            border: "1px solid rgb(147 113 176 / 0.28)",
            boxShadow: "0 8px 20px -12px rgb(59 42 77 / 0.35)",
          }}
        >
          {extra.name}
          <span className="text-[0.9rem] font-semibold text-morado sm:text-[1.05rem]">
            {formatPrice(extra.price)}
          </span>
        </span>
      ))}
    </div>
  );
}
