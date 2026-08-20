/**
 * Revisa las fotos de categoria en la carta de verdad.
 *
 * Mira lo que no se ve leyendo el codigo: si alguna foto empuja la pagina a lo
 * ancho en un movil, si todas acaban con el mismo tamanio percibido, si
 * conservan su proporcion, y si al buscar desaparecen como deben. Deja ademas
 * capturas en el escritorio para revisarlas a ojo.
 *
 * Necesita el servidor en marcha.
 *   node scripts/probar-fotos.cjs
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const CAPTURAS = process.env.CAPTURAS || path.join(__dirname, "..", ".capturas");

const PANTALLAS = [
  { nombre: "movil-chico", width: 360, height: 780 },
  { nombre: "movil", width: 414, height: 896 },
  { nombre: "tablet", width: 820, height: 1180 },
  { nombre: "escritorio", width: 1440, height: 900 },
];

let fallos = 0;
function comprobar(descripcion, condicion, detalle) {
  if (condicion) {
    console.log(`  ok    ${descripcion}`);
  } else {
    fallos++;
    console.log(`  FALLA ${descripcion}${detalle ? ` — ${detalle}` : ""}`);
  }
}

(async () => {
  fs.mkdirSync(CAPTURAS, { recursive: true });
  const navegador = await chromium.launch();

  try {
    for (const pantalla of PANTALLAS) {
      const contexto = await navegador.newContext({
        viewport: { width: pantalla.width, height: pantalla.height },
        deviceScaleFactor: 2,
      });
      const pagina = await contexto.newPage();
      await pagina.goto(BASE, { waitUntil: "networkidle" });

      // Las fotos entran con una animacion al asomar y se cargan cuando les
      // toca; hay que recorrer la pagina Y esperar a que terminen, o se miden
      // a medio camino y el resultado no dice nada.
      await pagina.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 400) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 120));
        }
      });

      /*
       * Se espera a que las cuatro esten cargadas ANTES de volver arriba. Sin
       * esto se miden las dos ultimas a medio cargar y el fallo parece de la
       * carta cuando es de la prueba.
       */
      await pagina.waitForFunction(
        () => {
          const fotos = [...document.querySelectorAll("img")].filter((i) =>
            decodeURIComponent(i.currentSrc || i.src).includes("/categorias/"),
          );
          return (
            fotos.length === 4 &&
            fotos.every((i) => i.complete && i.naturalWidth > 0)
          );
        },
        { timeout: 25000 },
      );

      await pagina.evaluate(() => window.scrollTo(0, 0));
      await pagina.waitForTimeout(700);

      console.log(`\n— ${pantalla.nombre} (${pantalla.width}px) —`);

      /*
       * 1. Lo que de verdad importa: que el dedo no pueda arrastrar la carta
       *    de lado.
       *
       * NO se compara `scrollWidth` contra `clientWidth`. El fondo de marca
       * derrama sus halos fuera de la pantalla a proposito y `body` lleva
       * `overflow-x: hidden` justo por eso, asi que esa comparacion da un
       * falso positivo permanente. Lo que se comprueba es si el navegador
       * llega a desplazarse cuando se le pide.
       */
      const desplazamiento = await pagina.evaluate(() => {
        const antes = window.scrollX;
        window.scrollTo(600, window.scrollY);
        const despues = window.scrollX;
        window.scrollTo(antes, window.scrollY);
        return despues;
      });
      comprobar(
        "la carta no se puede arrastrar de lado",
        desplazamiento === 0,
        `se desplazo ${desplazamiento}px`,
      );

      // 2. Las fotos, una a una.
      const fotos = await pagina.evaluate(() => {
        const imgs = [...document.querySelectorAll("img")].filter((i) =>
          decodeURIComponent(i.currentSrc || i.src).includes("/categorias/"),
        );

        return imgs.map((i) => {
          const r = i.getBoundingClientRect();
          const seccion = i.closest("section");
          return {
            alt: i.alt,
            menu: seccion ? seccion.id : "(suelta)",
            ancho: Math.round(r.width),
            alto: Math.round(r.height),
            ratioPintado: r.width / r.height,
            ratioReal: i.naturalWidth / i.naturalHeight,
            cargada: i.complete && i.naturalWidth > 0,
            derecha: Math.round(r.right),
            izquierda: Math.round(r.left),
          };
        });
      });

      comprobar("aparecen las cuatro fotos", fotos.length === 4, `${fotos.length}`);
      comprobar(
        "todas cargan de verdad",
        fotos.every((f) => f.cargada),
        fotos.filter((f) => !f.cargada).map((f) => f.menu).join(", "),
      );

      // 3. Proporcion intacta: nada de productos estirados.
      const deformadas = fotos.filter(
        (f) => Math.abs(f.ratioPintado - f.ratioReal) > 0.02,
      );
      comprobar(
        "ninguna sale deformada",
        deformadas.length === 0,
        deformadas
          .map((f) => `${f.menu}: pintado ${f.ratioPintado.toFixed(2)} vs real ${f.ratioReal.toFixed(2)}`)
          .join(" | "),
      );

      // 4. Ninguna se sale del ancho de la pantalla.
      const fuera = fotos.filter(
        (f) => f.izquierda < -1 || f.derecha > pantalla.width + 1,
      );
      comprobar(
        "ninguna se sale de la pantalla",
        fuera.length === 0,
        fuera.map((f) => `${f.menu} [${f.izquierda}, ${f.derecha}]`).join(" | "),
      );

      // 5. Mismo tamanio percibido: se dimensionan por altura, asi que las
      //    alturas tienen que coincidir aunque las proporciones no.
      const alturas = [...new Set(fotos.map((f) => f.alto))];
      comprobar(
        "todas se ven del mismo tamanio (misma altura)",
        alturas.length === 1,
        `alturas: ${alturas.join(", ")}`,
      );

      // 6. Que no ocupen media pantalla en el movil.
      const altoMaximo = Math.max(...fotos.map((f) => f.alto));
      comprobar(
        "ninguna se come la pantalla",
        altoMaximo <= pantalla.height * 0.45,
        `${altoMaximo}px de ${pantalla.height}px`,
      );

      fotos.forEach((f) =>
        console.log(
          `        ${f.menu.padEnd(16)} ${f.ancho}x${f.alto}  ratio ${f.ratioPintado.toFixed(2)}`,
        ),
      );

      await pagina.screenshot({
        path: path.join(CAPTURAS, `${pantalla.nombre}.png`),
        fullPage: false,
      });

      // Captura del primer menu entero, que es donde se juzga la composicion.
      const primera = pagina.locator("section#frozen-yogurt");
      if (await primera.count()) {
        await primera.scrollIntoViewIfNeeded();
        await pagina.waitForTimeout(500);
        await primera.screenshot({
          path: path.join(CAPTURAS, `${pantalla.nombre}-seccion.png`),
        });
      }

      await contexto.close();
    }

    // 7. Al buscar, las fotos se quitan de en medio.
    console.log("\n— Al buscar —");
    const contexto = await navegador.newContext({
      viewport: { width: 414, height: 896 },
    });
    const pagina = await contexto.newPage();
    await pagina.goto(BASE, { waitUntil: "networkidle" });
    await pagina.fill('input[type="search"], input[placeholder*="usc" i]', "coco");
    await pagina.waitForTimeout(900);

    const conBusqueda = await pagina.evaluate(
      () =>
        [...document.querySelectorAll("img")].filter((i) =>
          decodeURIComponent(i.currentSrc || i.src).includes("/categorias/"),
        ).length,
    );
    comprobar("las fotos no estorban en los resultados", conBusqueda === 0,
      `${conBusqueda} visibles`);

    const resultados = await pagina.evaluate(
      () => document.querySelectorAll("mark").length,
    );
    comprobar("y la busqueda sigue funcionando", resultados > 0, `${resultados} marcas`);

    await contexto.close();
  } catch (error) {
    fallos++;
    console.log(`\n  ERROR ${error.message}`);
  } finally {
    await navegador.close();
  }

  console.log(
    fallos === 0
      ? `\nLas fotos se integran bien en todos los anchos.\nCapturas en ${CAPTURAS}\n`
      : `\n${fallos} comprobaciones fallidas.\n`,
  );
  process.exit(fallos === 0 ? 0 : 1);
})();
