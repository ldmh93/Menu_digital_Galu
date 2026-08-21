import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { accents } from "@/lib/accents";
import { leerContenido } from "@/lib/contenido";
import { haySesion } from "@/lib/sesion";
import { moduloDe } from "../modulos";
import {
  CabeceraModulo,
  Panel,
} from "../ui";
import {
  botonSuave,
} from "../estilos";

/**
 * Modulo de apariencia: la identidad visual de la marca.
 *
 * Aqui se ENSENIA la paleta y las tipografias, pero no se editan, y conviene
 * decir por que en vez de dejar campos que no hacen nada: los cinco acentos
 * salen del arte oficial del fondo, y estan calculados en pares —color y color
 * del texto encima— para que un precio se lea a distancia sobre su pastilla.
 * Un selector de color libre invita a elegir un rosa que deje el precio
 * ilegible, que es un error caro y silencioso: nadie se queja, simplemente
 * dejan de leerse los precios.
 */
export default async function ModuloApariencia() {
  if (!(await haySesion())) redirect("/admin/entrar");

  const modulo = moduloDe("apariencia")!;
  const { site, groups } = await leerContenido();

  // Cuantas tarjetas usan cada acento: dice de un vistazo si la carta esta
  // equilibrada de color o si un acento se quedo sin usar.
  const uso = new Map<string, number>();
  for (const grupo of groups) {
    for (const bloque of grupo.screens) {
      for (const categoria of bloque.categories) {
        uso.set(categoria.accent, (uso.get(categoria.accent) ?? 0) + 1);
      }
    }
  }

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
          titulo="Logo y fondo"
          ayuda="Las dos imágenes de marca del sitio."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-black/10 p-3">
              <div className="grid h-20 place-items-center rounded-lg bg-black/[0.04]">
                <Image
                  src={site.logo}
                  alt={site.brand}
                  width={266}
                  height={108}
                  className="max-h-16 w-auto object-contain"
                />
              </div>
              <p className="mt-2 text-xs font-medium">Logo</p>
              <p className="text-[0.7rem] text-tinta-suave">
                Portada, pestaña del navegador y enlace compartido.
              </p>
              <code className="mt-1 block text-[0.65rem] text-tinta-suave">
                {site.logo}
              </code>
            </div>

            <div className="rounded-xl border border-black/10 p-3">
              <div className="grid h-20 place-items-center overflow-hidden rounded-lg bg-crema">
                <Image
                  src={site.background}
                  alt="Fondo de marca"
                  width={320}
                  height={80}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="mt-2 text-xs font-medium">Fondo</p>
              <p className="text-[0.7rem] text-tinta-suave">
                El arte que se ve detrás de toda la carta.
              </p>
              <code className="mt-1 block text-[0.65rem] text-tinta-suave">
                {site.background}
              </code>
            </div>
          </div>

          <p className="mt-3 rounded-lg bg-black/[0.03] p-2.5 text-[0.7rem] leading-relaxed text-tinta-suave">
            Para cambiarlas, reemplaza los archivos en la carpeta{" "}
            <code>public/</code> conservando el nombre. No se suben desde aquí a
            propósito: el logo y el fondo son la identidad de la marca, no
            contenido del día a día, y una sustitución accidental se vería en
            todas las pantallas a la vez.
          </p>
        </Panel>

        <Panel
          titulo="Los cinco colores de marca"
          ayuda="Salen del arte oficial del fondo. Cada tarjeta de la carta usa uno."
        >
          <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(accents).map(([nombre, tokens]) => {
              const veces = uso.get(nombre) ?? 0;

              return (
                <li
                  key={nombre}
                  className="overflow-hidden rounded-xl border border-black/10"
                >
                  <div
                    className="flex items-center justify-between px-3 py-2.5"
                    style={{ backgroundColor: tokens.base, color: tokens.onBase }}
                  >
                    <span className="text-sm font-semibold capitalize">
                      {nombre}
                    </span>
                    {/* El precio, pintado igual que en la carta: es la prueba
                        de que el par de colores se lee. */}
                    <span className="font-[family-name:var(--font-body)] text-base font-semibold tabular-nums">
                      $72
                    </span>
                  </div>

                  <div className="px-3 py-2">
                    <p className="text-[0.7rem] text-tinta-suave">
                      {veces === 0
                        ? "Sin usar"
                        : `En ${veces} ${veces === 1 ? "tarjeta" : "tarjetas"}`}
                    </p>
                    <code className="text-[0.65rem] text-tinta-suave">
                      {tokens.base}
                    </code>
                  </div>
                </li>
              );
            })}
          </ul>

          <p className="mt-3 rounded-lg bg-black/[0.03] p-2.5 text-[0.7rem] leading-relaxed text-tinta-suave">
            El color de cada tarjeta se elige al editarla, en{" "}
            <Link href="/admin/categorias" className="font-medium text-morado hover:underline">
              Categorías
            </Link>
            . La paleta en sí no se edita desde el panel: cada color va
            emparejado con el del texto que lleva encima para que un precio se
            lea a distancia, y elegir un tono libre rompería ese par sin que
            nadie avise — simplemente los precios dejarían de leerse.
          </p>
        </Panel>

        <Panel titulo="Tipografías">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-black/10 p-3">
              <p
                className="text-2xl font-semibold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Frozen Yogurt
              </p>
              <p className="mt-1 text-xs font-medium">Fredoka</p>
              <p className="text-[0.7rem] text-tinta-suave">
                Títulos y nombres de tarjeta.
              </p>
            </div>

            <div className="rounded-xl border border-black/10 p-3">
              <p
                className="text-lg"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Nutella · Oreo · Plátano
              </p>
              <p className="mt-1 text-xs font-medium">Poppins</p>
              <p className="text-[0.7rem] text-tinta-suave">
                Productos, ingredientes y precios.
              </p>
            </div>
          </div>

          <p className="mt-3 rounded-lg bg-black/[0.03] p-2.5 text-[0.7rem] leading-relaxed text-tinta-suave">
            Se cargan con el sitio y van fijadas en el código. Cambiarlas es
            cambiar la marca, no el contenido, y además obliga a repasar todos
            los tamaños de la carta: una letra más ancha parte en dos líneas los
            nombres largos y descuadra las columnas.
          </p>
        </Panel>
      </div>
    </main>
  );
}
