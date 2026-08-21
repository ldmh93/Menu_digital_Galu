/**
 * Prueba del panel por modulos, con un navegador de verdad.
 *
 * Comprueba lo unico que importa de un panel de administracion: que cada boton
 * haga lo que dice y que el cambio llegue a la carta del cliente. Todo lo
 * demas —que compile, que los tipos cuadren— puede estar en verde con la
 * pantalla entera desconectada.
 *
 * Deja el contenido como estaba: cada prueba deshace lo suyo.
 *
 * Necesita el servidor en marcha.
 *   node scripts/probar-dashboard.cjs
 */
const { chromium } = require("playwright-core");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const CLAVE = process.env.ADMIN_PASSWORD || "galu2026";

let fallos = 0;
function comprobar(descripcion, condicion, detalle) {
  if (condicion) {
    console.log(`  ok    ${descripcion}`);
  } else {
    fallos++;
    console.log(`  FALLA ${descripcion}${detalle ? ` — ${detalle}` : ""}`);
  }
}

/** Espera a que el servidor termine de guardar y repintar. */
async function reposo(pagina, ms = 1800) {
  await pagina.waitForTimeout(ms);
}

/**
 * Espera a que ningun boton siga diciendo "Guardando…".
 *
 * Los botones de envio se apagan mientras la accion viaja, asi que ese texto
 * es la señal fiable de que todavia no ha vuelto. Esperar un tiempo fijo hace
 * que la prueba falle sola en una maquina cargada.
 */
async function guardadoTerminado(pagina) {
  // Solo sirve para los formularios con boton de envio: son los unicos que
  // pintan "Guardando…". Las acciones rapidas de las listas no pasan por ahi.
  await pagina
    .waitForFunction(
      () => !document.body.innerText.includes("Guardando…"),
      { timeout: 20000 },
    )
    .catch(() => {});
  await pagina.waitForTimeout(600);
}

(async () => {
  const navegador = await chromium.launch();
  const contexto = await navegador.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const pagina = await contexto.newPage();
  const publica = await contexto.newPage();

  try {
    // -----------------------------------------------------------------------
    console.log("\n— Entrar —");

    await pagina.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
    comprobar("sin sesión manda al acceso", pagina.url().includes("/admin/entrar"));

    // La puerta tiene que estar puesta de verdad, no solo escondida.
    await pagina.fill('input[name="password"]', "no-es-esta");
    await pagina.click('button[type="submit"]');
    await pagina.waitForTimeout(1200);
    comprobar(
      "una contraseña incorrecta no deja pasar",
      pagina.url().includes("/admin/entrar"),
      pagina.url(),
    );

    await pagina.fill('input[name="password"]', CLAVE);
    await pagina.click('button[type="submit"]');
    await pagina.waitForURL("**/admin", { timeout: 15000 });

    // -----------------------------------------------------------------------
    console.log("\n— Punto de partida limpio —");

    /*
     * Una prueba que arranca sobre los restos de otra corrida da fallos que
     * no son del panel, y se pierde el tiempo buscandolos donde no estan.
     */
    await pagina.goto(`${BASE}/admin/productos`, { waitUntil: "networkidle" });
    await pagina.fill('input[type="search"]', "copia");
    await pagina.waitForTimeout(600);
    const restos = await pagina
      .locator("main ul > li", { hasText: "(copia)" })
      .count();
    comprobar(
      "no hay copias de una corrida anterior",
      restos === 0,
      `${restos} sueltas: borralas antes de volver a correr esto`,
    );
    if (restos > 0) throw new Error("hay restos de otra corrida");

    await pagina.goto(`${BASE}/admin`, { waitUntil: "networkidle" });

    // -----------------------------------------------------------------------
    console.log("\n— La portada del panel —");

    const tarjetas = await pagina.locator("main article").count();
    comprobar("hay una tarjeta por módulo (7) más la vista previa", tarjetas === 8,
      `${tarjetas} tarjetas`);

    const texto = await pagina.locator("main").innerText();
    for (const modulo of [
      "Portada", "Categorías", "Productos", "Destacados",
      "Imágenes", "Apariencia", "Configuración",
    ]) {
      comprobar(`la tarjeta de ${modulo} está`, texto.includes(modulo));
    }
    comprobar("el recuento de productos es real (231)", texto.includes("231"),
      texto.slice(0, 120).replace(/\n/g, " "));

    // -----------------------------------------------------------------------
    console.log("\n— Cada módulo abre y dice qué administra —");

    for (const [slug, esperado] of [
      ["portada", "logo"],
      ["categorias", "menú"],
      ["productos", "precio"],
      ["destacados", "insignia"],
      ["imagenes", "foto"],
      ["apariencia", "paleta"],
      ["configuracion", "redes"],
    ]) {
      await pagina.goto(`${BASE}/admin/${slug}`, { waitUntil: "networkidle" });
      const alcance = (await pagina.locator("main header p").first().innerText())
        .toLowerCase();
      comprobar(
        `${slug} explica su alcance`,
        alcance.includes(esperado),
        alcance,
      );
    }

    // -----------------------------------------------------------------------
    console.log("\n— Productos: buscar y filtrar —");

    await pagina.goto(`${BASE}/admin/productos`, { waitUntil: "networkidle" });
    const todas = await pagina.locator("main ul > li").count();
    comprobar("lista los 231 productos", todas === 231, `${todas}`);

    await pagina.fill('input[type="search"]', "taro");
    await pagina.waitForTimeout(400);
    const conTaro = await pagina.locator("main ul > li").count();
    comprobar("buscar 'taro' recorta la lista", conTaro > 0 && conTaro < 20,
      `${conTaro} resultados`);

    // Sin acentos, como en la carta.
    await pagina.fill('input[type="search"]', "platano");
    await pagina.waitForTimeout(400);
    const sinAcento = await pagina.locator("main ul > li").count();
    comprobar("buscar sin acentos encuentra 'Plátano'", sinAcento > 0,
      `${sinAcento} resultados`);

    await pagina.fill('input[type="search"]', "");
    await pagina.waitForTimeout(300);

    // -----------------------------------------------------------------------
    console.log("\n— Precio rápido desde la lista —");

    await pagina.fill('input[type="search"]', "Mediano");
    await pagina.waitForTimeout(500);

    const fila = pagina.locator("main ul > li").first();
    const precio = fila.locator("input[data-precio-rapido]");
    const antes = await precio.inputValue();
    comprobar("el campo trae el precio actual", antes === "65", antes);

    await precio.fill("88");
    await fila
      .locator("form:has(input[data-precio-rapido]) button[type=submit]")
      .click();
    await reposo(pagina);

    await publica.goto(BASE, { waitUntil: "networkidle" });
    const htmlCarta = await publica.content();
    const trozo = htmlCarta.slice(
      Math.max(0, htmlCarta.indexOf(">Mediano<") - 200),
      htmlCarta.indexOf(">Mediano<") + 400,
    );
    comprobar("el precio nuevo llega a la carta", trozo.includes("88"),
      trozo.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 100));

    /*
     * Recargar es lo que distingue un panel de verdad de uno que solo cambia
     * la pantalla: lo que se ve tras recargar sale del archivo, no de la
     * memoria del navegador.
     */
    await pagina.reload({ waitUntil: "networkidle" });
    await pagina.fill('input[type="search"]', "Mediano");
    await pagina.waitForTimeout(500);
    const guardado = await pagina
      .locator("main ul > li")
      .first()
      .locator("input[data-precio-rapido]")
      .inputValue();
    comprobar("al recargar sigue en 88 (se guardó en disco)", guardado === "88", guardado);

    // Se deja como estaba.
    await pagina.reload({ waitUntil: "networkidle" });
    await pagina.fill('input[type="search"]', "Mediano");
    await pagina.waitForTimeout(500);
    const fila2 = pagina.locator("main ul > li").first();
    await fila2.locator("input[data-precio-rapido]").fill("65");
    await fila2
      .locator("form:has(input[data-precio-rapido]) button[type=submit]")
      .click();
    await reposo(pagina);

    // -----------------------------------------------------------------------
    console.log("\n— Destacar un producto —");

    /*
     * Se elige un producto que NO este ya destacado y se deja como estaba al
     * terminar. El mismo boton marca y desmarca, asi que dar por hecho el
     * estado inicial hace que la prueba desmarque lo que venia marcado — y
     * entonces la propia prueba estropea el contenido que dice comprobar.
     */
    await pagina.reload({ waitUntil: "networkidle" });
    await pagina.fill('input[type="search"]', "Taro");
    await pagina.waitForTimeout(500);

    const filaTaro = pagina.locator("main ul > li").first();
    const nombreTaro = (await filaTaro.locator("p").first().innerText())
      .split(String.fromCharCode(10))[0]
      .trim();

    comprobar(
      "el producto de prueba parte sin insignia",
      !(await filaTaro.innerText()).includes("Favorito"),
      "ya venia destacado: otra corrida lo dejo asi",
    );

    await filaTaro.locator('button[title*="favorito"]').first().click();
    await reposo(pagina);

    await pagina.goto(`${BASE}/admin/destacados`, { waitUntil: "networkidle" });
    comprobar(
      "aparece en el módulo de destacados",
      (await pagina.locator("main").innerText()).includes(nombreTaro),
      nombreTaro,
    );

    // Se quita la insignia de ESE producto, no del ultimo de la lista.
    await pagina
      .locator("main li", { hasText: nombreTaro })
      .first()
      .locator('button:has-text("Quitar insignia")')
      .click();
    await reposo(pagina);

    await pagina.goto(`${BASE}/admin/destacados`, { waitUntil: "networkidle" });
    comprobar(
      "y se puede quitar",
      !(await pagina.locator("main").innerText()).includes(nombreTaro),
      nombreTaro,
    );

    // -----------------------------------------------------------------------
    console.log("\n— Duplicar nace oculto y se puede borrar —");

    await pagina.goto(`${BASE}/admin/productos`, { waitUntil: "networkidle" });
    await pagina.fill('input[type="search"]', "Yakult");
    await pagina.waitForTimeout(500);

    await pagina.locator('button[title*="Duplicar"]').first().click();
    await reposo(pagina, 2800);

    await pagina.fill('input[type="search"]', "copia");
    await pagina.waitForTimeout(600);

    /*
     * A partir de aqui NADA se hace sobre "el primero de la lista". Si el
     * filtro no encontrara la copia, ese primero seria un producto de verdad
     * y la prueba lo borraria: es exactamente como esta prueba se llevo por
     * delante un sabor en una corrida anterior.
     */
    const filaCopia = pagina.locator("main ul > li", { hasText: "(copia)" }).first();
    const copias = await pagina.locator("main ul > li", { hasText: "(copia)" }).count();
    comprobar("la copia existe", copias === 1, `${copias} copias`);
    if (copias !== 1) {
      throw new Error(
        "sin copia identificada no se sigue: borrar a ciegas destroza contenido real",
      );
    }

    const textoCopia = await filaCopia.innerText();
    comprobar("y nace oculta", textoCopia.includes("Oculto"),
      textoCopia.replace(/\n/g, " ").slice(0, 90));

    /*
     * Se mira el TEXTO que ve el cliente, no el HTML crudo. En modo desarrollo
     * Next incluye en la pagina un volcado de datos con fines de depuracion, y
     * comparar contra el HTML entero da por "visible" algo que no se pinta en
     * ninguna parte.
     */
    await publica.reload({ waitUntil: "networkidle" });
    const textoSinCopia = await publica.locator("body").innerText();
    comprobar("por eso no sale en la carta", !textoSinCopia.includes("(copia)"));

    // Se borra, con su confirmación.
    await filaCopia.locator('button:has-text("Eliminar")').first().click();
    await pagina.waitForTimeout(300);
    const aviso = await filaCopia.innerText();
    comprobar(
      "la confirmación avisa de que no se deshace",
      aviso.includes("no se puede deshacer"),
      aviso.replace(/\n/g, " ").slice(0, 90),
    );
    await filaCopia.locator('button:has-text("Sí, eliminar")').click();
    await reposo(pagina);

    await pagina.fill('input[type="search"]', "copia");
    await pagina.waitForTimeout(600);
    const quedan = await pagina
      .locator("main ul > li", { hasText: "(copia)" })
      .count();
    comprobar("y desaparece", quedan === 0, `${quedan} copias`);

    // -----------------------------------------------------------------------
    console.log("\n— Cambios sin guardar —");

    await pagina.goto(`${BASE}/admin/portada`, { waitUntil: "networkidle" });
    let estado = await pagina.locator("main form").last().innerText();
    comprobar("en reposo no avisa de nada", !estado.includes("sin guardar"));

    await pagina.fill('input[name="intro"]', "Prueba de cambios pendientes");
    await pagina.waitForTimeout(400);
    estado = await pagina.locator("main form").last().innerText();
    comprobar("al escribir avisa de cambios sin guardar",
      estado.includes("Cambios sin guardar"), estado.replace(/\n/g, " "));

    const original = "Toca un menú para ir directo, o desliza para verlo todo";
    await pagina.fill('input[name="intro"]', original);
    await pagina.waitForTimeout(400);
    estado = await pagina.locator("main form").last().innerText();
    comprobar(
      "y si se deshace a mano, deja de avisar",
      !estado.includes("Cambios sin guardar"),
      estado.replace(/\n/g, " "),
    );

    // -----------------------------------------------------------------------
    console.log("\n— Guardar confirma, y llega a la carta —");

    await pagina.fill('input[name="intro"]', "Desliza para ver toda la carta");
    await pagina.locator('button[type="submit"]').last().click();
    await guardadoTerminado(pagina);

    estado = await pagina.locator("main form").last().innerText();
    comprobar("confirma el guardado",
      estado.includes("guardados correctamente"), estado.replace(/\n/g, " "));

    await publica.reload({ waitUntil: "networkidle" });
    const textoPublico = await publica.locator("body").innerText();
    comprobar("la carta enseña la frase nueva",
      textoPublico.includes("Desliza para ver toda la carta"));

    // Se deja como estaba.
    await pagina.fill('input[name="intro"]', original);
    await pagina.locator('button[type="submit"]').last().click();
    await reposo(pagina);

    // -----------------------------------------------------------------------
    console.log("\n— Vista previa —");

    /*
     * Aqui no vale "networkidle": dentro hay un iframe con la carta entera
     * —fuentes, fotos, animaciones— y la red no llega a quedarse quieta.
     */
    await pagina.goto(`${BASE}/admin/vista-previa`, {
      waitUntil: "domcontentloaded",
    });
    const marco = pagina.frameLocator("iframe");
    await pagina.waitForTimeout(4000);
    const dentro = await marco.locator("body").innerText();
    comprobar("el marco enseña la carta de verdad",
      dentro.includes("Frozen Yogurt") && dentro.includes("$"),
      dentro.slice(0, 80).replace(/\n/g, " "));

    // -----------------------------------------------------------------------
    console.log("\n— La carta del cliente sigue intacta —");

    await publica.reload({ waitUntil: "networkidle" });
    const htmlFinal = await publica.content();
    const productos = (htmlFinal.match(/flex items-start gap-2\.5/g) || []).length;
    comprobar("siguen siendo 231 productos", productos === 231, `${productos}`);
    comprobar("con sus fotos", htmlFinal.includes("/categorias/"));
    comprobar("y su pastilla de preparación", htmlFinal.includes("Latte o Frape"));
  } catch (error) {
    fallos++;
    console.log(`\n  ERROR ${error.message}`);
  } finally {
    await navegador.close();
  }

  console.log(
    fallos === 0
      ? "\nEl panel funciona por módulos y cada cambio llega a la carta.\n"
      : `\n${fallos} comprobaciones fallidas.\n`,
  );
  process.exit(fallos === 0 ? 0 : 1);
})();
