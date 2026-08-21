import Link from "next/link";
import { redirect } from "next/navigation";

import { leerContenido, sePuedeGuardar } from "@/lib/contenido";
import { haySesion } from "@/lib/sesion";
import { MODULOS, productos } from "./modulos";
import {
  Distintivo,
} from "./ui";
import {
  botonPrimario,
  botonSuave,
} from "./estilos";

/**
 * Portada del panel: un modulo por tarjeta.
 *
 * Cada tarjeta responde a las tres preguntas que se hace quien entra —que es
 * esto, cuanto hay dentro y como se abre— sin tener que abrirlo para
 * averiguarlo. Los recuentos salen del contenido real, no escritos a mano.
 */
export default async function Panel() {
  if (!(await haySesion())) redirect("/admin/entrar");

  const contenido = await leerContenido();

  // Un par de cifras de cabecera, las que se miran al empezar el dia.
  let total = 0;
  let ocultos = 0;
  for (const { producto } of productos(contenido)) {
    total++;
    if (producto.active === false) ocultos++;
  }
  const menusVisibles = contenido.groups.filter(
    (g) => g.active !== false && g.screens.some((s) => s.categories.length > 0),
  ).length;

  return (
    <main>
      <header className="mb-7">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold sm:text-3xl">
          Administración de la carta
        </h1>
        <p className="mt-1.5 text-sm text-tinta-suave">
          {total} productos en {menusVisibles}{" "}
          {menusVisibles === 1 ? "categoría visible" : "categorías visibles"}
          {ocultos > 0 ? ` · ${ocultos} sin disponibilidad` : ""}. Lo que
          guardes se ve en la carta al momento.
        </p>
      </header>

      {!sePuedeGuardar() ? (
        <p className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs leading-relaxed text-amber-900">
          <strong className="font-semibold">Solo lectura.</strong> Este servidor
          no permite guardar en disco, así que los cambios no se conservarán. El
          panel edita de verdad cuando corre en tu computadora (
          <code>npm run dev</code>). Para editar desde el sitio publicado hay
          que mover el contenido a una base de datos.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {MODULOS.map((modulo) => {
          const recuento = modulo.contar?.(contenido);

          return (
            <article
              key={modulo.slug}
              className="flex flex-col rounded-2xl border border-black/10 bg-white p-4 transition-shadow hover:shadow-[0_10px_30px_-16px_rgb(59_42_77_/_0.35)]"
            >
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="grid size-9 shrink-0 place-items-center rounded-xl bg-morado/10 text-lg"
                >
                  {modulo.icono}
                </span>
                <div className="min-w-0">
                  <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">
                    {modulo.nombre}
                  </h2>
                  <p className="mt-0.5 text-xs leading-snug text-tinta-suave">
                    {modulo.descripcion}
                  </p>
                </div>
              </div>

              {recuento ? (
                <div className="mt-4">
                  <p className="font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums">
                    {recuento.valor}{" "}
                    <span className="text-sm font-medium text-tinta-suave">
                      {recuento.unidad}
                    </span>
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {recuento.detalle ? (
                      <span className="text-[0.7rem] text-tinta-suave">
                        {recuento.detalle}
                      </span>
                    ) : null}
                    {recuento.alerta ? (
                      <Distintivo tono="aviso">{recuento.alerta}</Distintivo>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <Link
                href={`/admin/${modulo.slug}`}
                className={`${botonPrimario} mt-4 w-full`}
              >
                Administrar
              </Link>
            </article>
          );
        })}

        {/* La vista previa no es un modulo que se administre, pero se busca
            desde aqui igual que los demas. */}
        <article className="flex flex-col rounded-2xl border border-dashed border-black/15 bg-transparent p-4">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="grid size-9 shrink-0 place-items-center rounded-xl bg-black/[0.05] text-lg"
            >
              👁
            </span>
            <div className="min-w-0">
              <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">
                Vista previa
              </h2>
              <p className="mt-0.5 text-xs leading-snug text-tinta-suave">
                Comprueba cómo va quedando la carta antes de enseñarla.
              </p>
            </div>
          </div>

          <Link
            href="/admin/vista-previa"
            className={`${botonSuave} mt-auto w-full justify-center py-2`}
          >
            Ver la carta
          </Link>
        </article>
      </div>
    </main>
  );
}
