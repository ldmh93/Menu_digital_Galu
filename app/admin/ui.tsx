"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import type { Resultado } from "./acciones";
import {
  botonPeligro,
  botonPrimario,
  botonSuave,
  campo,
} from "./estilos";

/**
 * Piezas visuales comunes del panel.
 *
 * Todos los modulos se dibujan con estas, para que administrar productos y
 * administrar imagenes se sientan el mismo programa. Cuando cada pantalla se
 * inventa sus propios botones, quien la usa tiene que volver a aprender donde
 * esta todo en cada seccion.
 */

// ---------------------------------------------------------------------------
// Estructura de pagina
// ---------------------------------------------------------------------------

/**
 * Cabecera de un modulo.
 *
 * Siempre dice DONDE esta uno y QUE puede cambiar aqui. Es la respuesta a la
 * pregunta que se hace cualquiera al entrar a una pantalla de administracion
 * que no usa todos los dias.
 */
export function CabeceraModulo({
  icono,
  nombre,
  alcance,
  acciones,
  volverA,
  volverTexto,
}: {
  icono: string;
  nombre: string;
  alcance: string;
  acciones?: React.ReactNode;
  volverA?: string;
  volverTexto?: string;
}) {
  return (
    <header className="mb-7">
      {volverA ? (
        <Link
          href={volverA}
          className="mb-3 inline-block text-xs font-medium text-tinta-suave hover:text-morado"
        >
          ← {volverTexto ?? "Volver"}
        </Link>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2.5 font-[family-name:var(--font-display)] text-2xl font-semibold sm:text-[1.75rem]">
            <span aria-hidden="true">{icono}</span>
            {nombre}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-tinta-suave">
            {alcance}
          </p>
        </div>

        {acciones ? (
          <div className="flex flex-wrap items-center gap-2">{acciones}</div>
        ) : null}
      </div>
    </header>
  );
}

/** Caja blanca con titulo. La unidad de agrupacion dentro de un modulo. */
export function Panel({
  titulo,
  ayuda,
  acciones,
  children,
  atenuado,
}: {
  titulo?: string;
  ayuda?: string;
  acciones?: React.ReactNode;
  children: React.ReactNode;
  atenuado?: boolean;
}) {
  return (
    <section
      className={`rounded-2xl border border-black/10 bg-white p-4 sm:p-5 ${
        atenuado ? "opacity-60" : ""
      }`}
    >
      {titulo || acciones ? (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {titulo ? (
              <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">
                {titulo}
              </h2>
            ) : null}
            {ayuda ? (
              <p className="mt-1 text-xs leading-relaxed text-tinta-suave">{ayuda}</p>
            ) : null}
          </div>
          {acciones ? (
            <div className="flex flex-wrap items-center gap-2">{acciones}</div>
          ) : null}
        </div>
      ) : null}

      {children}
    </section>
  );
}

/** Cuando no hay nada que enseniar, se dice por que y que hacer. */
export function Vacio({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-black/15 px-4 py-6 text-center text-xs text-tinta-suave">
      {children}
    </p>
  );
}

/** Distintivo corto: estado, insignia, recuento. */
export function Distintivo({
  tono = "neutro",
  children,
}: {
  tono?: "neutro" | "bien" | "aviso" | "malo" | "marca";
  children: React.ReactNode;
}) {
  const tonos = {
    neutro: "bg-black/[0.06] text-tinta-suave",
    bien: "bg-emerald-100 text-emerald-800",
    aviso: "bg-amber-100 text-amber-900",
    malo: "bg-red-100 text-red-700",
    marca: "bg-morado/12 text-[#6b4b8a]",
  } as const;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.65rem] font-medium ${tonos[tono]}`}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Formularios
// ---------------------------------------------------------------------------

export function Campo({
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
      <span className="block text-xs font-medium text-tinta-suave">{etiqueta}</span>
      {children}
      {ayuda ? (
        <span className="mt-1 block text-[0.68rem] leading-snug text-tinta-suave">
          {ayuda}
        </span>
      ) : null}
    </label>
  );
}

export function Interruptor({
  nombre,
  marcado,
  etiqueta,
}: {
  nombre: string;
  marcado: boolean;
  etiqueta: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs text-tinta">
      <input
        type="checkbox"
        name={nombre}
        defaultChecked={marcado}
        className="size-4 accent-[#9371b0]"
      />
      {etiqueta}
    </label>
  );
}

/** Boton de envio que se apaga solo mientras la accion viaja al servidor. */
export function Enviar({
  children = "Guardar cambios",
  className = botonPrimario,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? "Guardando…" : children}
    </button>
  );
}

/**
 * Barra de estado de un formulario.
 *
 * Responde a la unica pregunta que importa mientras se edita: ¿esto ya quedo
 * guardado o todavia no? Tiene tres estados y ninguno se parece a otro de
 * lejos, porque se mira de reojo mientras se escribe:
 *
 *   en reposo             — nada que decir
 *   cambios sin guardar   — ambar, con el boton al lado
 *   guardado              — verde, con la marca
 *
 * La confirmacion se va sola a los pocos segundos. Si se quedara fija, la
 * siguiente vez que se mire no se sabria si es de este cambio o del anterior.
 */
export function EstadoFormulario({
  sucio,
  estado,
  children = "Guardar cambios",
}: {
  sucio: boolean;
  estado: Resultado | null;
  children?: React.ReactNode;
}) {
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    if (!estado?.ok) return;

    setConfirmando(true);
    const temporizador = setTimeout(() => setConfirmando(false), 4000);
    return () => clearTimeout(temporizador);
  }, [estado]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Enviar>{children}</Enviar>

      {estado && !estado.ok ? (
        <span role="alert" className="text-xs font-medium text-red-700">
          {estado.mensaje}
        </span>
      ) : sucio ? (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-amber-500"
          />
          Cambios sin guardar
        </span>
      ) : confirmando ? (
        <span
          role="status"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700"
        >
          ✓ Cambios guardados correctamente
        </span>
      ) : null}
    </div>
  );
}

/**
 * Sigue si un formulario tiene cambios pendientes.
 *
 * Compara contra una foto de los valores iniciales en vez de encender una
 * bandera al primer tecleo: asi, si se escribe algo y se borra, el formulario
 * vuelve a estar limpio y no queda avisando de un cambio que ya no existe.
 */
export function useFormularioSucio(): {
  sucio: boolean;
  limpiar: () => void;
  props: { ref: React.RefObject<HTMLFormElement | null>; onInput: () => void };
} {
  const ref = useRef<HTMLFormElement>(null);
  const inicial = useRef<string | null>(null);
  const [sucio, setSucio] = useState(false);

  const foto = () => {
    const formulario = ref.current;
    if (!formulario) return "";
    return new URLSearchParams(
      new FormData(formulario) as unknown as Record<string, string>,
    ).toString();
  };

  useEffect(() => {
    if (inicial.current === null) inicial.current = foto();
  }, []);

  const revisar = () => setSucio(foto() !== inicial.current);

  return {
    sucio,
    limpiar: () => {
      inicial.current = foto();
      setSucio(false);
    },
    props: { ref, onInput: revisar },
  };
}

// ---------------------------------------------------------------------------
// Acciones
// ---------------------------------------------------------------------------

/** Boton que dispara una accion del servidor sin formulario visible. */
export function BotonAccion({
  accion,
  campos,
  children,
  titulo,
  deshabilitado,
  className = botonSuave,
}: {
  accion: (formulario: FormData) => Promise<void>;
  campos: Record<string, string>;
  children: React.ReactNode;
  titulo?: string;
  deshabilitado?: boolean;
  className?: string;
}) {
  return (
    <form action={accion} className="inline-flex">
      {Object.entries(campos).map(([nombre, valor]) => (
        <input key={nombre} type="hidden" name={nombre} value={valor} />
      ))}
      <button
        type="submit"
        title={titulo}
        aria-label={titulo}
        disabled={deshabilitado}
        className={className}
      >
        {children}
      </button>
    </form>
  );
}

/**
 * Eliminar en dos toques, con el nombre de lo que se va a borrar delante.
 *
 * No usa `window.confirm`: ese dialogo bloquea el navegador entero, en el
 * movil sale pegado arriba —lejos del renglon que se iba a borrar— y se acepta
 * sin leer. Aqui la advertencia sale EN el sitio, dice exactamente que
 * desaparece y se cancela con el pulgar.
 */
export function BotonEliminar({
  accion,
  campos,
  que,
  aviso,
  className = botonSuave,
  children = "Eliminar",
}: {
  accion: (formulario: FormData) => Promise<void>;
  campos: Record<string, string>;
  que: string;
  aviso?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const [confirmando, setConfirmando] = useState(false);

  if (!confirmando) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => setConfirmando(true)}
      >
        {children}
      </button>
    );
  }

  return (
    <form
      action={accion}
      className="flex flex-wrap items-center gap-2 rounded-lg bg-red-50 px-2 py-1.5"
    >
      {Object.entries(campos).map(([nombre, valor]) => (
        <input key={nombre} type="hidden" name={nombre} value={valor} />
      ))}

      <span className="text-xs text-red-800">
        ¿Eliminar {que}?{aviso ? ` ${aviso}` : ""} Esto no se puede deshacer.
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

/** Bloque plegable. Varios pueden estar abiertos a la vez, que es lo util. */
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
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-morado hover:bg-morado/8 [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden="true"
          className="transition-transform group-open:rotate-90"
        >
          ›
        </span>
        {resumen}
      </summary>
      <div className="mt-2 rounded-xl border border-black/10 bg-[#fbfafc] p-3.5">
        {children}
      </div>
    </details>
  );
}
