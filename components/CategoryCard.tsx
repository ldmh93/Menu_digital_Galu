"use client";

import { motion } from "framer-motion";

import { toPriceTiers, type MenuCategory, type Price } from "@/data/types";
import { getAccent, type AccentTokens } from "@/lib/accents";
import { cx, formatPrice } from "@/lib/format";
import { anchoColumna, tamanoLista } from "@/lib/layout";
import { alEntrarEnPantalla, entradaAlAparecer } from "@/lib/motion";
import { ProductList } from "./ProductList";

interface CategoryCardProps {
  category: MenuCategory;
  /** Tarjeta protagonista (ocupa todo el ancho) o una mas de la fila. */
  emphasis?: "hero" | "normal";
  /** Texto buscado, para resaltarlo en los productos. */
  highlight?: string;
  className?: string;
}

/**
 * Tarjeta de categoria: titulo, precio y lista de productos.
 * Vidrio muy ligero, esquinas muy redondeadas, sombra difusa y un halo del
 * color de acento por detras. Sin bordes duros ni rejillas tipo tabla.
 */
export function CategoryCard({
  category,
  emphasis = "normal",
  highlight,
  className,
}: CategoryCardProps) {
  const accent = getAccent(category.accent);
  const esHero = emphasis === "hero";

  return (
    <motion.article
      variants={entradaAlAparecer}
      initial="oculto"
      whileInView="visible"
      viewport={alEntrarEnPantalla}
      className={cx("group relative", className)}
    >
      {/* Halo de color detras de la tarjeta. Degradado radial en vez de
          `blur()`: mismo aspecto, sin textura extra en la GPU. */}
      <div
        aria-hidden="true"
        className="absolute -inset-6 opacity-60 sm:-inset-10"
        style={{
          // El degradado muere ANTES del borde del elemento (75 %), asi no se
          // adivina el rectangulo que lo contiene.
          background: `radial-gradient(72% 72% at 50% 50%, ${accent.glow} 0%, transparent 100%)`,
        }}
      />

      <div
        className={cx(
          "vidrio brillo-superior relative flex h-full flex-col overflow-hidden",
          "rounded-[1.75rem] px-5 py-5 sm:rounded-[2.25rem] sm:px-7 sm:py-6",
          esHero && "lg:px-9 lg:py-8",
        )}
        style={{ boxShadow: "var(--shadow-tarjeta)" }}
      >
        {/* Cinta de acento superior */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[4px] sm:h-[6px]"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${accent.base} 22%, ${accent.base} 78%, transparent 100%)`,
          }}
        />

        {/* Lavado de color muy tenue en la esquina superior */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${accent.wash} 0%, transparent 65%)`,
          }}
        />

        {/*
          Cabecera fluida: nombre a la izquierda y precio a la derecha, pero con
          `flex-wrap`. En un celular estrecho un titulo como "Agua, Leche o
          Yogurt" junto a dos pastillas de precio no cabe en una linea; en vez
          de encogerlo hasta lo ilegible (que es lo que hacia la version de
          televisor con su cabecera "apilada"), el precio baja solo a la linea
          siguiente y se queda alineado a la izquierda con el titulo.
        */}
        <header className="relative flex flex-wrap items-start justify-between gap-x-4 gap-y-3 pb-4 sm:pb-5">
          <div className="min-w-0 flex-1 basis-40">
            <h3
              className="font-[family-name:var(--font-display)] font-semibold text-balance text-tinta"
              style={{
                fontSize: esHero
                  ? "clamp(1.4rem, 1.15rem + 1.15vw, 2.1rem)"
                  : "clamp(1.25rem, 1.05rem + 0.9vw, 1.8rem)",
                lineHeight: 1.1,
                letterSpacing: "-0.01em",
              }}
            >
              {category.name}
            </h3>
            {category.description ? (
              <p className="mt-1 text-[0.8rem] leading-snug font-light text-tinta-suave sm:text-[0.95rem]">
                {category.description}
              </p>
            ) : null}
          </div>

          <Precio price={category.price} accent={accent} destacado={esHero} />
        </header>

        {/* Separador degradado, nunca una linea dura */}
        <span
          aria-hidden="true"
          className="relative h-px w-full"
          style={{
            background: `linear-gradient(90deg, ${accent.base} 0%, rgba(59,42,77,0.08) 55%, transparent 100%)`,
          }}
        />

        <div className="relative pt-4 sm:pt-5">
          <ProductList
            items={category.items}
            columnWidth={anchoColumna(category)}
            accent={accent}
            fontSize={tamanoLista(category.items)}
            highlight={highlight}
          />
        </div>
      </div>
    </motion.article>
  );
}

/**
 * Precio de la categoria.
 * Con un solo importe es una pildora. Con varios tamanos (16 oz / 24 oz) es un
 * grupo de pildoras con el tamano encima del importe, para que se lea primero
 * el numero grande y luego a que medida corresponde.
 */
function Precio({
  price,
  accent,
  destacado,
}: {
  price?: Price;
  accent: AccentTokens;
  destacado: boolean;
}) {
  const tiers = toPriceTiers(price);

  // Sin precio de categoria: cada producto lleva el suyo en la lista.
  if (tiers.length === 0) return null;

  if (tiers.length === 1 && !tiers[0].label) {
    return (
      <div
        className="shrink-0 rounded-full px-4 py-1.5 sm:px-5 sm:py-2"
        style={{
          backgroundColor: accent.base,
          color: accent.onBase,
          boxShadow: "var(--shadow-pildora)",
        }}
      >
        <span
          className="font-[family-name:var(--font-body)] font-semibold tabular-nums"
          style={{
            fontSize: destacado
              ? "clamp(1.25rem, 1.05rem + 0.9vw, 1.85rem)"
              : "clamp(1.15rem, 1rem + 0.7vw, 1.6rem)",
            lineHeight: 1.15,
          }}
        >
          {formatPrice(tiers[0].value)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-stretch gap-1.5 sm:gap-2">
      {tiers.map((tier) => (
        <div
          key={tier.label}
          className="flex flex-col items-center rounded-[1.15rem] px-3 py-1.5 sm:px-4 sm:py-2"
          style={{
            backgroundColor: accent.base,
            color: accent.onBase,
            boxShadow: "var(--shadow-pildora)",
          }}
        >
          <span
            className="font-[family-name:var(--font-body)] text-[0.6rem] font-medium uppercase opacity-75 sm:text-[0.7rem]"
            style={{ letterSpacing: "0.12em", lineHeight: 1.2 }}
          >
            {tier.label}
          </span>
          <span
            className="font-[family-name:var(--font-body)] font-semibold tabular-nums"
            style={{
              fontSize: "clamp(1rem, 0.88rem + 0.55vw, 1.4rem)",
              lineHeight: 1.15,
            }}
          >
            {formatPrice(tier.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
