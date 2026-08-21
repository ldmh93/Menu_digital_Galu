import type { Metadata, Viewport } from "next";
import { Fredoka, Poppins } from "next/font/google";

import { SiteBackground } from "@/components/SiteBackground";
import { SitioProvider } from "@/components/SitioProvider";
import { leerContenido } from "@/lib/contenido";
import "@/styles/globals.css";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fredoka",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

/**
 * Se calcula en cada peticion porque el nombre de la marca y el subtitulo se
 * editan desde el panel. Dejarlo en un `metadata` constante haria que la
 * pestaña y el enlace que se comparte por WhatsApp siguieran diciendo lo que
 * estaba escrito el dia que se compilo.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { site: sitio } = await leerContenido();
  const descripcion = `Menú de ${sitio.brand}: bobas, frozen yogurt, ice rollers, sodas italianas y blizz. Sabores y precios actualizados.`;

  return {
    title: `${sitio.brand} · ${sitio.subtitle}`,
    description: descripcion,
    applicationName: `${sitio.brand} · Menú`,
    /*
     * Base con la que se vuelven absolutas las rutas de las imagenes al
     * compartir. Vercel la publica en `VERCEL_URL`; en local no importa.
     */
    metadataBase: new URL(
      process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "http://localhost:3000",
    ),
    /*
     * La carta se comparte por WhatsApp mucho mas de lo que se busca en
     * Google: sin estos datos el enlace llega como una linea de texto gris, y
     * con ellos llega con el logo y el nombre del negocio.
     */
    openGraph: {
      type: "website",
      locale: "es_MX",
      siteName: sitio.brand,
      title: `${sitio.brand} · ${sitio.subtitle}`,
      description: descripcion,
      images: [{ url: sitio.logo, width: 266, height: 108, alt: sitio.brand }],
    },
    icons: { icon: sitio.logo, apple: sitio.logo },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Sin tope de zoom: quien no ve bien de cerca tiene que poder acercarse con
  // los dedos para leer un precio. Bloquearlo es una barrera de accesibilidad.
  themeColor: "#fff5f5",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  /*
   * Los datos del negocio se leen aqui, una sola vez, y bajan por contexto a
   * los componentes de la carta. Antes cada uno importaba el literal de
   * config/site.ts, y con eso cambiar el subtitulo desde el panel no servia de
   * nada: la carta seguia pintando el valor compilado.
   */
  const { site: sitio } = await leerContenido();
  const { playlist: _orden, ...sitioPublico } = sitio;

  return (
    <html lang="es" className={`${fredoka.variable} ${poppins.variable}`}>
      <body>
        <SitioProvider valor={sitioPublico}>
          {/* El fondo va aqui, fuera de las paginas: se pinta una sola vez y
              no se reinicia su animacion al navegar entre menus. */}
          <SiteBackground />
          {children}
        </SitioProvider>
      </body>
    </html>
  );
}
