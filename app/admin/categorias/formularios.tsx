"use client";

import { useActionState } from "react";

import { accionCrearMenu, accionEditarMenu, type Resultado } from "../acciones";
import {
  Campo,
  EstadoFormulario,
  Interruptor,
  useFormularioSucio,
} from "../ui";
import {
  campo,
} from "../estilos";

/** Alta de una categoria nueva. */
export function FormularioCrearMenu() {
  const [estado, accion] = useActionState<Resultado | null, FormData>(
    accionCrearMenu,
    null,
  );
  const { sucio, limpiar, props } = useFormularioSucio();

  return (
    <form
      {...props}
      action={async (datos) => {
        await accion(datos);
        limpiar();
      }}
      className="space-y-3"
    >
      <Campo
        etiqueta="Nombre de la categoría"
        ayuda="Es el texto del botón que lleva a este menú en la barra de la carta."
      >
        <input
          name="label"
          required
          placeholder="Malteadas Premium"
          className={`${campo} mt-1 w-full`}
        />
      </Campo>

      <p className="text-[0.68rem] leading-relaxed text-tinta-suave">
        Nace vacía y visible, al final de la carta. Como no tiene productos
        todavía, no aparecerá para el cliente hasta que le añadas alguno.
      </p>

      <EstadoFormulario sucio={sucio} estado={estado}>
        Crear categoría
      </EstadoFormulario>
    </form>
  );
}

/** Renombrar y activar/desactivar una categoria. */
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
  const { sucio, limpiar, props } = useFormularioSucio();

  return (
    <form
      {...props}
      action={async (datos) => {
        await accion(datos);
        limpiar();
      }}
      className="space-y-3"
    >
      <input type="hidden" name="grupo" value={grupo} />

      <Campo etiqueta="Nombre en la barra">
        <input
          name="label"
          required
          defaultValue={label}
          className={`${campo} mt-1 w-full`}
        />
      </Campo>

      <Interruptor
        nombre="active"
        marcado={active !== false}
        etiqueta="Visible en la carta"
      />

      <EstadoFormulario sucio={sucio} estado={estado} />
    </form>
  );
}
