"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { MODULOS } from "./modulos";
import { salir } from "./acciones";

/**
 * Navegacion del panel.
 *
 * En pantalla ancha es una columna fija a la izquierda, que es la forma en la
 * que se reconoce un sistema de administracion de un vistazo. En el movil se
 * convierte en una fila que se arrastra con el dedo, porque una columna
 * lateral ahi se comeria media pantalla.
 *
 * Sale de MODULOS, asi que anadir un modulo nuevo lo pone aqui solo.
 */
export function Navegacion() {
  const ruta = usePathname();

  // El acceso no lleva navegacion: todavia no se ha entrado a ningun sitio.
  if (ruta?.startsWith("/admin/entrar")) return null;

  const enPortada = ruta === "/admin";

  return (
    <>
      {/* Escritorio */}
      <aside className="hidden w-56 shrink-0 border-r border-black/10 bg-white lg:block">
        <div className="sticky top-0 flex h-dvh flex-col p-4">
          <Link href="/admin" className="mb-6 block">
            <span className="font-[family-name:var(--font-display)] text-lg font-semibold">
              Panel de GALU
            </span>
            <span className="mt-0.5 block text-[0.7rem] text-tinta-suave">
              Administración de la carta
            </span>
          </Link>

          <nav className="flex flex-col gap-0.5">
            <Enlace href="/admin" activo={enPortada} icono="▦">
              Inicio
            </Enlace>

            {MODULOS.map((modulo) => (
              <Enlace
                key={modulo.slug}
                href={`/admin/${modulo.slug}`}
                activo={Boolean(ruta?.startsWith(`/admin/${modulo.slug}`))}
                icono={modulo.icono}
              >
                {modulo.nombre}
              </Enlace>
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-0.5 border-t border-black/10 pt-3">
            <Enlace
              href="/admin/vista-previa"
              activo={Boolean(ruta?.startsWith("/admin/vista-previa"))}
              icono="👁"
            >
              Vista previa
            </Enlace>

            <form action={salir}>
              <button
                type="submit"
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[0.8rem] font-medium text-tinta-suave transition-colors hover:bg-black/[0.04] hover:text-tinta"
              >
                <span aria-hidden="true" className="w-4 text-center">
                  ⏻
                </span>
                Salir
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Movil y tablet */}
      <div className="sticky top-0 z-20 border-b border-black/10 bg-white/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-2.5">
          <Link
            href="/admin"
            className="font-[family-name:var(--font-display)] text-base font-semibold"
          >
            Panel de GALU
          </Link>
          <div className="flex items-center gap-1.5">
            <Link
              href="/admin/vista-previa"
              className="rounded-lg border border-black/12 px-2.5 py-1.5 text-[0.7rem] font-medium"
            >
              👁 Vista previa
            </Link>
            <form action={salir}>
              <button
                type="submit"
                className="rounded-lg border border-black/12 px-2.5 py-1.5 text-[0.7rem] font-medium"
              >
                Salir
              </button>
            </form>
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto px-4 pb-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Chip href="/admin" activo={enPortada}>
            ▦ Inicio
          </Chip>
          {MODULOS.map((modulo) => (
            <Chip
              key={modulo.slug}
              href={`/admin/${modulo.slug}`}
              activo={Boolean(ruta?.startsWith(`/admin/${modulo.slug}`))}
            >
              {modulo.icono} {modulo.nombre}
            </Chip>
          ))}
        </div>
      </div>
    </>
  );
}

function Enlace({
  href,
  activo,
  icono,
  children,
}: {
  href: string;
  activo: boolean;
  icono: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={activo ? "page" : undefined}
      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.8rem] font-medium transition-colors ${
        activo
          ? "bg-morado/12 text-[#5d3f7d]"
          : "text-tinta-suave hover:bg-black/[0.04] hover:text-tinta"
      }`}
    >
      <span aria-hidden="true" className="w-4 text-center">
        {icono}
      </span>
      {children}
    </Link>
  );
}

function Chip({
  href,
  activo,
  children,
}: {
  href: string;
  activo: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={activo ? "page" : undefined}
      className={`shrink-0 rounded-full px-3 py-1.5 text-[0.72rem] font-medium whitespace-nowrap transition-colors ${
        activo
          ? "bg-morado text-white"
          : "border border-black/12 bg-white text-tinta-suave"
      }`}
    >
      {children}
    </Link>
  );
}
