import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { leerContenido } from "@/lib/contenido";
import { haySesion } from "@/lib/sesion";
import {
  accionAlternarMenu,
  accionEliminarMenu,
  accionMoverMenu,
} from "../acciones";
import { moduloDe } from "../modulos";
import {
  BotonAccion,
  BotonEliminar,
  CabeceraModulo,
  Distintivo,
  Panel,
  Plegable,
} from "../ui";
import {
  botonFantasma,
  botonPrimario,
  botonSuave,
} from "../estilos";
import { FormularioCrearMenu, FormularioMenu } from "./formularios";

/**
 * Modulo de categorias: los menus de la carta y su orden.
 *
 * El orden va primero porque es la decision con mas efecto de todas. La carta
 * se recorre de arriba abajo, asi que lo primero que aparece es lo que mas se
 * pide; cambiar de sitio Frozen Yogurt pesa mas que cualquier precio.
 */
export default async function ModuloCategorias() {
  if (!(await haySesion())) redirect("/admin/entrar");

  const modulo = moduloDe("categorias")!;
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
    <main>
      <CabeceraModulo
        icono={modulo.icono}
        nombre={modulo.nombre}
        alcance={modulo.alcance}
        volverA="/admin"
        volverTexto="Inicio"
      />

      <ol className="space-y-3">
        {ordenados.map((grupo, indice) => {
          const productos = grupo.screens.reduce(
            (total, bloque) =>
              total + bloque.categories.reduce((suma, c) => suma + c.items.length, 0),
            0,
          );
          const tarjetas = grupo.screens.reduce(
            (total, bloque) => total + bloque.categories.length,
            0,
          );
          const apagado = grupo.active === false;

          return (
            <li key={grupo.slug}>
              <Panel atenuado={apagado}>
                <div className="flex flex-wrap items-start gap-3">
                  {/* La foto, al tamanio de una miniatura: se reconoce la
                      categoria antes de leer su nombre. */}
                  <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-black/[0.04]">
                    {grupo.image ? (
                      <Image
                        src={grupo.image}
                        alt=""
                        width={56}
                        height={56}
                        className="size-full object-contain p-1"
                      />
                    ) : (
                      <span className="text-[0.6rem] text-tinta-suave">
                        sin foto
                      </span>
                    )}
                  </div>

                  <div className="min-w-[10rem] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-black/[0.06] px-1.5 py-0.5 text-[0.7rem] font-medium tabular-nums text-tinta-suave">
                        {indice + 1}
                      </span>
                      <Link
                        href={`/admin/categorias/${grupo.slug}`}
                        className="font-[family-name:var(--font-display)] text-lg font-semibold hover:text-morado"
                      >
                        {grupo.label}
                      </Link>
                      {apagado ? <Distintivo tono="malo">Oculta</Distintivo> : null}
                      {productos === 0 ? (
                        <Distintivo tono="aviso">Sin productos</Distintivo>
                      ) : null}
                    </div>

                    <p className="mt-1 text-xs text-tinta-suave">
                      {productos} {productos === 1 ? "producto" : "productos"} ·{" "}
                      {tarjetas} {tarjetas === 1 ? "tarjeta" : "tarjetas"} ·{" "}
                      {grupo.screens.length}{" "}
                      {grupo.screens.length === 1 ? "bloque" : "bloques"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <BotonAccion
                      accion={accionMoverMenu}
                      campos={{ grupo: grupo.slug, direccion: "arriba" }}
                      titulo="Subir en la carta"
                      deshabilitado={indice === 0}
                      className={botonFantasma}
                    >
                      ↑
                    </BotonAccion>
                    <BotonAccion
                      accion={accionMoverMenu}
                      campos={{ grupo: grupo.slug, direccion: "abajo" }}
                      titulo="Bajar en la carta"
                      deshabilitado={indice === ordenados.length - 1}
                      className={botonFantasma}
                    >
                      ↓
                    </BotonAccion>
                    <BotonAccion
                      accion={accionAlternarMenu}
                      campos={{ grupo: grupo.slug }}
                      className={botonSuave}
                    >
                      {apagado ? "Mostrar" : "Ocultar"}
                    </BotonAccion>
                    <Link
                      href={`/admin/categorias/${grupo.slug}`}
                      className={botonPrimario}
                    >
                      Administrar
                    </Link>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4">
                  <Plegable resumen="Cambiar nombre">
                    <FormularioMenu
                      grupo={grupo.slug}
                      label={grupo.label}
                      active={grupo.active}
                    />
                  </Plegable>

                  <Link
                    href={`/admin/imagenes#${grupo.slug}`}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-morado hover:bg-morado/8"
                  >
                    {grupo.image ? "Cambiar foto" : "Poner foto"}
                  </Link>

                  <div className="ml-auto">
                    <BotonEliminar
                      accion={accionEliminarMenu}
                      campos={{ grupo: grupo.slug }}
                      que={`la categoría “${grupo.label}”`}
                      aviso={
                        productos > 0
                          ? `Se van también sus ${productos} productos.`
                          : undefined
                      }
                      className={botonFantasma}
                    />
                  </div>
                </div>
              </Panel>
            </li>
          );
        })}
      </ol>

      <div className="mt-4">
        <Panel
          titulo="Crear una categoría"
          ayuda="Un menú nuevo de la carta: Malteadas, Especialidades, lo que haga falta."
        >
          <FormularioCrearMenu />
        </Panel>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-tinta-suave">
        Una categoría sin productos visibles no sale en la carta aunque esté
        activa — es lo que pasa hoy con Malteadas y Especialidades, que están
        pendientes de datos.
      </p>
    </main>
  );
}
