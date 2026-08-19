import Link from "next/link";
import { redirect } from "next/navigation";

import { leerContenido, sePuedeGuardar } from "@/lib/contenido";
import { haySesion } from "@/lib/sesion";
import {
  accionAlternarMenu,
  accionMoverMenu,
  salir,
} from "./acciones";
import { BotonAccion, Plegable, FormularioMenu } from "./componentes";

/**
 * Portada del panel: los menus en el orden en que salen en la carta.
 *
 * El orden es lo primero que se ve porque es la decision con mas efecto de
 * todas: en una pagina que se recorre de arriba abajo, lo primero que aparece
 * es lo que mas se pide.
 */
export default async function Panel() {
  if (!(await haySesion())) redirect("/admin/entrar");

  const { site, groups } = await leerContenido();

  // El mismo saneado que hace la carta: manda `playlist`, y lo que no este en
  // ella va al final en vez de desaparecer sin avisar.
  const orden = [
    ...site.playlist.filter((slug) => groups.some((g) => g.slug === slug)),
    ...groups.map((g) => g.slug).filter((slug) => !site.playlist.includes(slug)),
  ];
  const ordenados = orden
    .map((slug) => groups.find((g) => g.slug === slug))
    .filter((grupo): grupo is (typeof groups)[number] => Boolean(grupo));

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold sm:text-3xl">
            Carta de GALU
          </h1>
          <p className="mt-1 text-sm text-tinta-suave">
            Lo que guardes aquí se ve al instante en la carta.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            className="rounded-lg border border-black/12 bg-white px-3 py-1.5 text-xs font-medium hover:bg-black/[0.04]"
          >
            Ver la carta
          </Link>
          <form action={salir}>
            <button
              type="submit"
              className="rounded-lg border border-black/12 bg-white px-3 py-1.5 text-xs font-medium hover:bg-black/[0.04]"
            >
              Salir
            </button>
          </form>
        </div>
      </header>

      {/* Aviso por adelantado, no al fallar el primer guardado. */}
      {!sePuedeGuardar() ? (
        <p className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
          <strong className="font-semibold">Solo lectura.</strong> Este servidor
          no permite guardar en disco, así que los cambios que hagas aquí no se
          conservarán. El panel edita de verdad cuando corre en tu computadora
          (<code>npm run dev</code>). Para editar desde el sitio publicado hay
          que mover el contenido a una base de datos.
        </p>
      ) : null}

      <ol className="mt-8 space-y-3">
        {ordenados.map((grupo, indice) => {
          const productos = grupo.screens.reduce(
            (total, bloque) =>
              total +
              bloque.categories.reduce((suma, c) => suma + c.items.length, 0),
            0,
          );
          const apagado = grupo.active === false;

          return (
            <li
              key={grupo.slug}
              className={`rounded-2xl border border-black/10 bg-white p-4 ${
                apagado ? "opacity-55" : ""
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-black/5 px-1.5 py-0.5 text-[0.7rem] font-medium tabular-nums text-tinta-suave">
                      {indice + 1}
                    </span>
                    <Link
                      href={`/admin/${grupo.slug}`}
                      className="font-[family-name:var(--font-display)] text-lg font-semibold hover:text-morado"
                    >
                      {grupo.label}
                    </Link>
                    {apagado ? (
                      <span className="rounded-md bg-red-100 px-1.5 py-0.5 text-[0.65rem] font-medium text-red-700">
                        Oculto
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-tinta-suave">
                    {grupo.screens.length}{" "}
                    {grupo.screens.length === 1 ? "bloque" : "bloques"} ·{" "}
                    {productos} {productos === 1 ? "producto" : "productos"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <BotonAccion
                    accion={accionMoverMenu}
                    campos={{ grupo: grupo.slug, direccion: "arriba" }}
                    titulo="Subir"
                    deshabilitado={indice === 0}
                  >
                    ↑
                  </BotonAccion>
                  <BotonAccion
                    accion={accionMoverMenu}
                    campos={{ grupo: grupo.slug, direccion: "abajo" }}
                    titulo="Bajar"
                    deshabilitado={indice === ordenados.length - 1}
                  >
                    ↓
                  </BotonAccion>
                  <BotonAccion
                    accion={accionAlternarMenu}
                    campos={{ grupo: grupo.slug }}
                  >
                    {apagado ? "Activar" : "Desactivar"}
                  </BotonAccion>
                  <Link
                    href={`/admin/${grupo.slug}`}
                    className="rounded-lg bg-morado px-3 py-1.5 text-xs font-medium text-white hover:bg-morado/90"
                  >
                    Abrir
                  </Link>
                </div>
              </div>

              <div className="mt-2">
                <Plegable resumen="Renombrar menú">
                  <FormularioMenu
                    grupo={grupo.slug}
                    label={grupo.label}
                    active={grupo.active}
                  />
                </Plegable>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="mt-8 text-xs leading-relaxed text-tinta-suave">
        Un menú sin productos visibles no sale en la carta aunque esté activo —
        es lo que pasa hoy con Malteadas y Especialidades, que están pendientes
        de datos.
      </p>
    </main>
  );
}
