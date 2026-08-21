import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { leerContenido } from "@/lib/contenido";
import { haySesion } from "@/lib/sesion";
import { FormularioPortada } from "../formularios-sitio";
import { moduloDe } from "../modulos";
import {
  CabeceraModulo,
  Panel,
} from "../ui";
import {
  botonSuave,
} from "../estilos";

/**
 * Modulo de portada: lo que se ve nada mas escanear el codigo QR.
 *
 * Son tres piezas y se administran juntas porque se leen juntas, de arriba
 * abajo, en los dos segundos que tarda alguien en confirmar que abrio lo que
 * queria abrir.
 */
export default async function ModuloPortada() {
  if (!(await haySesion())) redirect("/admin/entrar");

  const modulo = moduloDe("portada")!;
  const { site } = await leerContenido();

  return (
    <main>
      <CabeceraModulo
        icono={modulo.icono}
        nombre={modulo.nombre}
        alcance={modulo.alcance}
        volverA="/admin"
        volverTexto="Inicio"
        acciones={
          <Link href="/admin/vista-previa" className={botonSuave}>
            👁 Ver cómo queda
          </Link>
        }
      />

      <div className="space-y-4">
        <Panel
          titulo="El logo"
          ayuda="Es la primera pieza de la portada y también el icono de la pestaña."
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="grid h-16 w-40 place-items-center rounded-xl bg-black/[0.04] px-3">
              <Image
                src={site.logo}
                alt={site.brand}
                width={266}
                height={108}
                className="max-h-full w-auto object-contain"
              />
            </div>

            <div className="min-w-[12rem] flex-1">
              <p className="text-xs text-tinta-suave">
                Archivo: <code>{site.logo}</code>
              </p>
              <Link
                href="/admin/apariencia"
                className="mt-1.5 inline-block text-xs font-medium text-morado hover:underline"
              >
                Cambiar el logo en Apariencia →
              </Link>
            </div>
          </div>
        </Panel>

        <Panel
          titulo="Los textos"
          ayuda="Van bajo el logo, en este orden."
        >
          <FormularioPortada
            subtitle={site.subtitle}
            intro={site.intro ?? ""}
          />
        </Panel>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-tinta-suave">
        Esta carta no tiene banner ni botón de llamada a la acción, y es a
        propósito: se abre con el teléfono ya en la mesa, así que lo que hace
        falta es llegar a los precios cuanto antes. La barra de menús toma el
        relevo en cuanto se empieza a bajar.
      </p>
    </main>
  );
}
