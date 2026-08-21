"use client";

import { useActionState, useMemo, useState } from "react";

import { normalizar } from "@/lib/layout";
import {
  accionAlternarProducto,
  accionDestacarProducto,
  accionDuplicarProducto,
  accionEliminarProducto,
  accionMoverProducto,
  accionPrecioRapido,
  type Resultado,
} from "../acciones";
import { FormularioProducto } from "../componentes";
import {
  BotonAccion,
  BotonEliminar,
  Distintivo,
  Plegable,
  Vacio,
} from "../ui";
import {
  botonFantasma,
  botonSuave,
  campo,
} from "../estilos";

/** Un producto con todo lo que hace falta para pintarlo y editarlo. */
export interface Fila {
  id: string;
  nombre: string;
  descripcion?: string;
  precio?: number;
  precioTarjeta?: string;
  nota?: string;
  etiqueta?: "nuevo" | "favorito";
  visible: boolean;
  grupo: string;
  grupoLabel: string;
  bloque: string;
  categoria: string;
  categoriaNombre: string;
  /** Posicion dentro de su tarjeta, para saber si puede subir o bajar. */
  indice: number;
  total: number;
}

export interface OpcionCategoria {
  valor: string;
  texto: string;
}

/**
 * La tabla de productos.
 *
 * Filtra en el navegador y no en el servidor. Son doscientos y pico renglones:
 * caben de sobra en memoria, y buscar sin esperar a que el servidor conteste
 * es lo que convierte "buscar un sabor" en algo que se hace mientras se habla
 * con el proveedor por telefono.
 */
export function ListaProductos({
  filas,
  categorias,
}: {
  filas: Fila[];
  categorias: OpcionCategoria[];
}) {
  const [consulta, setConsulta] = useState("");
  const [categoria, setCategoria] = useState("");
  const [disponibilidad, setDisponibilidad] = useState<
    "todas" | "visibles" | "ocultos"
  >("todas");
  const [soloDestacados, setSoloDestacados] = useState(false);

  const visibles = useMemo(() => {
    const busqueda = normalizar(consulta.trim());

    return filas.filter((fila) => {
      if (categoria && `${fila.grupo}|${fila.bloque}|${fila.categoria}` !== categoria) {
        return false;
      }
      if (disponibilidad === "visibles" && !fila.visible) return false;
      if (disponibilidad === "ocultos" && fila.visible) return false;
      if (soloDestacados && !fila.etiqueta) return false;

      if (!busqueda) return true;

      // Se busca tambien en los ingredientes: media carta de Bobas se
      // distingue por lo que lleva dentro, no por el nombre.
      return (
        normalizar(fila.nombre).includes(busqueda) ||
        normalizar(fila.descripcion ?? "").includes(busqueda) ||
        normalizar(fila.categoriaNombre).includes(busqueda)
      );
    });
  }, [filas, consulta, categoria, disponibilidad, soloDestacados]);

  const hayFiltro =
    Boolean(consulta) || Boolean(categoria) || disponibilidad !== "todas" || soloDestacados;

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="rounded-2xl border border-black/10 bg-white p-3.5">
        <div className="flex flex-wrap gap-2">
          <div className="min-w-[12rem] flex-1">
            <input
              type="search"
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              placeholder="Buscar por nombre o ingrediente…"
              className={`${campo} w-full`}
            />
          </div>

          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className={`${campo} w-auto min-w-[11rem] flex-none`}
          >
            <option value="">Todas las categorías</option>
            {categorias.map((opcion) => (
              <option key={opcion.valor} value={opcion.valor}>
                {opcion.texto}
              </option>
            ))}
          </select>

          <select
            value={disponibilidad}
            onChange={(e) =>
              setDisponibilidad(e.target.value as typeof disponibilidad)
            }
            className={`${campo} w-auto flex-none`}
          >
            <option value="todas">Disponibles y ocultos</option>
            <option value="visibles">Solo disponibles</option>
            <option value="ocultos">Solo ocultos</option>
          </select>

          <button
            type="button"
            onClick={() => setSoloDestacados((v) => !v)}
            className={`${botonSuave} ${
              soloDestacados ? "border-morado bg-morado/10 text-[#5d3f7d]" : ""
            }`}
          >
            ⭐ Destacados
          </button>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-tinta-suave">
          <span>
            {visibles.length}{" "}
            {visibles.length === 1 ? "producto" : "productos"}
            {hayFiltro ? ` de ${filas.length}` : ""}
          </span>

          {hayFiltro ? (
            <button
              type="button"
              className={botonFantasma}
              onClick={() => {
                setConsulta("");
                setCategoria("");
                setDisponibilidad("todas");
                setSoloDestacados(false);
              }}
            >
              Quitar filtros
            </button>
          ) : null}
        </div>
      </div>

      {visibles.length === 0 ? (
        <Vacio>
          Ningún producto coincide con lo que buscas. Prueba a quitar algún
          filtro.
        </Vacio>
      ) : (
        <ul className="divide-y divide-black/8 overflow-hidden rounded-2xl border border-black/10 bg-white">
          {visibles.map((fila) => (
            <FilaProducto
              key={fila.id}
              fila={fila}
              categorias={categorias}
              /* Con un filtro puesto, la lista de pantalla no coincide con el
                 orden real, y las flechas moverian el producto respecto a
                 vecinos que no se ven. */
              puedeMover={!hayFiltro}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function FilaProducto({
  fila,
  categorias,
  puedeMover,
}: {
  fila: Fila;
  categorias: OpcionCategoria[];
  puedeMover: boolean;
}) {
  return (
    <li className={`p-3 sm:p-3.5 ${fila.visible ? "" : "bg-black/[0.02]"}`}>
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-[12rem] flex-1">
          <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
            <span className={fila.visible ? "" : "text-tinta-suave line-through"}>
              {fila.nombre}
            </span>

            {fila.etiqueta ? (
              <Distintivo tono="marca">
                {fila.etiqueta === "nuevo" ? "✦ Nuevo" : "♥ Favorito"}
              </Distintivo>
            ) : null}
            {!fila.visible ? <Distintivo tono="malo">Oculto</Distintivo> : null}
            {fila.nota ? <Distintivo>{fila.nota}</Distintivo> : null}
          </p>

          {fila.descripcion ? (
            <p className="mt-0.5 text-xs leading-snug text-tinta-suave">
              {fila.descripcion}
            </p>
          ) : null}

          <p className="mt-1 text-[0.7rem] text-tinta-suave">
            {fila.grupoLabel} · {fila.categoriaNombre}
          </p>
        </div>

        <PrecioRapido fila={fila} />

        <div className="flex flex-wrap items-center gap-1">
          <BotonAccion
            accion={accionDestacarProducto}
            campos={{ id: fila.id, tag: "favorito" }}
            titulo={
              fila.etiqueta === "favorito"
                ? "Quitar de favoritos"
                : "Marcar como favorito"
            }
            className={`${botonFantasma} ${
              fila.etiqueta === "favorito" ? "text-morado" : ""
            }`}
          >
            ♥
          </BotonAccion>

          <BotonAccion
            accion={accionDestacarProducto}
            campos={{ id: fila.id, tag: "nuevo" }}
            titulo={
              fila.etiqueta === "nuevo" ? "Quitar de novedades" : "Marcar como nuevo"
            }
            className={`${botonFantasma} ${
              fila.etiqueta === "nuevo" ? "text-morado" : ""
            }`}
          >
            ✦
          </BotonAccion>

          {puedeMover ? (
            <>
              <BotonAccion
                accion={accionMoverProducto}
                campos={{ id: fila.id, direccion: "arriba" }}
                titulo="Subir"
                deshabilitado={fila.indice === 0}
                className={botonFantasma}
              >
                ↑
              </BotonAccion>
              <BotonAccion
                accion={accionMoverProducto}
                campos={{ id: fila.id, direccion: "abajo" }}
                titulo="Bajar"
                deshabilitado={fila.indice === fila.total - 1}
                className={botonFantasma}
              >
                ↓
              </BotonAccion>
            </>
          ) : null}

          <BotonAccion
            accion={accionDuplicarProducto}
            campos={{ id: fila.id }}
            titulo="Duplicar (la copia nace oculta)"
            className={botonFantasma}
          >
            ⧉
          </BotonAccion>

          <BotonAccion
            accion={accionAlternarProducto}
            campos={{ id: fila.id }}
            className={botonSuave}
          >
            {fila.visible ? "Ocultar" : "Mostrar"}
          </BotonAccion>

          <BotonEliminar
            accion={accionEliminarProducto}
            campos={{ id: fila.id }}
            que={`“${fila.nombre}”`}
            className={botonSuave}
          />
        </div>
      </div>

      <div className="mt-1.5">
        <Plegable resumen="Editar todo">
          <FormularioProducto
            producto={{
              id: fila.id,
              name: fila.nombre,
              description: fila.descripcion,
              price: fila.precio,
              note: fila.nota,
              tag: fila.etiqueta,
              active: fila.visible,
            }}
            ubicacion={{
              grupo: fila.grupo,
              bloque: fila.bloque,
              categoria: fila.categoria,
            }}
            destinos={categorias}
          />
        </Plegable>
      </div>
    </li>
  );
}

/**
 * Precio editable sin salir de la lista.
 *
 * Es la edicion mas repetida de todas: sube un proveedor y hay que tocar
 * veinte renglones. Obligar a abrir el formulario completo para cambiar un
 * numero convierte diez minutos de trabajo en una hora.
 */
function PrecioRapido({ fila }: { fila: Fila }) {
  const [estado, accion] = useActionState<Resultado | null, FormData>(
    accionPrecioRapido,
    null,
  );
  const [tocado, setTocado] = useState(false);

  return (
    <form
      action={accion}
      onSubmit={() => setTocado(false)}
      className="flex shrink-0 items-center gap-1.5"
    >
      <input type="hidden" name="id" value={fila.id} />

      <div className="relative">
        <span className="absolute top-1/2 left-2 -translate-y-1/2 text-xs text-tinta-suave">
          $
        </span>
        <input
          name="price"
          data-precio-rapido=""
          type="number"
          inputMode="decimal"
          min="0"
          step="1"
          defaultValue={fila.precio ?? ""}
          onChange={() => setTocado(true)}
          placeholder={fila.precioTarjeta ?? "—"}
          title={
            fila.precio === undefined
              ? `Sin precio propio: usa el de la tarjeta (${fila.precioTarjeta ?? "sin precio"})`
              : "Precio propio de este renglón"
          }
          className={`${campo} w-24 py-1.5 pl-5 text-sm tabular-nums`}
        />
      </div>

      {tocado ? (
        <button type="submit" className={`${botonSuave} px-2 py-1`}>
          Guardar
        </button>
      ) : estado?.ok ? (
        <span className="text-xs font-medium text-emerald-700" role="status">
          ✓
        </span>
      ) : estado && !estado.ok ? (
        <span className="text-xs text-red-700" role="alert" title={estado.mensaje}>
          !
        </span>
      ) : null}
    </form>
  );
}
