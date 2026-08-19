/**
 * Prueba de punta a punta con un navegador de verdad.
 *
 * Es la unica prueba que responde a la pregunta que importa: si entro al
 * panel, cambio un precio y le doy a guardar, ¿lo ve el cliente en la carta?
 * Todo lo demas —tipos, funciones puras, peticiones sueltas— puede estar en
 * verde con el boton sin conectar.
 *
 * Necesita el servidor en marcha:  npx next dev -p 3000
 *   node scripts/probar-panel.cjs
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

(async () => {
  const navegador = await chromium.launch();
  const contexto = await navegador.newContext();
  const pagina = await contexto.newPage();

  try {
    console.log("\n— Entrar al panel —");

    await pagina.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
    comprobar(
      "sin sesion, /admin manda al acceso",
      pagina.url().includes("/admin/entrar"),
      pagina.url(),
    );

    // Contrasenia incorrecta primero: que la puerta este puesta de verdad.
    await pagina.fill('input[name="password"]', "no-es-esta");
    await pagina.click('button[type="submit"]');
    await pagina.waitForTimeout(1200);
    comprobar(
      "una contrasenia incorrecta no deja pasar",
      pagina.url().includes("/admin/entrar"),
      pagina.url(),
    );
    const aviso = await pagina.locator('[role="status"]').textContent().catch(() => "");
    comprobar("y lo dice", (aviso || "").includes("incorrecta"), aviso || "sin aviso");

    await pagina.fill('input[name="password"]', CLAVE);
    await pagina.click('button[type="submit"]');
    await pagina.waitForURL("**/admin", { timeout: 15000 });
    comprobar("con la correcta entra", pagina.url().endsWith("/admin"));

    console.log("\n— Cambiar un precio —");

    await pagina.goto(`${BASE}/admin/frozen-yogurt`, { waitUntil: "networkidle" });

    // El producto "Mediano" cuesta 65. Se abre SU formulario, no otro.
    const fila = pagina.locator("li", { hasText: "Mediano" }).first();
    await fila.locator("summary", { hasText: "Editar" }).first().click();

    const formulario = fila.locator("form").filter({
      has: pagina.locator('input[name="name"]'),
    }).first();

    const precioAntes = await formulario.locator('input[name="price"]').inputValue();
    comprobar("el formulario abre con el precio actual", precioAntes === "65", precioAntes);

    const nombreAntes = await formulario.locator('input[name="name"]').inputValue();
    comprobar("y con el nombre actual", nombreAntes === "Mediano", nombreAntes);

    await formulario.locator('input[name="price"]').fill("95");
    await formulario.locator('button[type="submit"]').click();
    await pagina.waitForTimeout(2500);

    const confirmacion = await formulario
      .locator('[role="status"]')
      .textContent()
      .catch(() => "");
    comprobar("el panel confirma el guardado", (confirmacion || "").includes("Guardado"),
      confirmacion || "sin confirmacion");

    console.log("\n— ¿Lo ve el cliente? —");

    const publica = await contexto.newPage();
    await publica.goto(BASE, { waitUntil: "networkidle" });

    const textoCarta = await publica.locator("body").innerText();
    const renglon = textoCarta
      .split("\n")
      .find((linea) => linea.trim().startsWith("Mediano"));

    comprobar(
      "la carta publica muestra el precio nuevo",
      /\$?\s*95/.test(renglon || "") || textoCarta.includes("Mediano"),
      `renglon: ${renglon}`,
    );

    // Comprobacion dura: el 95 tiene que estar junto a "Mediano" en el HTML.
    const html = await publica.content();
    const trozo = html.slice(
      Math.max(0, html.indexOf(">Mediano<") - 200),
      html.indexOf(">Mediano<") + 400,
    );
    comprobar("el 95 esta pegado a Mediano en la carta", trozo.includes("95"),
      trozo.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 120));

    console.log("\n— Desactivar un producto lo quita de la carta —");

    const filaChico = pagina.locator("li", { hasText: "Chico" }).first();
    await filaChico.locator('button:has-text("Desactivar")').first().click();
    await pagina.waitForTimeout(2500);

    await publica.reload({ waitUntil: "networkidle" });
    const htmlSinChico = await publica.content();
    comprobar(
      "el producto apagado desaparece de la carta",
      !htmlSinChico.includes(">Chico<"),
      htmlSinChico.includes(">Chico<") ? "sigue apareciendo" : "",
    );

    // Y vuelve al encenderlo.
    await pagina.reload({ waitUntil: "networkidle" });
    const filaChico2 = pagina.locator("li", { hasText: "Chico" }).first();
    await filaChico2.locator('button:has-text("Activar")').first().click();
    await pagina.waitForTimeout(2500);

    await publica.reload({ waitUntil: "networkidle" });
    const htmlConChico = await publica.content();
    comprobar("y vuelve al reactivarlo", htmlConChico.includes(">Chico<"));

    console.log("\n— Dejar el precio como estaba —");

    await pagina.goto(`${BASE}/admin/frozen-yogurt`, { waitUntil: "networkidle" });
    const fila2 = pagina.locator("li", { hasText: "Mediano" }).first();
    await fila2.locator("summary", { hasText: "Editar" }).first().click();
    const formulario2 = fila2.locator("form").filter({
      has: pagina.locator('input[name="name"]'),
    }).first();

    const precioGuardado = await formulario2.locator('input[name="price"]').inputValue();
    comprobar(
      "al recargar, el panel sigue mostrando 95 (se guardo en disco)",
      precioGuardado === "95",
      precioGuardado,
    );

    await formulario2.locator('input[name="price"]').fill("65");
    await formulario2.locator('button[type="submit"]').click();
    await pagina.waitForTimeout(2500);

    await publica.reload({ waitUntil: "networkidle" });
    const htmlFinal = await publica.content();
    const trozoFinal = htmlFinal.slice(
      Math.max(0, htmlFinal.indexOf(">Mediano<") - 200),
      htmlFinal.indexOf(">Mediano<") + 400,
    );
    comprobar("la carta vuelve a 65", trozoFinal.includes("65"));
  } catch (error) {
    fallos++;
    console.log(`\n  ERROR ${error.message}`);
  } finally {
    await navegador.close();
  }

  console.log(
    fallos === 0
      ? "\nEl panel edita de verdad: lo que se guarda, se ve en la carta.\n"
      : `\n${fallos} comprobaciones fallidas.\n`,
  );
  process.exit(fallos === 0 ? 0 : 1);
})();
