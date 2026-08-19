"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import type { Accent, ItemTag, MenuItem, MenuLayout } from "@/data/types";
import { getAccent } from "@/lib/accents";
import { ACENTOS, ETIQUETAS, REPARTOS } from "@/lib/editor";
import {
  accionAgregarCategoria,
  accionAgregarProducto,
  accionEditarBloque,
  accionEditarCategoria,
  accionEditarMenu,
  accionEditarProducto,
  entrar,
  type Resultado,
} from "./acciones";

/**
 * Piezas interactivas del panel.
 *
 * Los formularios se envian con Server Actions, asi que no hay `fetch`, ni
 * estado duplicado del menu en el navegador, ni una copia de los datos que se
 * pueda quedar vieja: se guarda en el servidor y la pagina se vuelve a pintar
 * con lo que quedo en disco. Es tambien lo que evita el fallo clasico de estos
 * paneles —que la pantalla diga "guardado" y el archivo no haya cambiado—,
 * porque lo que se ve al recargar sale del archivo, no de la memoria.
 */

// ---------------------------------------------------------------------------
// Estilos compartidos
// ---------------------------------------------------------------------------

const campo =
  "w-full rounded-lg border border-black/12 bg-white px-3 py-2 text-sm text-tinta outline-none focus:border-morado focus:ring-2 focus:ring-morado/25";

const etiquetaCampo = "block text-xs font-medium text-tinta-suave";

const boton =
  "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50";

const botonPrimario = `${boton} bg-morado text-white hover:bg-morado/90`;
const botonSuave = `${boton} border border-black/12 bg-white text-tinta hover:bg-black/[0.04]`;
const botonPeligro = `${boton} border border-red-300 bg-white text-red-700 hover:bg-red-50`;

function Campo({
  etiqueta,
  ayuda,
  children,
}: {
  etiqueta: string;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className={etiquetaCampo}>{etiqueta}</span>
      {children}
      {ayuda ? (
        <span className="mt-0.5 block text-[0.68rem] leading-snug text-tinta-suave">
          {ayuda}
        </span>
      ) : null}
    </label>
  );
}

/** Boton de envio que se apaga solo mientras la accion esta en vuelo. */
function Enviar({ children = "Guardar" }: { children?: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={botonPrimario} disabled={pending}>
      {pending ? "Guardando…" : children}
    </button>
  );
}

function Aviso({ estado }: { estado: Resultado | null }) {
  if (!estado) return null;

  return (
    <p
      role="status"
      className={`text-xs ${estado.ok ? "text-emerald-700" : "text-red-700"}`}
    >
      {estado.ok ? "Guardado." : estado.mensaje}
    </p>
  );
}

/**
 * Bloque plegable.
 *
 * `<details>` nativo en vez de un modal: se abre sin JavaScript, el navegador
 * ya sabe hacerlo accesible, y sobre todo se pueden tener varios abiertos a la
 * vez, que es justo lo que se hace al comparar dos precios.
 */
export function Plegable({
  resumen,
  children,
  abierto,
}: {
  resumen: React.ReactNode;
  children: React.ReactNode;
  abierto?: boolean;
}) {
  return (
    <details open={abierto} className="group">
      <summary className="cursor-pointer list-none rounded-lg px-2 py-1.5 text-xs font-medium text-morado hover:bg-morado/8 [&::-webkit-details-marker]:hidden">
        {resumen}
      </summary>
      <div className="mt-2 rounded-xl border border-black/10 bg-white p-3">
        {children}
      </div>
    </details>
  );
}

// ---------------------------------------------------------------------------
// Entrar
// ---------------------------------------------------------------------------

export function FormularioEntrar() {
  const [estado, accion] = useActionState<Resultado | null, FormData>(
    entrar,
    null,
  );

  return (
    <form action={accion} className="mt-8 space-y-3">
      <Campo etiqueta="Contraseña">
        <input
          type="password"
          name="password"
          required
          autoFocus
          autoComplete="current-password"
          className={`${campo} mt-1`}
        />
      </Campo>

      <Aviso estado={estado} />
      <Enviar>Entrar</Enviar>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Confirmacion de borrado
// ---------------------------------------------------------------------------

/**
 * Eliminar en dos toques.
 *
 * No usa `window.confirm`: ese dialogo bloquea el navegador entero y en un
 * movil aparece pegado arriba, lejos del renglon que se iba a borrar, asi que
 * se acepta sin mirar. Aqui la confirmacion sale EN el sitio, dice el nombre
 * de lo que se va a borrar y se puede cancelar con el pulgar.
 */
export function BotonEliminar({
  accion,
  campos,
  que,
  aviso,
}: {
  accion: (formulario: FormData) => Promise<void>;
  campos: Record<string, string>;
  que: string;
  aviso?: string;
}) {
  const [confirmando, setConfirmando] = useState(false);

  if (!confirmando) {
    return (
      <button
        type="button"
        className={botonSuave}
        onClick={() => setConfirmando(true)}
      >
        Eliminar
      </button>
    );
  }

  return (
    <form action={accion} className="flex flex-wrap items-center gap-2">
      {Object.entries(campos).map(([nombre, valor]) => (
        <input key={nombre} type="hidden" name={nombre} value={valor} />
      ))}

      <span className="text-xs text-red-700">
        ¿Eliminar {que}?{aviso ? ` ${aviso}` : ""}
      </span>

      <button type="submit" className={botonPeligro}>
        Sí, eliminar
      </button>
      <button
        type="button"
        className={botonSuave}
        onClick={() => setConfirmando(false)}
      >
        Cancelar
      </button>
    </form>
  );
}

/** Boton suelto que dispara una accion sin formulario visible. */
export function BotonAccion({
  accion,
  campos,
  children,
  titulo,
  deshabilitado,
}: {
  accion: (formulario: FormData) => Promise<void>;
  campos: Record<string, string>;
  children: React.ReactNode;
  titulo?: string;
  deshabilitado?: boolean;
}) {
  return (
    <form action={accion} className="inline">
      {Object.entries(campos).map(([nombre, valor]) => (
        <input key={nombre} type="hidden" name={nombre} value={valor} />
      ))}
      <button
        type="submit"
        title={titulo}
        disabled={deshabilitado}
        className={botonSuave}
      >
        {children}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Producto
// ---------------------------------------------------------------------------

export interface DestinoPosible {
  valor: string;
  texto: string;
}

/**
 * Alta y edicion de un producto: el mismo formulario para las dos cosas.
 *
 * Duplicarlo era la otra opcion, y significa que el dia que se anada un campo
 * hay que acordarse de tocarlo en dos sitios. Aqui la unica diferencia es si
 * viaja el `id` y a que accion se envia.
 */
export function FormularioProducto({
  producto,
  ubicacion,
  destinos,
  alTerminar,
}: {
  producto?: MenuItem;
  ubicacion: { grupo: string; bloque: string; categoria: string };
  /** Categorias a las que se puede mover. Solo al editar. */
  destinos?: DestinoPosible[];
  alTerminar?: string;
}) {
  const editando = Boolean(producto?.id);
  const [estado, accion] = useActionState<Resultado | null, FormData>(
    editando ? accionEditarProducto : accionAgregarProducto,
    null,
  );

  const actual = `${ubicacion.grupo}|${ubicacion.bloque}|${ubicacion.categoria}`;

  return (
    <form action={accion} className="space-y-3">
      <input type="hidden" name="grupo" value={ubicacion.grupo} />
      <input type="hidden" name="bloque" value={ubicacion.bloque} />
      <input type="hidden" name="categoria" value={ubicacion.categoria} />
      {editando ? <input type="hidden" name="id" value={producto?.id} /> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Campo etiqueta="Nombre">
          <input
            name="name"
            required
            defaultValue={producto?.name ?? ""}
            className={`${campo} mt-1`}
          />
        </Campo>

        <Campo
          etiqueta="Precio propio"
          ayuda="Solo si este renglón cuesta distinto al resto. Vacío = usa el precio de la tarjeta."
        >
          <input
            name="price"
            type="number"
            inputMode="decimal"
            step="1"
            min="0"
            defaultValue={producto?.price ?? ""}
            className={`${campo} mt-1`}
          />
        </Campo>
      </div>

      <Campo
        etiqueta="Descripción"
        ayuda="Los ingredientes, como en las combinaciones: “Nutella · Oreo · Plátano”."
      >
        <input
          name="description"
          defaultValue={producto?.description ?? ""}
          className={`${campo} mt-1`}
        />
      </Campo>

      <div className="grid gap-3 sm:grid-cols-2">
        <Campo etiqueta="Nota corta" ayuda="Una aclaración: “+$10”, “solo 24 oz”.">
          <input
            name="note"
            defaultValue={producto?.note ?? ""}
            className={`${campo} mt-1`}
          />
        </Campo>

        <Campo etiqueta="Insignia">
          <select
            name="tag"
            defaultValue={producto?.tag ?? ""}
            className={`${campo} mt-1`}
          >
            <option value="">Sin insignia</option>
            {ETIQUETAS.map((etiqueta) => (
              <option key={etiqueta} value={etiqueta}>
                {etiqueta === "nuevo" ? "Nuevo" : "Favorito"}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      {editando && destinos && destinos.length > 1 ? (
        <Campo
          etiqueta="Categoría"
          ayuda="Cambiarla mueve el producto a otra tarjeta de la carta."
        >
          <select name="destino" defaultValue={actual} className={`${campo} mt-1`}>
            {destinos.map((destino) => (
              <option key={destino.valor} value={destino.valor}>
                {destino.texto}
              </option>
            ))}
          </select>
        </Campo>
      ) : null}

      <label className="flex items-center gap-2 text-xs text-tinta">
        <input
          type="checkbox"
          name="active"
          defaultChecked={producto ? producto.active !== false : true}
          className="size-4 accent-[#9371b0]"
        />
        Visible en la carta
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <Enviar>{editando ? "Guardar cambios" : "Agregar producto"}</Enviar>
        <Aviso estado={estado} />
      </div>

      {alTerminar ? (
        <p className="text-[0.68rem] text-tinta-suave">{alTerminar}</p>
      ) : null}
    </form>
  );
}

// ---------------------------------------------------------------------------
// Categoria (la tarjeta y su cinta de color)
// ---------------------------------------------------------------------------

/**
 * Elige el color de la cinta superior de la tarjeta.
 *
 * Son cinco muestras del color real, no una lista de nombres: "lavanda" y
 * "morado" no se distinguen leyendolos, y quien edita la carta esta pensando
 * en como se va a ver, no en como se llama.
 */
function ElectorAcento({ actual }: { actual: Accent }) {
  const [elegido, setElegido] = useState<Accent>(actual);

  return (
    <fieldset>
      <legend className={etiquetaCampo}>Color de la cinta</legend>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {ACENTOS.map((acento) => {
          const tokens = getAccent(acento);
          const activo = elegido === acento;

          return (
            <label
              key={acento}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[0.7rem] capitalize transition-colors ${
                activo
                  ? "border-morado bg-morado/8 font-medium"
                  : "border-black/12 bg-white"
              }`}
            >
              <input
                type="radio"
                name="accent"
                value={acento}
                checked={activo}
                onChange={() => setElegido(acento)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className="h-3 w-6 rounded-full"
                style={{ backgroundColor: tokens.base }}
              />
              {acento}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * Precios por tamanio.
 *
 * Se pueden anadir y quitar filas porque no todas las tarjetas tienen los
 * mismos tamanios: las sodas van en 16 y 24 oz, y el frozen yogurt ni siquiera
 * usa este modo. Dejar dos filas fijas obligaria a inventarse un tamanio.
 */
function CamposTramos({ iniciales }: { iniciales: { label: string; value: number }[] }) {
  const [tramos, setTramos] = useState(
    iniciales.length > 0 ? iniciales : [{ label: "", value: 0 }],
  );

  return (
    <div className="space-y-2">
      <span className={etiquetaCampo}>Precios por tamaño</span>

      {tramos.map((tramo, indice) => (
        <div key={indice} className="flex items-center gap-2">
          <input
            name="tramoLabel"
            placeholder="16 oz"
            defaultValue={tramo.label}
            className={`${campo} flex-1`}
          />
          <input
            name="tramoValue"
            type="number"
            inputMode="decimal"
            min="0"
            placeholder="65"
            defaultValue={tramo.value || ""}
            className={`${campo} w-24`}
          />
          <button
            type="button"
            className={botonSuave}
            onClick={() =>
              setTramos((previos) => previos.filter((_, i) => i !== indice))
            }
          >
            Quitar
          </button>
        </div>
      ))}

      <button
        type="button"
        className={botonSuave}
        onClick={() => setTramos((previos) => [...previos, { label: "", value: 0 }])}
      >
        Añadir tamaño
      </button>
    </div>
  );
}

export function FormularioCategoria({
  categoria,
  ubicacion,
}: {
  categoria?: {
    name: string;
    description?: string;
    accent: Accent;
    price?: number | { label: string; value: number }[];
    columns?: number;
    active?: boolean;
  };
  ubicacion: { grupo: string; bloque: string; categoria?: string };
}) {
  const editando = Boolean(ubicacion.categoria);
  const [estado, accion] = useActionState<Resultado | null, FormData>(
    editando ? accionEditarCategoria : accionAgregarCategoria,
    null,
  );

  const precio = categoria?.price;
  const tramosIniciales = Array.isArray(precio) ? precio : [];
  const unicoInicial = typeof precio === "number" ? precio : "";

  return (
    <form action={accion} className="space-y-3">
      <input type="hidden" name="grupo" value={ubicacion.grupo} />
      <input type="hidden" name="bloque" value={ubicacion.bloque} />
      {editando ? (
        <input type="hidden" name="categoria" value={ubicacion.categoria} />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Campo etiqueta="Nombre de la tarjeta">
          <input
            name="name"
            required
            defaultValue={categoria?.name ?? ""}
            className={`${campo} mt-1`}
          />
        </Campo>

        <Campo etiqueta="Línea de apoyo" ayuda="Opcional, bajo el nombre.">
          <input
            name="description"
            defaultValue={categoria?.description ?? ""}
            className={`${campo} mt-1`}
          />
        </Campo>
      </div>

      <ElectorAcento actual={categoria?.accent ?? "rosa"} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Campo
          etiqueta="Precio único"
          ayuda="Déjalo vacío si usas precios por tamaño o si cada producto trae el suyo."
        >
          <input
            name="precioUnico"
            type="number"
            inputMode="decimal"
            min="0"
            defaultValue={unicoInicial}
            className={`${campo} mt-1`}
          />
        </Campo>

        <Campo
          etiqueta="Columnas"
          ayuda="Vacío = lo decide el ancho de la pantalla. Úsalo solo para listas de tarifas."
        >
          <input
            name="columns"
            type="number"
            min="1"
            max="4"
            defaultValue={categoria?.columns ?? ""}
            className={`${campo} mt-1`}
          />
        </Campo>
      </div>

      <CamposTramos iniciales={tramosIniciales} />

      <label className="flex items-center gap-2 text-xs text-tinta">
        <input
          type="checkbox"
          name="active"
          defaultChecked={categoria ? categoria.active !== false : true}
          className="size-4 accent-[#9371b0]"
        />
        Visible en la carta
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <Enviar>{editando ? "Guardar tarjeta" : "Crear tarjeta"}</Enviar>
        <Aviso estado={estado} />
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Bloque
// ---------------------------------------------------------------------------

export function FormularioBloque({
  grupo,
  bloque,
}: {
  grupo: string;
  bloque: {
    slug: string;
    title: string;
    section?: string;
    tagline?: string;
    preparation?: string | null;
    layout?: MenuLayout;
    footnote?: string;
    active?: boolean;
  };
}) {
  const [estado, accion] = useActionState<Resultado | null, FormData>(
    accionEditarBloque,
    null,
  );

  const modoInicial =
    bloque.preparation === null
      ? "ocultar"
      : bloque.preparation
        ? "propia"
        : "heredar";
  const [modo, setModo] = useState(modoInicial);

  return (
    <form action={accion} className="space-y-3">
      <input type="hidden" name="grupo" value={grupo} />
      <input type="hidden" name="bloque" value={bloque.slug} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Campo etiqueta="Título" ayuda="El nombre grande del menú.">
          <input
            name="title"
            required
            defaultValue={bloque.title}
            className={`${campo} mt-1`}
          />
        </Campo>

        <Campo etiqueta="Sección" ayuda="“Sabores”, “Combinaciones · Agua”…">
          <input
            name="section"
            defaultValue={bloque.section ?? ""}
            className={`${campo} mt-1`}
          />
        </Campo>
      </div>

      <Campo etiqueta="Frase corta" ayuda="Opcional, bajo el título.">
        <input
          name="tagline"
          defaultValue={bloque.tagline ?? ""}
          className={`${campo} mt-1`}
        />
      </Campo>

      <fieldset>
        <legend className={etiquetaCampo}>Forma de preparación</legend>
        <div className="mt-1.5 space-y-1.5">
          {[
            { valor: "heredar", texto: "La general (hoy: ninguna)" },
            { valor: "propia", texto: "Una propia de este menú" },
            { valor: "ocultar", texto: "Ninguna, aunque la general exista" },
          ].map((opcion) => (
            <label
              key={opcion.valor}
              className="flex items-center gap-2 text-xs text-tinta"
            >
              <input
                type="radio"
                name="modoPreparacion"
                value={opcion.valor}
                checked={modo === opcion.valor}
                onChange={() => setModo(opcion.valor)}
                className="size-3.5 accent-[#9371b0]"
              />
              {opcion.texto}
            </label>
          ))}
        </div>

        {modo === "propia" ? (
          <input
            name="preparation"
            defaultValue={bloque.preparation ?? ""}
            placeholder="Latte o Frape"
            className={`${campo} mt-2`}
          />
        ) : null}
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <Campo
          etiqueta="Reparto de tarjetas"
          ayuda="Cómo se agrupan en pantalla ancha. En el móvil siempre va una por fila."
        >
          <select
            name="layout"
            defaultValue={bloque.layout ?? ""}
            className={`${campo} mt-1`}
          >
            <option value="">Automático</option>
            {REPARTOS.map((reparto) => (
              <option key={reparto} value={reparto}>
                {reparto}
              </option>
            ))}
          </select>
        </Campo>

        <Campo etiqueta="Nota al pie" ayuda="Opcional, bajo las tarjetas.">
          <input
            name="footnote"
            defaultValue={bloque.footnote ?? ""}
            className={`${campo} mt-1`}
          />
        </Campo>
      </div>

      <label className="flex items-center gap-2 text-xs text-tinta">
        <input
          type="checkbox"
          name="active"
          defaultChecked={bloque.active !== false}
          className="size-4 accent-[#9371b0]"
        />
        Visible en la carta
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <Enviar>Guardar bloque</Enviar>
        <Aviso estado={estado} />
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

export function FormularioMenu({
  grupo,
  label,
  active,
}: {
  grupo: string;
  label: string;
  active?: boolean;
}) {
  const [estado, accion] = useActionState<Resultado | null, FormData>(
    accionEditarMenu,
    null,
  );

  return (
    <form action={accion} className="space-y-3">
      <input type="hidden" name="grupo" value={grupo} />

      <Campo
        etiqueta="Nombre en la barra"
        ayuda="El texto del botón que lleva a este menú."
      >
        <input name="label" required defaultValue={label} className={`${campo} mt-1`} />
      </Campo>

      <label className="flex items-center gap-2 text-xs text-tinta">
        <input
          type="checkbox"
          name="active"
          defaultChecked={active !== false}
          className="size-4 accent-[#9371b0]"
        />
        Visible en la carta
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <Enviar>Guardar menú</Enviar>
        <Aviso estado={estado} />
      </div>
    </form>
  );
}

export { botonSuave, botonPrimario };
export type { ItemTag };
