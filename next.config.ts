import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Formatos modernos: menos datos moviles sin perder nitidez.
    formats: ["image/avif", "image/webp"],
  },
  // Quita el indicador de desarrollo de Next, que se pinta justo en la esquina
  // inferior izquierda y estorba al revisar el diseno en el celular.
  devIndicators: false,

  /**
   * Compilar desde un disco externo en exFAT.
   *
   * Webpack resuelve cada modulo hasta su ruta real, y para eso llama a
   * `readlink` sobre archivos normales. El controlador de exFAT de Windows
   * responde `EISDIR` donde NTFS responde `EINVAL` ("no es un enlace
   * simbolico"); webpack no sabe interpretar ese codigo y aborta:
   *
   *   EISDIR: illegal operation on a directory, readlink 'app/page.tsx'
   *
   * Apagar la resolucion de enlaces evita esas llamadas de raiz. No se pierde
   * nada: aqui no hay enlaces simbolicos que seguir — ni en exFAT, que no los
   * soporta, ni en NTFS, porque no se usa `npm link` ni un monorepo.
   */
  webpack: (config) => {
    config.resolve.symlinks = false;
    return config;
  },
};

export default nextConfig;
