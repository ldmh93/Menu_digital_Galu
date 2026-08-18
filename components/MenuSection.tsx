"use client";

import { motion } from "framer-motion";

import { site } from "@/config/site";
import type { MenuGroup, MenuScreen } from "@/data/types";
import {
  clasesRejilla,
  clasesRejillaSecundaria,
  comunesDelGrupo,
  resolveLayout,
} from "@/lib/layout";
import { alEntrarEnPantalla, entradaAlAparecer } from "@/lib/motion";
import { CategoryCard } from "./CategoryCard";
import { ExtrasBar } from "./ExtrasBar";

interface MenuSectionProps {
  group: MenuGroup;
  /** Texto buscado. Los bloques ya llegan filtrados; esto es solo para marcar. */
  highlight?: string;
  /** Oculta la nota "pendiente" cuando se esta buscando. */
  buscando?: boolean;
}

/**
 * Un menu completo dentro de la pagina: titulo, sus bloques y sus extras.
 *
 * En la version de televisor cada bloque era una pantalla independiente que se
 * veia doce segundos y se iba, asi que cada una repetia el titulo, la forma de
 * preparacion, la nota al pie y las pastillas de extras. Aqui los cinco bloques
 * de Bobas se recorren de un tiron, y repetir cinco veces "Todas disponibles en
 * 16 y 24 oz" solo estorba: lo que es igual en todos se dice una vez.
 */
export function MenuSection({ group, highlight, buscando }: MenuSectionProps) {
  const conCategorias = group.screens.filter(
    (screen) => screen.categories.length > 0,
  );
  const comunes = comunesDelGrupo(group.screens);
  const [primero] = group.screens;

  // La preparacion ("Latte o Frape") es del menu entero, no de cada bloque.
  const preparacion =
    primero?.preparation === undefined ? site.preparation : primero.preparation;

  return (
    <section
      id={group.slug}
      aria-labelledby={`titulo-${group.slug}`}
      className="scroll-mt-[calc(var(--alto-nav)+0.75rem)] px-4 py-10 sm:px-6 sm:py-14 lg:px-8"
    >
      <div className="mx-auto w-full max-w-6xl">
        <TituloMenu
          id={`titulo-${group.slug}`}
          title={primero?.title ?? group.label}
          preparation={preparacion}
          tagline={primero?.tagline}
        />

        {conCategorias.length === 0 ? (
          buscando ? null : (
            <Pendiente />
          )
        ) : (
          <div className="mt-8 flex flex-col gap-10 sm:mt-10 sm:gap-14">
            {conCategorias.map((screen) => (
              <BloqueDeMenu
                key={screen.slug}
                screen={screen}
                highlight={highlight}
                // Lo que ya se dice una vez para todo el menu no se repite.
                ocultarFootnote={Boolean(comunes.footnote)}
                ocultarExtras={Boolean(comunes.extras)}
              />
            ))}
          </div>
        )}

        {/* Nota y extras comunes a todos los bloques: una sola vez, al final. */}
        {conCategorias.length > 0 && (comunes.footnote || comunes.extras) ? (
          <div className="mt-9 flex flex-col items-center gap-4 sm:mt-12">
            {comunes.extras ? <ExtrasBar extras={comunes.extras} /> : null}
            {comunes.footnote ? <Nota texto={comunes.footnote} /> : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

/**
 * Titulo del menu. Es el ancla visual: tipografia display muy grande,
 * ornamento minimo y mucho aire alrededor.
 *
 * Jerarquia:
 *   1. Producto     — "Bobas"                Fredoka SemiBold, ciruela
 *   2. Preparacion  — "Latte o Frape"        en pastilla
 *   3. Detalle      — frase corta            Poppins Light
 *
 * El nivel de "seccion" ("Combinaciones · Agua") ya no vive aqui: ahora
 * encabeza cada bloque, que es donde de verdad separa una lista de otra.
 */
function TituloMenu({
  id,
  title,
  preparation,
  tagline,
}: {
  id: string;
  title: string;
  preparation?: string | null;
  tagline?: string;
}) {
  return (
    <motion.div
      variants={entradaAlAparecer}
      initial="oculto"
      whileInView="visible"
      viewport={alEntrarEnPantalla}
      className="flex flex-col items-center text-center"
    >
      <h2
        id={id}
        className="font-[family-name:var(--font-display)] font-semibold text-balance text-tinta"
        style={{
          fontSize: "clamp(2.1rem, 1.5rem + 3.2vw, 4.25rem)",
          lineHeight: 1.04,
          letterSpacing: "-0.015em",
        }}
      >
        {title}
      </h2>

      <div className="mt-3 flex items-center gap-3 sm:mt-4 sm:gap-4" aria-hidden="true">
        <span className="h-[3px] w-12 rounded-full bg-[#f7bfd9] sm:w-16" />
        <span className="size-2 rounded-full bg-[#9371b0]/70 sm:size-2.5" />
        <span className="h-[3px] w-12 rounded-full bg-[#9dd2c5] sm:w-16" />
      </div>

      {/*
        Preparacion: es una opcion de servicio, no un nombre de producto, asi
        que va en pastilla y no como texto suelto. La pastilla la separa de la
        jerarquia de titulos de un vistazo.
      */}
      {preparation ? (
        <p
          className="mt-3 rounded-full px-4 py-1 text-[0.8rem] font-medium whitespace-nowrap text-[#6b4b8a] sm:mt-4 sm:px-5 sm:text-[0.95rem]"
          style={{
            background: "rgb(255 255 255 / 0.7)",
            border: "1px solid rgb(147 113 176 / 0.22)",
          }}
        >
          {preparation}
        </p>
      ) : null}

      {tagline ? (
        <p className="mt-3 max-w-md text-sm font-light text-balance text-tinta-suave sm:text-base">
          {tagline}
        </p>
      ) : null}
    </motion.div>
  );
}

/** Un bloque del menu: su etiqueta de seccion y sus tarjetas. */
function BloqueDeMenu({
  screen,
  highlight,
  ocultarFootnote,
  ocultarExtras,
}: {
  screen: MenuScreen;
  highlight?: string;
  ocultarFootnote: boolean;
  ocultarExtras: boolean;
}) {
  return (
    <div>
      {screen.section ? (
        <motion.h3
          variants={entradaAlAparecer}
          initial="oculto"
          whileInView="visible"
          viewport={alEntrarEnPantalla}
          className="mb-4 text-center font-[family-name:var(--font-display)] font-medium text-balance text-[#6b4b8a] sm:mb-6"
          style={{
            fontSize: "clamp(1.15rem, 0.98rem + 0.85vw, 1.85rem)",
            lineHeight: 1.15,
          }}
        >
          {screen.section}
        </motion.h3>
      ) : null}

      <Tarjetas screen={screen} highlight={highlight} />

      {!ocultarExtras && screen.extras?.length ? (
        <div className="mt-6">
          <ExtrasBar extras={screen.extras} />
        </div>
      ) : null}

      {!ocultarFootnote && screen.footnote ? (
        <div className="mt-5 flex justify-center">
          <Nota texto={screen.footnote} />
        </div>
      ) : null}
    </div>
  );
}

/**
 * Reparto de las tarjetas.
 *
 * `feature` reserva una tarjeta ancha arriba y reparte el resto debajo; las
 * demas son una sola rejilla. En el celular todo cae a una columna: el reparto
 * solo entra cuando la pantalla da de si.
 */
function Tarjetas({
  screen,
  highlight,
}: {
  screen: MenuScreen;
  highlight?: string;
}) {
  const layout = resolveLayout(screen.layout, screen.categories);

  if (layout === "feature" && screen.categories.length > 1) {
    const [principal, ...secundarias] = screen.categories;

    return (
      <div className="flex flex-col gap-5 sm:gap-6">
        <CategoryCard
          category={principal}
          emphasis="hero"
          highlight={highlight}
        />

        <div className={clasesRejillaSecundaria(secundarias.length)}>
          {secundarias.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              highlight={highlight}
            />
          ))}
        </div>
      </div>
    );
  }

  const esUnica = screen.categories.length === 1;

  return (
    <div className={clasesRejilla(layout)}>
      {screen.categories.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          emphasis={esUnica ? "hero" : "normal"}
          highlight={highlight}
        />
      ))}
    </div>
  );
}

/** Nota al pie del menu ("Todos incluyen 2 toppings a elegir"). */
function Nota({ texto }: { texto: string }) {
  return (
    <p className="max-w-xl text-center text-[0.85rem] leading-snug font-medium text-balance text-tinta sm:text-base">
      {texto}
    </p>
  );
}

/** Estado de un menu que aun no tiene datos cargados. */
function Pendiente() {
  return (
    <motion.div
      variants={entradaAlAparecer}
      initial="oculto"
      whileInView="visible"
      viewport={alEntrarEnPantalla}
      className="vidrio brillo-superior mx-auto mt-8 flex max-w-md flex-col items-center rounded-[1.75rem] px-8 py-9 text-center sm:rounded-[2.25rem] sm:px-12 sm:py-11"
      style={{ boxShadow: "var(--shadow-tarjeta)" }}
    >
      <span className="font-[family-name:var(--font-display)] text-2xl font-semibold text-tinta sm:text-3xl">
        Muy pronto
      </span>
      <span className="mt-2 text-sm font-light text-balance text-tinta-suave sm:text-base">
        Pregunta en mostrador por nuestras opciones
      </span>
    </motion.div>
  );
}
