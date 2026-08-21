import type { Metadata } from "next";

import { Navegacion } from "./navegacion";

/**
 * Marco del panel de administracion.
 *
 * El panel NO se parece a la carta, y es a proposito. La carta es vidrio,
 * halos de color y letra grande porque se lee de reojo con el telefono en una
 * mano; el panel es una herramienta de trabajo donde hace falta ver muchas
 * filas de un vistazo y no equivocarse de boton. Compartir el aire y los
 * colores de marca lo haria bonito y lento de usar.
 *
 * De la marca se conservan solo las dos tipografias y el morado de los
 * acentos, lo justo para que no parezca un programa ajeno pegado al sitio.
 */

export const metadata: Metadata = {
  title: "Panel · GALU",
  // Aunque no este enlazado desde ningun sitio, que no lo indexe nadie.
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    /*
     * Fondo opaco que tapa el arte de marca que el layout raiz pinta para todo
     * el sitio. Es mas barato que sacar el fondo del layout raiz, y no arriesga
     * a que la carta publica se quede sin el.
     */
    <div className="relative z-10 min-h-dvh bg-[#f6f4f8] text-tinta">
      <div className="flex min-h-dvh flex-col lg:flex-row">
        <Navegacion />

        <div className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
