import { redirect } from "next/navigation";

import { toMenuItem, toPriceTiers } from "@/data/types";
import { leerContenido } from "@/lib/contenido";
import { formatPrice } from "@/lib/format";
import { haySesion } from "@/lib/sesion";
import { moduloDe } from "../modulos";
import { CabeceraModulo } from "../ui";
import { ListaProductos, type Fila, type OpcionCategoria } from "./lista";

/**
 * Modulo de productos: todos los de la carta en una sola lista.
 *
 * Antes habia que saber en que menu vivia un sabor para poder tocarlo. Pero
 * quien administra no piensa por menus, piensa por producto: "el Taro subio de
 * precio", "se acabo el Yakult". Aqui se busca por nombre y aparece, este
 * donde este.
 */
export default async function ModuloProductos() {
  if (!(await haySesion())) redirect("/admin/entrar");

  const modulo = moduloDe("productos")!;
  const { groups } = await leerContenido();

  const filas: Fila[] = [];
  const categorias: OpcionCategoria[] = [];

  for (const grupo of groups) {
    for (const bloque of grupo.screens) {
      for (const categoria of bloque.categories) {
        categorias.push({
          valor: `${grupo.slug}|${bloque.slug}|${categoria.id}`,
          texto: `${grupo.label} · ${bloque.section ?? bloque.title} · ${categoria.name}`,
        });

        /*
         * El precio de la tarjeta se pasa como texto de referencia. Un renglon
         * sin precio propio no cuesta cero: cuesta lo que diga su tarjeta, y
         * ensenarlo como marcador de posicion evita que alguien "arregle" un
         * hueco escribiendo un precio que ya estaba puesto mas arriba.
         */
        const tramos = toPriceTiers(categoria.price);
        const precioTarjeta =
          tramos.length === 0
            ? undefined
            : tramos
                .map((tramo) =>
                  tramo.label
                    ? `${tramo.label} ${formatPrice(tramo.value)}`
                    : formatPrice(tramo.value),
                )
                .join(" · ");

        categoria.items.forEach((crudo, indice) => {
          const item = toMenuItem(crudo);
          if (!item.id) return;

          filas.push({
            id: item.id,
            nombre: item.name,
            descripcion: item.description,
            precio: item.price,
            precioTarjeta,
            nota: item.note,
            etiqueta: item.tag,
            visible: item.active !== false,
            grupo: grupo.slug,
            grupoLabel: grupo.label,
            bloque: bloque.slug,
            categoria: categoria.id,
            categoriaNombre: categoria.name,
            indice,
            total: categoria.items.length,
          });
        });
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

      <ListaProductos filas={filas} categorias={categorias} />

      <p className="mt-4 text-xs leading-relaxed text-tinta-suave">
        Para <strong>crear</strong> un producto entra a su categoría: hace falta
        decir en qué tarjeta va, y eso se elige mejor viendo la tarjeta. Duplicar
        uno parecido (⧉) suele ser más rápido — la copia nace oculta para que
        nadie la vea a medio hacer.
      </p>
    </main>
  );
}
