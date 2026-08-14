"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

import type { MenuGroup } from "@/data/types";
import { cx } from "@/lib/format";

interface MenuNavProps {
  groups: MenuGroup[];
  /** Slug del menu que se esta viendo. */
  activo: string | null;
  consulta: string;
  onConsulta: (valor: string) => void;
  /** Cuantos productos deja pasar la busqueda. Solo se usa al buscar. */
  resultados: number;
}

/**
 * Barra de menus pegajosa.
 *
 * Es lo que sustituye al autoplay. En un televisor tenia sentido que las cartas
 * se pasaran solas cada doce segundos, porque el cliente mira de lejos y no
 * puede tocar nada. En un celular esa misma idea es una tortura: quien busca el
 * precio de un frozen yogurt no va a esperar a que le toque el turno. Aqui
 * estan todos los menus a un toque, y la barra sigue al dedo mientras baja.
 */
export function MenuNav({
  groups,
  activo,
  consulta,
  onConsulta,
  resultados,
}: MenuNavProps) {
  const filaRef = useRef<HTMLDivElement>(null);
  const buscadorRef = useRef<HTMLInputElement>(null);
  const [desbordado, setDesbordado] = useState(false);

  /*
   * ¿Se sale la fila de menus del ancho disponible?
   * Solo entonces se le pone el degradado del borde derecho. En una computadora
   * los siete menus caben de sobra, y ahi el degradado se comeria el ultimo sin
   * ningun motivo.
   */
  useEffect(() => {
    const fila = filaRef.current;
    if (!fila) return;

    const medir = () =>
      setDesbordado(fila.scrollWidth > fila.clientWidth + 1);

    medir();

    const observer = new ResizeObserver(medir);
    observer.observe(fila);
    return () => observer.disconnect();
  }, [groups.length]);

  /*
   * Arrastra la fila hasta el menu activo.
   * Con siete menus, en un celular solo se ven tres a la vez: sin esto, al
   * bajar hasta Blizz la barra seguiria marcando algo que quedo fuera de
   * cuadro y pareceria que no hace nada.
   */
  useEffect(() => {
    const fila = filaRef.current;
    if (!fila || !activo) return;

    const chip = fila.querySelector<HTMLElement>(`[data-slug="${activo}"]`);
    if (!chip) return;

    const desplazamiento =
      chip.offsetLeft - fila.clientWidth / 2 + chip.clientWidth / 2;

    fila.scrollTo({
      left: Math.max(0, desplazamiento),
      behavior: "smooth",
    });
  }, [activo]);

  const buscando = consulta.length > 0;
  // En la pagina de un solo menu no hay a donde saltar: queda el buscador.
  const conFila = groups.length > 1;

  return (
    <div className="vidrio-barra sticky top-0 z-40">
      <div
        className={cx(
          "mx-auto flex h-[var(--alto-nav)] w-full max-w-6xl items-center gap-2 px-3 sm:gap-3 sm:px-6 lg:px-8",
          !conFila && "justify-center",
        )}
      >
        {/* La fila de menus se arrastra con el dedo; el buscador se queda fijo
            a la derecha para que no se pierda al desplazarla. */}
        <div
          ref={filaRef}
          className={cx(
            "sin-barra-scroll -mx-1 flex min-w-0 flex-1 items-center gap-2 overflow-x-auto px-1 py-2",
            !conFila && "hidden",
          )}
          style={
            desbordado
              ? {
                  // Difumina el borde derecho: asi se entiende que quedan mas
                  // menus por ver en vez de parecer que uno esta cortado.
                  maskImage:
                    "linear-gradient(to right, #000 0, #000 calc(100% - 2rem), transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to right, #000 0, #000 calc(100% - 2rem), transparent 100%)",
                }
              : undefined
          }
        >
          {groups.map((group) => (
            <a
              key={group.slug}
              href={`#${group.slug}`}
              data-slug={group.slug}
              aria-current={activo === group.slug ? "true" : undefined}
              className={cx(
                "shrink-0 rounded-full px-3.5 py-2 text-[0.8rem] font-medium whitespace-nowrap transition-colors duration-300 sm:px-4 sm:text-[0.95rem]",
                activo === group.slug
                  ? "bg-morado text-white shadow-[var(--shadow-pildora)]"
                  : "bg-white/70 text-tinta hover:bg-white",
              )}
              style={
                activo === group.slug
                  ? undefined
                  : { border: "1px solid rgb(147 113 176 / 0.22)" }
              }
            >
              {group.label}
            </a>
          ))}
        </div>

        {/*
          Con mas de doscientos sabores repartidos en siete cartas, encontrar
          "Nutella" a ojo obliga a recorrerlas todas.

          En el celular el campo va estrecho para no comerle sitio a los menus,
          y se ensancha solo al tocarlo (`focus-within`, sin estado en React ni
          un boton que abra y cierre nada).
        */}
        <div
          className={cx(
            "flex shrink-0 items-center gap-1.5 overflow-hidden rounded-full bg-white/80 px-3 py-2 transition-[width] duration-300",
            buscando ? "w-36" : "w-[6.5rem] focus-within:w-40",
            "sm:w-52 sm:focus-within:w-60",
          )}
          style={{ border: "1px solid rgb(147 113 176 / 0.22)" }}
        >
          <Search
            size={17}
            strokeWidth={2.2}
            className="shrink-0 text-morado"
            aria-hidden="true"
          />
          <input
            ref={buscadorRef}
            type="search"
            value={consulta}
            onChange={(evento) => onConsulta(evento.target.value)}
            placeholder="Buscar"
            aria-label="Buscar un sabor o ingrediente"
            className="min-w-0 flex-1 bg-transparent text-[0.85rem] text-tinta outline-none placeholder:text-tinta-suave/70 [&::-webkit-search-cancel-button]:hidden"
          />
          {buscando ? (
            <button
              type="button"
              onClick={() => {
                onConsulta("");
                buscadorRef.current?.focus();
              }}
              aria-label="Borrar la búsqueda"
              className="shrink-0 rounded-full p-0.5 text-tinta-suave transition-colors hover:text-tinta"
            >
              <X size={16} strokeWidth={2.4} />
            </button>
          ) : null}
        </div>
      </div>

      {/* Recuento de la busqueda: sin esto, no queda claro si un menu esta
          vacio porque no hay coincidencias o porque aun no tiene productos. */}
      {buscando ? (
        <div className="mx-auto w-full max-w-6xl px-4 pb-2 sm:px-6 lg:px-8">
          <p className="text-[0.75rem] font-medium text-tinta-suave sm:text-sm">
            {resultados === 0
              ? `Sin resultados para “${consulta}”`
              : `${resultados} ${resultados === 1 ? "producto" : "productos"} con “${consulta}”`}
          </p>
        </div>
      ) : null}
    </div>
  );
}
