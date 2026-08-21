import { redirect } from "next/navigation";

import { leerContenido } from "@/lib/contenido";
import { haySesion } from "@/lib/sesion";
import { FormularioNegocio } from "../formularios-sitio";
import { moduloDe } from "../modulos";
import { CabeceraModulo, Panel } from "../ui";

/**
 * Modulo de configuracion: los datos del negocio.
 *
 * Es lo que casi nunca cambia —el nombre, las redes, el telefono— y por eso va
 * al final de la lista de modulos: se entra aqui dos veces al anio, y tenerlo
 * arriba solo estorbaria a lo que se toca a diario.
 */
export default async function ModuloConfiguracion() {
  if (!(await haySesion())) redirect("/admin/entrar");

  const modulo = moduloDe("configuracion")!;
  const { site } = await leerContenido();

  return (
    <main>
      <CabeceraModulo
        icono={modulo.icono}
        nombre={modulo.nombre}
        alcance={modulo.alcance}
        volverA="/admin"
        volverTexto="Inicio"
      />

      <Panel>
        <FormularioNegocio
          brand={site.brand}
          handle={site.footer.handle}
          networks={site.footer.networks}
          message={site.footer.message}
        />
      </Panel>

      <div className="mt-4 rounded-xl border border-black/10 bg-white/60 p-3.5">
        <h2 className="text-xs font-semibold">La firma del desarrollo</h2>
        <p className="mt-1 text-xs leading-relaxed text-tinta-suave">
          El “Desarrollado por…” del pie <strong>no se edita desde aquí</strong>
          , y es a propósito: no es un dato del negocio que cambie con la
          temporada, como los precios o las redes, sino la autoría del trabajo.
          Vive en <code>config/site.ts</code>, así que no puede borrarse desde
          el panel ni por descuido. Para cambiarla hay que tocar ese archivo.
        </p>
      </div>

      <div className="mt-3 rounded-xl border border-black/10 bg-white/60 p-3.5">
        <h2 className="text-xs font-semibold">Lo que esta carta no muestra</h2>
        <p className="mt-1 text-xs leading-relaxed text-tinta-suave">
          No hay <strong>horarios</strong> ni <strong>dirección</strong> porque
          la carta no los enseña en ninguna parte: se abre con un código QR que
          está en la mesa, así que quien la lee ya está dentro del local y a esa
          hora. Guardarlos aquí sería llenar un campo que nadie llega a ver
          nunca. Si algún día quieres que aparezcan —por ejemplo para compartir
          la carta por WhatsApp fuera del local—, hay que añadirlos también al
          pie de la carta, y entonces sí tiene sentido administrarlos.
        </p>
      </div>
    </main>
  );
}
