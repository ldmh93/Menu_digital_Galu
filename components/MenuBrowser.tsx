"use client";

import { useEffect, useMemo, useState } from "react";

import type { MenuGroup } from "@/data/types";
import { coincide, normalizar } from "@/lib/layout";
import { BackToTop } from "./BackToTop";
import { MenuNav } from "./MenuNav";
import { MenuSection } from "./MenuSection";

interface MenuBrowserProps {
  groups: MenuGroup[];
}

/**
 * La carta completa: barra de menus, busqueda y todos los bloques.
 *
 * Es el unico componente con estado. Los datos son estaticos y no muy grandes
 * (unos doscientos productos), asi que filtrar en el navegador es instantaneo y
 * no hace falta ni servidor ni indice: se recorta el arbol de menus y se pinta
 * lo que queda.
 */
export function MenuBrowser({ groups }: MenuBrowserProps) {
  const [consulta, setConsulta] = useState("");
  const consultaNormalizada = normalizar(consulta.trim());

  /**
   * Menus recortados a lo que coincide con la busqueda.
   *
   * Se filtra de dentro afuera: primero los productos, luego se tiran las
   * categorias que se quedaron sin ninguno y despues los bloques vacios. Asi no
   * queda por ahi una tarjeta "Premium" con el titulo y el precio pero sin un
   * solo sabor debajo.
   */
  const filtrados = useMemo(() => {
    if (!consultaNormalizada) return groups;

    return groups
      .map((group) => ({
        ...group,
        screens: group.screens
          .map((screen) => ({
            ...screen,
            categories: screen.categories
              .map((category) => ({
                ...category,
                items: category.items.filter((item) =>
                  coincide(item, consultaNormalizada),
                ),
              }))
              .filter((category) => category.items.length > 0),
          }))
          .filter((screen) => screen.categories.length > 0),
      }))
      .filter((group) => group.screens.length > 0);
  }, [groups, consultaNormalizada]);

  const resultados = useMemo(
    () =>
      filtrados.reduce(
        (total, group) =>
          total +
          group.screens.reduce(
            (porMenu, screen) =>
              porMenu +
              screen.categories.reduce(
                (porBloque, category) => porBloque + category.items.length,
                0,
              ),
            0,
          ),
        0,
      ),
    [filtrados],
  );

  const activo = useMenuVisible(
    groups.map((group) => group.slug),
    groups.length > 1,
  );

  return (
    <>
      <MenuNav
        groups={groups}
        activo={activo}
        consulta={consulta}
        onConsulta={setConsulta}
        resultados={resultados}
      />

      <div>
        {filtrados.map((group, indice) => (
          <MenuSection
            key={group.slug}
            group={group}
            highlight={consultaNormalizada || undefined}
            buscando={Boolean(consultaNormalizada)}
            // Solo la foto del primer menu entra en la primera pantalla; las
            // demas se cargan cuando toca, sin competir por el ancho de banda.
            primerMenu={indice === 0}
          />
        ))}

        {consultaNormalizada && filtrados.length === 0 ? (
          <SinResultados consulta={consulta} onLimpiar={() => setConsulta("")} />
        ) : null}
      </div>

      <BackToTop />
    </>
  );
}

/**
 * Slug del menu que se esta leyendo ahora mismo.
 *
 * Gana el ultimo menu cuyo titulo ya cruzo la linea del primer cuarto de
 * pantalla. Es lo que hace que funcione igual bajando que subiendo, y evita el
 * retraso de "el primero que se vea": al llegar a Bobas la barra seguia
 * marcando Ice Rollers porque su nota al pie todavia asomaba por arriba.
 *
 * Se escucha el scroll en vez de usar un `IntersectionObserver`, aunque suene
 * al reves de lo recomendado. Con secciones mucho mas altas que la pantalla
 * —Bobas mide varios metros de carta— el observador solo avisa al entrar y al
 * salir: entre esos dos momentos hay miles de pixeles de recorrido en los que
 * nunca se le pediria la cuenta. Medir siete rectangulos, y ademas una sola
 * vez por cuadro, no le cuesta nada a ningun telefono.
 */
function useMenuVisible(slugs: string[], activado: boolean): string | null {
  const [activo, setActivo] = useState<string | null>(slugs[0] ?? null);
  const clave = slugs.join("|");

  useEffect(() => {
    if (!activado) return;

    const secciones = clave
      .split("|")
      .map((slug) => document.getElementById(slug))
      .filter((elemento): elemento is HTMLElement => Boolean(elemento));

    if (secciones.length === 0) return;

    let pendiente = 0;

    const recalcular = () => {
      pendiente = 0;
      const linea = window.innerHeight * 0.28;

      let elegido = secciones[0];
      for (const seccion of secciones) {
        if (seccion.getBoundingClientRect().top <= linea) elegido = seccion;
      }

      setActivo((actual) => (actual === elegido.id ? actual : elegido.id));
    };

    const alDesplazar = () => {
      if (pendiente) return;
      pendiente = requestAnimationFrame(recalcular);
    };

    recalcular();
    window.addEventListener("scroll", alDesplazar, { passive: true });
    window.addEventListener("resize", alDesplazar);

    return () => {
      if (pendiente) cancelAnimationFrame(pendiente);
      window.removeEventListener("scroll", alDesplazar);
      window.removeEventListener("resize", alDesplazar);
    };
  }, [clave, activado]);

  return activo;
}

function SinResultados({
  consulta,
  onLimpiar,
}: {
  consulta: string;
  onLimpiar: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center sm:py-28">
      <p className="font-[family-name:var(--font-display)] text-2xl font-semibold text-balance text-tinta sm:text-3xl">
        No encontramos “{consulta}”
      </p>
      <p className="mt-2 text-sm font-light text-balance text-tinta-suave sm:text-base">
        Prueba con otro sabor o pregunta en mostrador: casi siempre hay forma de
        prepararlo.
      </p>
      <button
        type="button"
        onClick={onLimpiar}
        className="mt-6 rounded-full bg-morado px-6 py-2.5 text-sm font-medium text-white transition-transform duration-200 hover:scale-[1.03] sm:text-base"
        style={{ boxShadow: "var(--shadow-pildora)" }}
      >
        Ver toda la carta
      </button>
    </div>
  );
}
