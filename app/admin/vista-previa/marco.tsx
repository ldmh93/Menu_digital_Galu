"use client";

import { useRef, useState } from "react";

import {
  botonSuave,
  campo,
} from "../estilos";

/**
 * La carta de verdad, dentro del panel.
 *
 * Es un `<iframe>` a la pagina publica, no una imitacion: enseniar una copia
 * que hay que mantener al dia es la forma segura de que un dia la vista previa
 * y la carta dejen de parecerse, y entonces ya no sirve para decidir nada.
 *
 * Los anchos son los tres que importan de verdad —el celular donde se escanea
 * el QR, la tablet y el monitor— y no una regla continua: lo que se comprueba
 * es si algo se rompe en los tamanios reales, no en 863 px.
 */

const ANCHOS = [
  { nombre: "Celular", valor: 390, icono: "▯" },
  { nombre: "Tablet", valor: 820, icono: "▭" },
  { nombre: "Computadora", valor: 1280, icono: "▬" },
] as const;

export function MarcoVistaPrevia({ rutas }: { rutas: { valor: string; texto: string }[] }) {
  const [ancho, setAncho] = useState<number>(390);
  const [ruta, setRuta] = useState(rutas[0]?.valor ?? "/");
  const marco = useRef<HTMLIFrameElement>(null);

  const recargar = () => {
    const elemento = marco.current;
    if (!elemento) return;

    // Reasignar el src fuerza la recarga sin depender de acceder al documento
    // de dentro, que el navegador bloquea en cuanto cambia el origen.
    elemento.src = elemento.src;
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-lg border border-black/12 bg-white p-1">
          {ANCHOS.map((opcion) => (
            <button
              key={opcion.valor}
              type="button"
              onClick={() => setAncho(opcion.valor)}
              aria-pressed={ancho === opcion.valor}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                ancho === opcion.valor
                  ? "bg-morado text-white"
                  : "text-tinta-suave hover:bg-black/[0.04]"
              }`}
            >
              <span aria-hidden="true" className="mr-1">
                {opcion.icono}
              </span>
              {opcion.nombre}
            </button>
          ))}
        </div>

        <select
          value={ruta}
          onChange={(e) => setRuta(e.target.value)}
          className={`${campo} w-auto flex-none py-1.5`}
        >
          {rutas.map((opcion) => (
            <option key={opcion.valor} value={opcion.valor}>
              {opcion.texto}
            </option>
          ))}
        </select>

        <button type="button" onClick={recargar} className={botonSuave}>
          ↻ Actualizar
        </button>

        <a
          href={ruta}
          target="_blank"
          rel="noreferrer"
          className={`${botonSuave} ml-auto`}
        >
          Abrir en una pestaña ↗
        </a>
      </div>

      {/* El marco se centra y no pasa del ancho disponible: en un portatil, la
          vista de "computadora" no cabe entera y encogerla es mejor que sacar
          una barra de desplazamiento dentro de otra. */}
      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
        <div className="flex justify-center bg-[#efedf2] p-3">
          <div
            className="w-full overflow-hidden rounded-xl bg-white shadow-sm"
            style={{ maxWidth: ancho }}
          >
            <iframe
              ref={marco}
              src={ruta}
              title="Vista previa de la carta"
              className="h-[70dvh] w-full border-0"
            />
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-tinta-suave">
        Es la carta real, no una imitación. Lo que ves aquí es exactamente lo
        que ve un cliente ahora mismo: los cambios que guardas en el panel ya
        están publicados. Si acabas de guardar algo y no lo ves, dale a
        Actualizar.
      </p>
    </div>
  );
}
