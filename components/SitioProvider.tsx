"use client";

import { createContext, useContext } from "react";

import { site as porDefecto } from "@/config/site";
import type { ContenidoSite } from "@/lib/contenido";

/**
 * Los datos del negocio, disponibles para los componentes de la carta.
 *
 * Hasta ahora cada componente importaba `site` de config/site.ts, que es un
 * literal compilado dentro del paquete. Con eso, cambiar el subtitulo o el
 * telefono desde el panel no servia de nada: la carta seguia pintando el valor
 * que se compilo. Ahora el layout lee el contenido en el servidor y lo reparte
 * por aqui.
 *
 * Se usa contexto y no props para no ir pasando el mismo objeto por seis
 * niveles de componentes que no lo usan, solo para que llegue al pie.
 *
 * `config/site.ts` no desaparece: queda como valores de respaldo. Si algun dia
 * un componente se pinta fuera del proveedor —una prueba, una pagina suelta—,
 * se ve la carta con los datos de siempre en vez de reventar.
 */

/**
 * Lo que de verdad necesita la carta.
 *
 * `playlist` se queda fuera adrede: el orden de los menus lo resuelve el
 * servidor antes de pintar nada, y mandarlo al navegador seria filtrar una
 * decision que ahi no se usa para nada.
 */
export type SitioPublico = Omit<ContenidoSite, "playlist">;

const SitioContexto = createContext<SitioPublico | null>(null);

export function SitioProvider({
  valor,
  children,
}: {
  valor: SitioPublico;
  children: React.ReactNode;
}) {
  return (
    <SitioContexto.Provider value={valor}>{children}</SitioContexto.Provider>
  );
}

export function useSitio(): SitioPublico {
  return useContext(SitioContexto) ?? (porDefecto as unknown as SitioPublico);
}

/** Direccion publica de cada red, a partir del usuario configurado. */
export function urlDeRed(sitio: SitioPublico, red: string): string {
  const usuario = sitio.footer.handle.replace(/^@/, "");

  if (red === "facebook") return `https://facebook.com/${usuario}`;
  if (red === "tiktok") return `https://tiktok.com/@${usuario}`;
  return `https://instagram.com/${usuario}`;
}

/** Telefono en formato internacional, sin espacios: +524171279042 */
export function telefonoE164(sitio: SitioPublico): string {
  return `+${sitio.credits.phoneCountryCode}${sitio.credits.phone}`;
}

/** Telefono agrupado para leerlo de un vistazo: 417 127 9042 */
export function telefonoLegible(sitio: SitioPublico): string {
  return sitio.credits.phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");
}
