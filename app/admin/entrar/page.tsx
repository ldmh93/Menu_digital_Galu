import { redirect } from "next/navigation";

import { haySesion, panelConfigurado } from "@/lib/sesion";
import { FormularioEntrar } from "../componentes";

/**
 * Puerta del panel.
 *
 * Es la unica pagina de /admin que se puede ver sin sesion. El resto redirige
 * aqui, y las acciones comprueban la sesion por su cuenta: una Server Action
 * es un endpoint publico y no basta con esconder la pagina que la usa.
 */
export default async function Entrar() {
  if (await haySesion()) redirect("/admin");

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold">
        Panel de GALU
      </h1>
      <p className="mt-2 text-sm text-tinta-suave">
        Desde aquí se edita la carta que ven los clientes.
      </p>

      {panelConfigurado() ? (
        <FormularioEntrar />
      ) : (
        /*
         * Sin las variables no hay contrasenia contra la que comparar, asi que
         * ni se enseña el formulario: pedir una clave que no puede ser correcta
         * solo hace perder el tiempo a quien la escribe.
         */
        <div className="mt-8 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
          <strong className="block font-semibold">Panel sin configurar.</strong>
          Faltan <code>ADMIN_PASSWORD</code> y <code>ADMIN_SECRET</code>. En tu
          computadora van en un archivo <code>.env.local</code>; en un servidor,
          en sus variables de entorno. Tienes el molde en{" "}
          <code>.env.example</code>.
        </div>
      )}
    </main>
  );
}
