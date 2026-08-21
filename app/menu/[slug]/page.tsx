import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { MenuBrowser } from "@/components/MenuBrowser";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { site } from "@/config/site";
import { getAllSlugs, getGroup } from "@/data/menus";

interface Params {
  params: Promise<{ slug: string }>;
}

/**
 * Un solo menu: /menu/bobas, /menu/blizz...
 *
 * Antes habia una carpeta por menu con el mismo archivo copiado siete veces.
 * Con una ruta dinamica basta con anadir el menu a /data y la URL existe sola.
 * Sigue siendo estatica: `generateStaticParams` las genera todas al compilar.
 */
export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const group = await getGroup(slug);

  if (!group) return {};

  return {
    title: `${group.label} · ${site.brand}`,
    description: `${group.label} de ${site.brand}. Consulta sabores y precios.`,
  };
}

export default async function MenuPage({ params }: Params) {
  const { slug } = await params;
  const group = await getGroup(slug);

  if (!group) notFound();

  return (
    <>
      <SiteHeader intro={`Estás viendo solo ${group.label}`} />

      <div className="flex justify-center px-5 pb-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-white/75 px-4 py-2 text-sm font-medium text-tinta transition-colors hover:bg-white"
          style={{ border: "1px solid rgb(147 113 176 / 0.22)" }}
        >
          <ArrowLeft size={16} strokeWidth={2.2} aria-hidden="true" />
          Ver la carta completa
        </Link>
      </div>

      {/* La barra se queda sin la fila de menus (no habria a donde ir) pero
          conserva el buscador: Bobas sola ya son cinco bloques. */}
      <MenuBrowser groups={[group]} />

      <SiteFooter anio={new Date().getFullYear()} />
    </>
  );
}
