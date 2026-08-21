"use client";

import { useActionState, useState } from "react";

import {
  accionSubirImagenMenu,
  accionTextoImagen,
  type Resultado,
} from "../acciones";
import {
  Campo,
  Enviar,
  EstadoFormulario,
  useFormularioSucio,
} from "../ui";
import {
  campo,
} from "../estilos";

/**
 * Subida de la foto de una categoria.
 *
 * Ensenia el nombre del archivo elegido antes de subirlo. Parece un detalle,
 * pero con cuatro fotos que se llaman "IMG_2043.png" es lo unico que evita
 * subir la del mes pasado.
 */
export function FormularioSubirFoto({
  grupo,
  alt,
  tieneFoto,
}: {
  grupo: string;
  alt: string;
  tieneFoto: boolean;
}) {
  const [estado, accion] = useActionState<Resultado | null, FormData>(
    accionSubirImagenMenu,
    null,
  );
  const [elegido, setElegido] = useState<string | null>(null);

  return (
    <form action={accion} className="space-y-3">
      <input type="hidden" name="grupo" value={grupo} />

      <Campo
        etiqueta={tieneFoto ? "Reemplazar la foto" : "Subir una foto"}
        ayuda="PNG, WebP o JPG. Tiene que venir con el producto recortado sobre fondo transparente: en la carta no se enmarca, flota sobre el fondo de marca."
      >
        <input
          type="file"
          name="archivo"
          required
          accept="image/png,image/webp,image/jpeg,image/avif"
          onChange={(e) => setElegido(e.target.files?.[0]?.name ?? null)}
          className="mt-1 block w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-morado file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-morado/90"
        />
      </Campo>

      {elegido ? (
        <p className="text-[0.7rem] text-tinta-suave">
          Elegida: <span className="font-medium">{elegido}</span>
        </p>
      ) : null}

      <Campo
        etiqueta="Qué se ve en la foto"
        ayuda="Para quien no puede verla. Describe el producto, no repitas el nombre de la categoría: ya está en el título de al lado."
      >
        <input
          name="alt"
          defaultValue={alt}
          placeholder="Vaso de boba con tapioca y hielo"
          className={`${campo} mt-1 w-full`}
        />
      </Campo>

      <div className="flex flex-wrap items-center gap-3">
        <Enviar>{tieneFoto ? "Reemplazar" : "Subir"}</Enviar>

        {estado ? (
          <span
            role="status"
            className={`text-xs ${
              estado.ok ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {estado.ok
              ? (estado.mensaje ?? "✓ Foto guardada correctamente")
              : estado.mensaje}
          </span>
        ) : null}
      </div>
    </form>
  );
}

/** Cambiar solo la descripcion, sin volver a subir el archivo. */
export function FormularioTextoFoto({
  grupo,
  alt,
}: {
  grupo: string;
  alt: string;
}) {
  const [estado, accion] = useActionState<Resultado | null, FormData>(
    accionTextoImagen,
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

      <Campo etiqueta="Qué se ve en la foto">
        <input name="alt" defaultValue={alt} className={`${campo} mt-1 w-full`} />
      </Campo>

      <EstadoFormulario sucio={sucio} estado={estado}>
        Guardar descripción
      </EstadoFormulario>
    </form>
  );
}
