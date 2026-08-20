/**
 * Radiografia de las fotos de categoria antes de meterlas en la carta.
 *
 * Interesan dos cosas que no se ven abriendo el archivo: si el fondo es
 * transparente de verdad (y entonces el producto puede "flotar" sobre el fondo
 * crema) o es un fondo opaco que habra que enmarcar; y cuanto aire sobra
 * alrededor del producto, porque ese margen vacio es el que descuadra una
 * composicion cuando se colocan varias fotos juntas.
 *
 *   node scripts/analizar-imagenes.cjs
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");

const ORIGEN = path.join(__dirname, "..", "Imagenes categorias");

(async () => {
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage();

  for (const archivo of fs.readdirSync(ORIGEN)) {
    if (!/\.(png|jpe?g|webp)$/i.test(archivo)) continue;

    const datos = fs.readFileSync(path.join(ORIGEN, archivo));
    const url = `data:image/png;base64,${datos.toString("base64")}`;

    const info = await pagina.evaluate(async (src) => {
      const img = new Image();
      img.src = src;
      await img.decode();

      const lienzo = document.createElement("canvas");
      lienzo.width = img.naturalWidth;
      lienzo.height = img.naturalHeight;
      const ctx = lienzo.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);

      const { data, width, height } = ctx.getImageData(
        0, 0, lienzo.width, lienzo.height,
      );

      // Alfa de las cuatro esquinas: dice si el fondo se recorto de verdad.
      const alfaEn = (x, y) => data[(y * width + x) * 4 + 3];
      const esquinas = [
        alfaEn(0, 0),
        alfaEn(width - 1, 0),
        alfaEn(0, height - 1),
        alfaEn(width - 1, height - 1),
      ];

      // Caja del contenido: primer y ultimo pixel con algo de opacidad.
      const UMBRAL = 12;
      let x0 = width, y0 = height, x1 = -1, y1 = -1, opacos = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (data[(y * width + x) * 4 + 3] > UMBRAL) {
            opacos++;
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
          }
        }
      }

      return {
        width,
        height,
        esquinas,
        caja: { x0, y0, x1, y1 },
        cobertura: opacos / (width * height),
      };
    }, url);

    const { width, height, esquinas, caja, cobertura } = info;
    const recortada = esquinas.every((a) => a < 12);
    const anchoCaja = caja.x1 - caja.x0 + 1;
    const altoCaja = caja.y1 - caja.y0 + 1;

    console.log(`\n${archivo}`);
    console.log(`  ${width}x${height}`);
    console.log(
      `  fondo: ${recortada ? "TRANSPARENTE (el producto puede flotar)" : "OPACO (hay que enmarcarla)"}` +
        `  [alfa esquinas: ${esquinas.join(", ")}]`,
    );
    console.log(
      `  contenido: ${anchoCaja}x${altoCaja} en (${caja.x0},${caja.y0})` +
        `  ratio ${(anchoCaja / altoCaja).toFixed(2)}`,
    );
    console.log(
      `  aire sobrante: izq ${caja.x0}px, arriba ${caja.y0}px, ` +
        `der ${width - 1 - caja.x1}px, abajo ${height - 1 - caja.y1}px`,
    );
    console.log(`  pixeles con tinta: ${(cobertura * 100).toFixed(1)}%`);
  }

  await navegador.close();
})();
