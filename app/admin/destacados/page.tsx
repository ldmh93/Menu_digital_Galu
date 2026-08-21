import Link from "next/link";
import { redirect } from "next/navigation";

import { toMenuItem } from "@/data/types";
import { leerContenido } from "@/lib/contenido";
import { haySesion } from "@/lib/sesion";
import {
  accionAlternarProducto,
  accionDestacarProducto,
  accionMoverProducto,
} from "../acciones";
import { moduloDe } from "../modulos";
import {
  BotonAccion,
  CabeceraModulo,
  Distintivo,
  Panel,
  Vacio,
} from "../ui";
import {
  botonFantasma,
  botonSuave,
} from "../estilos";

/**
 * Modulo de destacados: los productos con insignia.
 *
 * Conviene saber que hacen en la carta. NO hay una seccion de destacados: cada
 * uno sale en su sitio de siempre, con un icono al lado del nombre. Son dos
 * insignias y significan cosas distintas —"nuevo" es una novedad que caduca,
 * "favorito" es lo que mas se pide— y por eso se administran separadas.
 *
 * La lista sirve sobre todo para lo que se olvida: repasar cada cierto tiempo
 * que lo marcado como "nuevo" siga siendo nuevo. Una novedad de hace un anio
 * le resta credibilidad a todas las demas.
 */
export default async function ModuloDestacados() {
  if (!(await haySesion())) redirect("/admin/entrar");

  const modulo = moduloDe("destacados")!;
  const { groups } = await leerContenido();

  interface Destacado {
    id: string;
    nombre: string;
    etiqueta: "nuevo" | "favorito";
    visible: boolean;
    donde: string;
    indice: number;
    total: number;
  }

  const destacados: Destacado[] = [];
  for (const grupo of groups) {
    for (const bloque of grupo.screens) {
      for (const categoria of bloque.categories) {
        categoria.items.forEach((crudo, indice) => {
          const item = toMenuItem(crudo);
          if (!item.id || !item.tag) return;

          destacados.push({
            id: item.id,
            nombre: item.name,
            etiqueta: item.tag,
            visible: item.active !== false,
            donde: `${grupo.label} · ${categoria.name}`,
            indice,
            total: categoria.items.length,
          });
        });
      }
    }
  }

  const nuevos = destacados.filter((d) => d.etiqueta === "nuevo");
  const favoritos = destacados.filter((d) => d.etiqueta === "favorito");

  return (
    <main>
      <CabeceraModulo
        icono={modulo.icono}
        nombre={modulo.nombre}
        alcance={modulo.alcance}
        volverA="/admin"
        volverTexto="Inicio"
        acciones={
          <Link href="/admin/productos" className={botonSuave}>
            Marcar más productos →
          </Link>
        }
      />

      <div className="space-y-4">
        <Panel
          titulo="✦ Novedades"
          ayuda="Salen con una chispa al lado del nombre. Repásalas de vez en cuando: lo que lleva meses marcado como nuevo deja de contar como novedad."
        >
          <Grupo lista={nuevos} vacio="Ningún producto marcado como nuevo." />
        </Panel>

        <Panel
          titulo="♥ Favoritos de la casa"
          ayuda="Salen con un corazón. Sirven para orientar a quien no sabe qué pedir, así que conviene que sean pocos."
        >
          <Grupo
            lista={favoritos}
            vacio="Ningún producto marcado como favorito."
          />
        </Panel>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-tinta-suave">
        Para marcar un producto, búscalo en{" "}
        <Link href="/admin/productos" className="font-medium text-morado hover:underline">
          Productos
        </Link>{" "}
        y pulsa ✦ o ♥ en su fila. Un producto solo puede llevar una insignia:
        ponerle la otra sustituye a la anterior.
      </p>
    </main>
  );

  function Grupo({
    lista,
    vacio,
  }: {
    lista: Destacado[];
    vacio: string;
  }) {
    if (lista.length === 0) return <Vacio>{vacio}</Vacio>;

    return (
      <ul className="divide-y divide-black/8">
        {lista.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center gap-3 py-2.5 first:pt-0 last:pb-0"
          >
            <div className="min-w-[10rem] flex-1">
              <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                <span className={item.visible ? "" : "text-tinta-suave line-through"}>
                  {item.nombre}
                </span>
                {!item.visible ? <Distintivo tono="malo">Oculto</Distintivo> : null}
              </p>
              <p className="mt-0.5 text-[0.7rem] text-tinta-suave">{item.donde}</p>
            </div>

            <div className="flex flex-wrap items-center gap-1">
              <BotonAccion
                accion={accionMoverProducto}
                campos={{ id: item.id, direccion: "arriba" }}
                titulo="Subir dentro de su tarjeta"
                deshabilitado={item.indice === 0}
                className={botonFantasma}
              >
                ↑
              </BotonAccion>
              <BotonAccion
                accion={accionMoverProducto}
                campos={{ id: item.id, direccion: "abajo" }}
                titulo="Bajar dentro de su tarjeta"
                deshabilitado={item.indice === item.total - 1}
                className={botonFantasma}
              >
                ↓
              </BotonAccion>

              <BotonAccion
                accion={accionAlternarProducto}
                campos={{ id: item.id }}
                className={botonSuave}
              >
                {item.visible ? "Ocultar" : "Mostrar"}
              </BotonAccion>

              <BotonAccion
                accion={accionDestacarProducto}
                campos={{ id: item.id, tag: item.etiqueta }}
                titulo="Quitar la insignia"
                className={botonSuave}
              >
                Quitar insignia
              </BotonAccion>
            </div>
          </li>
        ))}
      </ul>
    );
  }
}
