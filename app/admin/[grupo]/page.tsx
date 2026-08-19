import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { toMenuItem } from "@/data/types";
import { getAccent } from "@/lib/accents";
import { leerContenido } from "@/lib/contenido";
import { haySesion } from "@/lib/sesion";
import {
  accionAlternarCategoria,
  accionAlternarProducto,
  accionEliminarCategoria,
  accionEliminarProducto,
} from "../acciones";
import {
  BotonAccion,
  BotonEliminar,
  FormularioBloque,
  FormularioCategoria,
  FormularioProducto,
  Plegable,
  type DestinoPosible,
} from "../componentes";

interface Params {
  params: Promise<{ grupo: string }>;
}

/**
 * Un menu por dentro: sus bloques, sus tarjetas y sus productos.
 *
 * Todo en una sola pagina, con secciones plegables, en vez de repartirlo en
 * tres niveles de navegacion. Editar una carta es un trabajo de comparar —el
 * precio de esta tarjeta contra el de aquella, un sabor que quiza esta
 * repetido— y para eso hace falta verlo junto. Tres pantallas encadenadas
 * obligarian a memorizar lo que se dejo atras.
 */
export default async function MenuDelPanel({ params }: Params) {
  if (!(await haySesion())) redirect("/admin/entrar");

  const { grupo: grupoSlug } = await params;
  const { groups } = await leerContenido();
  const grupo = groups.find((g) => g.slug === grupoSlug);

  if (!grupo) notFound();

  /*
   * Todas las categorias de la carta, para el desplegable de "mover a".
   * Se listan las de TODOS los menus y no solo las de este: un sabor mal
   * colocado suele estar en el menu equivocado, no en la tarjeta de al lado.
   */
  const destinos: DestinoPosible[] = groups.flatMap((g) =>
    g.screens.flatMap((bloque) =>
      bloque.categories.map((categoria) => ({
        valor: `${g.slug}|${bloque.slug}|${categoria.id}`,
        texto: `${g.label} · ${bloque.section ?? bloque.title} · ${categoria.name}`,
      })),
    ),
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <nav className="text-xs text-tinta-suave">
        <Link href="/admin" className="hover:text-morado">
          ← Todos los menús
        </Link>
      </nav>

      <header className="mt-3 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold sm:text-3xl">
          {grupo.label}
        </h1>
        <Link
          href={`/menu/${grupo.slug}`}
          target="_blank"
          className="text-xs font-medium text-morado hover:underline"
        >
          Ver este menú en la carta
        </Link>
      </header>

      <div className="mt-8 space-y-8">
        {grupo.screens.map((bloque) => (
          <section
            key={bloque.slug}
            className={`rounded-2xl border border-black/10 bg-white p-4 sm:p-5 ${
              bloque.active === false ? "opacity-55" : ""
            }`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
                {bloque.section ?? bloque.title}
              </h2>
              {bloque.active === false ? (
                <span className="rounded-md bg-red-100 px-1.5 py-0.5 text-[0.65rem] font-medium text-red-700">
                  Oculto
                </span>
              ) : null}
            </div>

            <div className="mt-2">
              <Plegable resumen="Editar título, sección y preparación">
                <FormularioBloque grupo={grupo.slug} bloque={bloque} />
              </Plegable>
            </div>

            {/* Tarjetas del bloque */}
            <div className="mt-4 space-y-5">
              {bloque.categories.map((categoria) => {
                const acento = getAccent(categoria.accent);
                const apagada = categoria.active === false;
                const ubicacion = {
                  grupo: grupo.slug,
                  bloque: bloque.slug,
                  categoria: categoria.id,
                };

                return (
                  <article
                    key={categoria.id}
                    className={`rounded-xl border border-black/10 ${
                      apagada ? "opacity-55" : ""
                    }`}
                  >
                    {/* La misma cinta de color que lleva la tarjeta en la
                        carta: es la forma mas rapida de saber cual se edita. */}
                    <span
                      aria-hidden="true"
                      className="block h-1.5 rounded-t-xl"
                      style={{ backgroundColor: acento.base }}
                    />

                    <div className="p-3 sm:p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-[family-name:var(--font-display)] font-semibold">
                            {categoria.name}
                          </h3>
                          <p className="mt-0.5 text-xs text-tinta-suave">
                            {categoria.items.length}{" "}
                            {categoria.items.length === 1
                              ? "producto"
                              : "productos"}
                            {categoria.price === undefined
                              ? " · precio por renglón"
                              : Array.isArray(categoria.price)
                                ? ` · ${categoria.price
                                    .map((t) => `${t.label} $${t.value}`)
                                    .join(" · ")}`
                                : ` · $${categoria.price}`}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <BotonAccion
                            accion={accionAlternarCategoria}
                            campos={ubicacion}
                          >
                            {apagada ? "Activar" : "Desactivar"}
                          </BotonAccion>
                          <BotonEliminar
                            accion={accionEliminarCategoria}
                            campos={ubicacion}
                            que={`la tarjeta “${categoria.name}”`}
                            aviso={
                              categoria.items.length > 0
                                ? `Se van también sus ${categoria.items.length} productos.`
                                : undefined
                            }
                          />
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-4">
                        <Plegable resumen="Editar tarjeta, precio y color">
                          <FormularioCategoria
                            categoria={categoria}
                            ubicacion={ubicacion}
                          />
                        </Plegable>

                        <Plegable resumen="+ Agregar producto">
                          <FormularioProducto ubicacion={ubicacion} />
                        </Plegable>
                      </div>

                      {/* Productos */}
                      <ul className="mt-3 divide-y divide-black/8 border-t border-black/8">
                        {categoria.items.map((crudo) => {
                          const item = toMenuItem(crudo);
                          const oculto = item.active === false;
                          // Los productos migrados siempre traen id; la red de
                          // seguridad es por si alguien edita el JSON a mano.
                          const id = item.id ?? "";

                          return (
                            <li key={id || item.name} className="py-2">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p
                                    className={`text-sm font-medium ${
                                      oculto
                                        ? "text-tinta-suave line-through"
                                        : "text-tinta"
                                    }`}
                                  >
                                    {item.name}
                                    {item.price !== undefined ? (
                                      <span className="ml-2 tabular-nums text-tinta-suave">
                                        ${item.price}
                                      </span>
                                    ) : null}
                                    {item.note ? (
                                      <span className="ml-2 text-xs text-tinta-suave">
                                        {item.note}
                                      </span>
                                    ) : null}
                                    {item.tag ? (
                                      <span className="ml-2 rounded bg-black/6 px-1.5 py-0.5 text-[0.6rem] uppercase text-tinta-suave">
                                        {item.tag}
                                      </span>
                                    ) : null}
                                  </p>
                                  {item.description ? (
                                    <p className="mt-0.5 text-xs text-tinta-suave">
                                      {item.description}
                                    </p>
                                  ) : null}
                                </div>

                                <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                                  <BotonAccion
                                    accion={accionAlternarProducto}
                                    campos={{ id }}
                                  >
                                    {oculto ? "Activar" : "Desactivar"}
                                  </BotonAccion>
                                  <BotonEliminar
                                    accion={accionEliminarProducto}
                                    campos={{ id }}
                                    que={`“${item.name}”`}
                                  />
                                </div>
                              </div>

                              <div className="mt-1">
                                <Plegable resumen="Editar">
                                  <FormularioProducto
                                    producto={item}
                                    ubicacion={ubicacion}
                                    destinos={destinos}
                                  />
                                </Plegable>
                              </div>
                            </li>
                          );
                        })}

                        {categoria.items.length === 0 ? (
                          <li className="py-3 text-xs text-tinta-suave">
                            Sin productos todavía.
                          </li>
                        ) : null}
                      </ul>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-4">
              <Plegable resumen="+ Crear tarjeta nueva en este bloque">
                <FormularioCategoria
                  ubicacion={{ grupo: grupo.slug, bloque: bloque.slug }}
                />
              </Plegable>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
