import { MenuBrowser } from "@/components/MenuBrowser";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getPlaylistGroups } from "@/data/menus";

/**
 * La carta completa. Es la URL que va en el codigo QR de las mesas.
 *
 * Todos los menus viven en la misma pagina: en un celular abrir una carta y
 * volver atras para abrir otra se siente mucho peor que arrastrar el dedo, y
 * ademas asi la busqueda encuentra a la primera un sabor este donde este.
 */
export default async function Home() {
  return (
    <>
      <SiteHeader />
      <MenuBrowser groups={await getPlaylistGroups()} />
      <SiteFooter anio={new Date().getFullYear()} />
    </>
  );
}
