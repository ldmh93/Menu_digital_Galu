"use client";

import { useActionState } from "react";

import { REDES } from "@/lib/editor";
import {
  accionEditarNegocio,
  accionEditarPortada,
  type Resultado,
} from "./acciones";
import {
  Campo,
  EstadoFormulario,
  useFormularioSucio,
} from "./ui";
import {
  campo,
} from "./estilos";

/** Los dos textos de la portada de la carta. */
export function FormularioPortada({
  subtitle,
  intro,
}: {
  subtitle: string;
  intro: string;
}) {
  const [estado, accion] = useActionState<Resultado | null, FormData>(
    accionEditarPortada,
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
      className="space-y-4"
    >
      <Campo
        etiqueta="Subtítulo de la marca"
        ayuda="Va bajo el logo, en mayúsculas y muy espaciado. Cuanto más corto, mejor: en un celular estrecho no puede partirse en dos líneas."
      >
        <input
          name="subtitle"
          required
          defaultValue={subtitle}
          maxLength={40}
          className={`${campo} mt-1 w-full`}
        />
      </Campo>

      <Campo
        etiqueta="Frase de bienvenida"
        ayuda="Lo primero que se lee tras escanear el código. Sirve para decir cómo se usa la carta. Déjala vacía para quitarla."
      >
        <input
          name="intro"
          defaultValue={intro}
          maxLength={120}
          className={`${campo} mt-1 w-full`}
        />
      </Campo>

      <EstadoFormulario sucio={sucio} estado={estado} />
    </form>
  );
}

/** Datos del negocio: la marca y sus redes. */
export function FormularioNegocio({
  brand,
  handle,
  networks,
  message,
}: {
  brand: string;
  handle: string;
  networks: string[];
  message: string;
}) {
  const [estado, accion] = useActionState<Resultado | null, FormData>(
    accionEditarNegocio,
    null,
  );
  const { sucio, limpiar, props } = useFormularioSucio();

  const nombresDeRed: Record<string, string> = {
    instagram: "Instagram",
    facebook: "Facebook",
    tiktok: "TikTok",
  };

  return (
    <form
      {...props}
      action={async (datos) => {
        await accion(datos);
        limpiar();
      }}
      className="space-y-6"
    >
      <div className="space-y-4">
        <Campo
          etiqueta="Nombre del negocio"
          ayuda="Sale en el título de la pestaña y en el enlace cuando se comparte por WhatsApp."
        >
          <input
            name="brand"
            required
            defaultValue={brand}
            className={`${campo} mt-1 w-full`}
          />
        </Campo>
      </div>

      <fieldset className="space-y-3 border-t border-black/10 pt-4">
        <legend className="text-xs font-semibold">Redes sociales</legend>

        <Campo
          etiqueta="Usuario"
          ayuda="El mismo en todas las redes. La arroba se pone sola."
        >
          <input
            name="handle"
            defaultValue={handle}
            placeholder="@frozen.galu"
            className={`${campo} mt-1 w-full`}
          />
        </Campo>

        <div>
          <span className="block text-xs font-medium text-tinta-suave">
            Dónde existe ese usuario
          </span>
          <p className="mt-0.5 mb-1.5 text-[0.68rem] text-tinta-suave">
            Decide qué iconos se pintan en el pie. Desmarca una red si no la
            tienes: un icono que lleva a una cuenta vacía es peor que ninguno.
          </p>
          <div className="flex flex-wrap gap-3">
            {REDES.map((red) => (
              <label
                key={red}
                className="flex cursor-pointer items-center gap-2 text-xs"
              >
                <input
                  type="checkbox"
                  name="networks"
                  value={red}
                  defaultChecked={networks.includes(red)}
                  className="size-4 accent-[#9371b0]"
                />
                {nombresDeRed[red] ?? red}
              </label>
            ))}
          </div>
        </div>

        <Campo etiqueta="Frase de marca" ayuda="Va sobre los iconos, en el pie.">
          <input
            name="message"
            defaultValue={message}
            className={`${campo} mt-1 w-full`}
          />
        </Campo>
      </fieldset>

      <EstadoFormulario sucio={sucio} estado={estado} />
    </form>
  );
}
