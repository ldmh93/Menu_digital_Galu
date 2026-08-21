import { redirect } from "next/navigation";

import { leerContenido, podarParaPublico } from "@/lib/contenido";
import { haySesion } from "@/lib/sesion";
import { CabeceraModulo } from "../ui";
import { MarcoVistaPrevia } from "./marco";

/**
 * Vista previa de la carta.
 *
 * Conviene ser claro con lo que esto es y lo que no: el panel guarda y publica
 * en el mismo gesto, asi que esto ensenia lo que YA esta publicado, no un
 * borrador pendiente de aprobar. Sirve para comprobar como quedo un cambio sin
 * salir del panel, que es lo que se necesita el 99 % de las veces.
 *
 * Un flujo de borrador y publicacion aparte —editar, revisar, publicar— es
 * otra cosa y pide guardar dos versiones del contenido. Se puede hacer, pero
 * no se finge aqui.
 */
export default async function ModuloVistaPrevia() {
  if (!(await haySesion())) redirect("/admin/entrar");

  const { groups } = await leerContenido();
  const visibles = podarParaPublico(groups);

  const rutas = [
    { valor: "/", texto: "Carta completa (la del código QR)" },
    ...visibles.map((grupo) => ({
      valor: `/menu/${grupo.slug}`,
      texto: `Solo ${grupo.label}`,
    })),
  ];

  return (
    <main>
      <CabeceraModulo
        icono="👁"
        nombre="Vista previa"
        alcance="La carta tal y como la ve un cliente, en los tres tamaños que importan."
        volverA="/admin"
        volverTexto="Inicio"
      />

      <MarcoVistaPrevia rutas={rutas} />
    </main>
  );
}
