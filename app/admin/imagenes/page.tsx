import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { leerContenido } from "@/lib/contenido";
import { listarImagenes } from "@/lib/imagenes";
import { haySesion } from "@/lib/sesion";
import { accionQuitarImagenMenu } from "../acciones";
import { moduloDe } from "../modulos";
import {
  BotonEliminar,
  CabeceraModulo,
  Distintivo,
  Panel,
  Plegable,
} from "../ui";
import {
  botonSuave,
} from "../estilos";
import { FormularioSubirFoto, FormularioTextoFoto } from "./formularios";

/**
 * Modulo de imagenes.
 *
 * Se organiza por DONDE se usa cada una, no por carpeta. La pregunta que se
 * hace quien entra aqui nunca es "que archivos hay", sino "que foto sale en
 * Bobas y como la cambio"; una lista de nombres de archivo obliga a abrirlos
 * uno a uno para averiguarlo.
 *
 * Al final se listan los archivos que quedaron sueltos, que es lo que se
 * acumula al reemplazar fotos y nadie limpia nunca.
 */
export default async function ModuloImagenes() {
  if (!(await haySesion())) redirect("/admin/entrar");

  const modulo = moduloDe("imagenes")!;
  const { site, groups } = await leerContenido();
  const archivos = await listarImagenes();

  const enUso = new Set(groups.map((g) => g.image).filter(Boolean) as string[]);
  const sueltos = archivos.filter((archivo) => !enUso.has(archivo.ruta));

  return (
    <main>
      <CabeceraModulo
        icono={modulo.icono}
        nombre={modulo.nombre}
        alcance={modulo.alcance}
        volverA="/admin"
        volverTexto="Inicio"
      />

      <div className="space-y-4">
        <Panel
          titulo="La foto de cada categoría"
          ayuda="Encabeza su menú en la carta, entre el título y las tarjetas."
        >
          <ul className="space-y-3">
            {groups.map((grupo) => {
              const productos = grupo.screens.reduce(
                (total, bloque) =>
                  total + bloque.categories.reduce((s, c) => s + c.items.length, 0),
                0,
              );

              return (
                <li
                  key={grupo.slug}
                  id={grupo.slug}
                  className="rounded-xl border border-black/10 p-3 scroll-mt-24"
                >
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-lg bg-black/[0.04]">
                      {grupo.image ? (
                        <Image
                          src={grupo.image}
                          alt={grupo.imageAlt ?? ""}
                          width={80}
                          height={80}
                          className="size-full object-contain p-1"
                        />
                      ) : (
                        <span className="text-[0.6rem] text-tinta-suave">
                          sin foto
                        </span>
                      )}
                    </div>

                    <div className="min-w-[10rem] flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                        {grupo.label}
                        {!grupo.image && productos > 0 ? (
                          <Distintivo tono="aviso">Sin foto</Distintivo>
                        ) : null}
                        {productos === 0 ? (
                          <Distintivo>Sin productos</Distintivo>
                        ) : null}
                      </p>

                      {grupo.image ? (
                        <>
                          <p className="mt-1 text-xs text-tinta-suave">
                            {grupo.imageAlt || (
                              <span className="text-amber-700">
                                Sin descripción
                              </span>
                            )}
                          </p>
                          <code className="mt-0.5 block text-[0.65rem] text-tinta-suave">
                            {grupo.image}
                          </code>
                        </>
                      ) : (
                        <p className="mt-1 text-xs text-tinta-suave">
                          Este menú se ve solo con su título, sin hueco ni
                          marcador.
                        </p>
                      )}
                    </div>

                    {grupo.image ? (
                      <BotonEliminar
                        accion={accionQuitarImagenMenu}
                        campos={{ grupo: grupo.slug }}
                        que={`la foto de “${grupo.label}”`}
                        aviso="El menú se quedará solo con su título."
                        className={botonSuave}
                        children="Quitar foto"
                      />
                    ) : null}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-4">
                    <Plegable resumen={grupo.image ? "Reemplazar" : "Subir foto"}>
                      <FormularioSubirFoto
                        grupo={grupo.slug}
                        alt={grupo.imageAlt ?? ""}
                        tieneFoto={Boolean(grupo.image)}
                      />
                    </Plegable>

                    {grupo.image ? (
                      <Plegable resumen="Cambiar descripción">
                        <FormularioTextoFoto
                          grupo={grupo.slug}
                          alt={grupo.imageAlt ?? ""}
                        />
                      </Plegable>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel
          titulo="Imágenes de marca"
          ayuda="Se cambian reemplazando el archivo, no desde el panel."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                ruta: site.logo,
                nombre: "Logo",
                donde: "Portada, pestaña del navegador y enlace compartido",
              },
              {
                ruta: site.background,
                nombre: "Fondo",
                donde: "Detrás de toda la carta",
              },
            ].map((imagen) => (
              <div
                key={imagen.ruta}
                className="flex items-center gap-3 rounded-xl border border-black/10 p-3"
              >
                <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-black/[0.04]">
                  <Image
                    src={imagen.ruta}
                    alt=""
                    width={56}
                    height={56}
                    className="size-full object-contain p-1"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold">{imagen.nombre}</p>
                  <p className="text-[0.7rem] text-tinta-suave">{imagen.donde}</p>
                  <code className="text-[0.65rem] text-tinta-suave">
                    {imagen.ruta}
                  </code>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-3 text-[0.7rem] leading-relaxed text-tinta-suave">
            Más detalle en{" "}
            <Link
              href="/admin/apariencia"
              className="font-medium text-morado hover:underline"
            >
              Apariencia
            </Link>
            .
          </p>
        </Panel>

        {sueltos.length > 0 ? (
          <Panel
            titulo="Archivos que ya no usa nadie"
            ayuda="Quedaron al reemplazar fotos. No se borran solos por si quieres volver a una."
          >
            <ul className="grid gap-2 sm:grid-cols-2">
              {sueltos.map((archivo) => (
                <li
                  key={archivo.ruta}
                  className="flex items-center gap-3 rounded-xl border border-black/10 p-2.5"
                >
                  <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-black/[0.04]">
                    <Image
                      src={archivo.ruta}
                      alt=""
                      width={48}
                      height={48}
                      className="size-full object-contain p-1"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <code className="block truncate text-[0.65rem] text-tinta-suave">
                      {archivo.ruta}
                    </code>
                    <span className="text-[0.65rem] text-tinta-suave">
                      {Math.round(archivo.peso / 1024)} KB
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-3 text-[0.7rem] leading-relaxed text-tinta-suave">
              Ocupan espacio pero no molestan a nadie: la carta no los pide, así
              que el cliente nunca los descarga. Para borrarlos de verdad,
              elimínalos de <code>public/categorias/</code>.
            </p>
          </Panel>
        ) : null}
      </div>
    </main>
  );
}
