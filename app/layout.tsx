import type { Metadata, Viewport } from "next";
import { Fredoka, Poppins } from "next/font/google";

import { SiteBackground } from "@/components/SiteBackground";
import { site } from "@/config/site";
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

const descripcion = `Menú de ${site.brand}: bobas, frozen yogurt, ice rollers, sodas italianas y blizz. Sabores y precios actualizados.`;

export const metadata: Metadata = {
  title: `${site.brand} · ${site.subtitle}`,
  description: descripcion,
  applicationName: `${site.brand} · Menú`,
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
   * La carta se comparte por WhatsApp mucho mas de lo que se busca en Google:
   * sin estos datos el enlace llega como una linea de texto gris, y con ellos
   * llega con el logo y el nombre del negocio.
   */
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: site.brand,
    title: `${site.brand} · ${site.subtitle}`,
    description: descripcion,
    images: [{ url: site.logo, width: 266, height: 108, alt: site.brand }],
  },
  icons: { icon: site.logo, apple: site.logo },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Sin tope de zoom: quien no ve bien de cerca tiene que poder acercarse con
  // los dedos para leer un precio. Bloquearlo es una barrera de accesibilidad.
  themeColor: "#fff5f5",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${fredoka.variable} ${poppins.variable}`}>
      <body>
        {/* El fondo va aqui, fuera de las paginas: se pinta una sola vez y no
            se reinicia su animacion al navegar entre menus. */}
        <SiteBackground />
        {children}
      </body>
    </html>
  );
}
