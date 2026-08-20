/**
 * Deja las fotos de categoria listas para la carta.
 *
 * Las originales pesan entre 1.2 y 2 MB cada una: siete megas para una carta
 * que se abre en el celular, muchas veces con datos moviles y dentro del
 * local. Aqui se hacen tres cosas, en este orden:
 *
 *   1. RECORTAR el aire transparente que rodea al producto. No es solo peso:
 *      ese margen invisible descuadra la composicion, porque dos fotos con
 *      distinto aire se ven de tamanios distintos aunque midan lo mismo.
 *   2. REDIMENSIONAR a lo que de verdad se pinta en pantalla, al doble para
 *      que se vea nitida en pantallas retina.
 *   3. GUARDAR en WebP, que conserva la transparencia y pesa una fraccion.
 *
 * Se hace con un navegador de verdad (canvas) en vez de una libreria de
 * imagenes para no anadir una dependencia nativa al proyecto por un script
 * que se corre cuando llegan fotos nuevas.
 *
 *   node scripts/preparar-imagenes.cjs
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");

const ORIGEN = path.join(__dirname, "..", "Imagenes categorias");
const DESTINO = path.join(__dirname, "..", "public", "categorias");

/** Que foto es de que menu. El nombre del archivo no sirve como llave. */
const MAPA = {
  "Boba (1).png": "bobas",
  "Ice roller.png": "ice-rollers",
  "Yogurt 2.png": "frozen-yogurt",
  "sodas italianas .png": "sodas-italianas",
};

/**
 * Lado mayor de la imagen final.
 *
 * En la carta se pinta a unos 420 px como mucho; el doble cubre las pantallas
 * de densidad alta, que es donde se notaria. Mas alla de eso solo se gastan
 * datos de alguien que esta esperando su pedido.
 */
const LADO = 880;

/** Margen que se deja alrededor del producto, en % del lado mayor. */
const MARGEN = 0.02;

(async () => {
  fs.mkdirSync(DESTINO, { recursive: true });

  const navegador = await chromium.launch();
  const pagina = await navegador.newPage();

  let totalAntes = 0;
  let totalDespues = 0;

  for (const [archivo, slug] of Object.entries(MAPA)) {
    const ruta = path.join(ORIGEN, archivo);

    if (!fs.existsSync(ruta)) {
      console.log(`  falta  ${archivo}`);
      continue;
    }

    const datos = fs.readFileSync(ruta);
    totalAntes += datos.length;

    const resultado = await pagina.evaluate(
      async ({ src, lado, margen }) => {
        const img = new Image();
        img.src = src;
        await img.decode();

        const original = document.createElement("canvas");
        original.width = img.naturalWidth;
        original.height = img.naturalHeight;
        const ctxOriginal = original.getContext("2d", {
          willReadFrequently: true,
        });
        ctxOriginal.drawImage(img, 0, 0);

        const { data, width, height } = ctxOriginal.getImageData(
          0, 0, original.width, original.height,
        );

        // Caja del producto: se ignora el alfa muy bajo, que es el borde
        // suavizado del recorte y no forma parte de la foto.
        const UMBRAL = 12;
        let x0 = width, y0 = height, x1 = -1, y1 = -1;
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            if (data[(y * width + x) * 4 + 3] > UMBRAL) {
              if (x < x0) x0 = x;
              if (x > x1) x1 = x;
              if (y < y0) y0 = y;
              if (y > y1) y1 = y;
            }
          }
        }

        const anchoCaja = x1 - x0 + 1;
        const altoCaja = y1 - y0 + 1;
        const respiro = Math.round(Math.max(anchoCaja, altoCaja) * margen);

        // El margen no puede salirse de la imagen original.
        const cx = Math.max(0, x0 - respiro);
        const cy = Math.max(0, y0 - respiro);
        const cw = Math.min(width - cx, anchoCaja + respiro * 2);
        const ch = Math.min(height - cy, altoCaja + respiro * 2);

        // Escala por el lado mayor, conservando la proporcion. Nunca se
        // agranda: estirar una foto solo la emborrona.
        const escala = Math.min(1, lado / Math.max(cw, ch));
        const finalW = Math.round(cw * escala);
        const finalH = Math.round(ch * escala);

        const salida = document.createElement("canvas");
        salida.width = finalW;
        salida.height = finalH;
        const ctx = salida.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, cx, cy, cw, ch, 0, 0, finalW, finalH);

        return {
          webp: salida.toDataURL("image/webp", 0.92),
          width: finalW,
          height: finalH,
          recorte: { cw, ch },
          originales: { width, height },
        };
      },
      { src: `data:image/png;base64,${datos.toString("base64")}`, lado: LADO, margen: MARGEN },
    );

    const binario = Buffer.from(resultado.webp.split(",")[1], "base64");
    const destino = path.join(DESTINO, `${slug}.webp`);
    fs.writeFileSync(destino, binario);
    totalDespues += binario.length;

    const antes = (datos.length / 1024 / 1024).toFixed(2);
    const despues = (binario.length / 1024).toFixed(0);
    console.log(
      `  ${slug.padEnd(16)} ${resultado.originales.width}x${resultado.originales.height} ` +
        `→ ${resultado.width}x${resultado.height}   ${antes} MB → ${despues} KB`,
    );
  }

  await navegador.close();

  console.log(
    `\n  total: ${(totalAntes / 1024 / 1024).toFixed(2)} MB → ` +
      `${(totalDespues / 1024).toFixed(0)} KB ` +
      `(${(100 - (totalDespues / totalAntes) * 100).toFixed(0)}% menos)\n`,
  );
})();
