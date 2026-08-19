/**
 * Pruebas de las operaciones del panel.
 *
 * Se ejecutan contra el contenido REAL (data/contenido.json) pero sin tocarlo:
 * las funciones de lib/editor.ts son puras y devuelven una copia, asi que el
 * archivo de la carta ni se abre para escribir. Comprobar cada operacion aqui
 * es lo que permite fiarse de los botones del panel, que no hacen otra cosa
 * que llamar a estas mismas funciones.
 *
 *   node scripts/probar-editor.cjs
 */
const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const raiz = path.join(__dirname, "..");

// Transpila TypeScript al vuelo y resuelve el alias "@/" a la raiz del proyecto.
require.extensions[".ts"] = (module, filename) => {
  const fuente = fs.readFileSync(filename, "utf8");
  const { outputText } = ts.transpileModule(fuente, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: filename,
  });

  const conAlias = outputText.replace(
    /require\("@\/([^"]+)"\)/g,
    (_, resto) => `require(${JSON.stringify(path.join(raiz, resto))})`,
  );

  module._compile(conAlias, filename);
};

const editor = require(path.join(raiz, "lib", "editor.ts"));

const base = JSON.parse(
  fs.readFileSync(path.join(raiz, "data", "contenido.json"), "utf8"),
);

let fallos = 0;
function comprobar(descripcion, condicion, detalle) {
  if (condicion) {
    console.log(`  ok    ${descripcion}`);
  } else {
    fallos++;
    console.log(`  FALLA ${descripcion}${detalle ? ` — ${detalle}` : ""}`);
  }
}

/** Busca un producto por id en cualquier parte de la carta. */
function buscar(contenido, id) {
  const encontrado = editor.localizarProducto(contenido, id);
  if (!encontrado) return null;
  const item = encontrado.categoria.items[encontrado.indice];
  return typeof item === "string" ? { name: item } : item;
}

function contarProductos(contenido) {
  return contenido.groups.reduce(
    (t, g) =>
      t +
      g.screens.reduce(
        (p, s) => p + s.categories.reduce((c, cat) => c + cat.items.length, 0),
        0,
      ),
    0,
  );
}

const donde = {
  grupo: "frozen-yogurt",
  bloque: "frozen-yogurt",
  categoria: "tamanos",
};

console.log("\n— Editar el precio de un producto —");
{
  const antes = buscar(base, "tamanos-mediano");
  const despues = editor.editarProducto(base, "tamanos-mediano", {
    name: "Mediano",
    price: 95,
  });
  const editado = buscar(despues, "tamanos-mediano");

  comprobar("el precio pasa de 65 a 95", antes.price === 65 && editado.price === 95,
    `antes ${antes.price}, despues ${editado.price}`);
  comprobar("el original no se toca", buscar(base, "tamanos-mediano").price === 65);
  comprobar("conserva el id", editado.id === "tamanos-mediano");
  comprobar("no cambia el numero de productos",
    contarProductos(despues) === contarProductos(base));
}

console.log("\n— Cambiar el nombre —");
{
  const despues = editor.editarProducto(base, "tamanos-cono", { name: "Conito" });
  comprobar("el nombre cambia", buscar(despues, "tamanos-cono").name === "Conito");
  comprobar("y el id sigue siendo el mismo",
    buscar(despues, "tamanos-cono").id === "tamanos-cono");
}

console.log("\n— Agregar un producto —");
{
  const despues = editor.agregarProducto(base, donde, {
    name: "Tamaño Gigante",
    price: 120,
    description: "Para compartir",
  });

  comprobar("hay un producto mas",
    contarProductos(despues) === contarProductos(base) + 1);

  const nuevo = despues.groups
    .find((g) => g.slug === "frozen-yogurt")
    .screens[0].categories.find((c) => c.id === "tamanos")
    .items.at(-1);

  comprobar("se guarda con el nombre dado", nuevo.name === "Tamaño Gigante");
  comprobar("se le asigna un id sin acentos", nuevo.id === "tamanos-tamano-gigante",
    nuevo.id);
  comprobar("nace visible", nuevo.active === true);
  comprobar("guarda precio y descripcion",
    nuevo.price === 120 && nuevo.description === "Para compartir");
}

console.log("\n— Ids que no chocan —");
{
  let contenido = editor.agregarProducto(base, donde, { name: "Cono" });
  contenido = editor.agregarProducto(contenido, donde, { name: "Cono" });

  const items = contenido.groups
    .find((g) => g.slug === "frozen-yogurt")
    .screens[0].categories.find((c) => c.id === "tamanos").items;

  const ids = items.map((i) => i.id);
  comprobar("dos productos con el mismo nombre reciben ids distintos",
    new Set(ids).size === ids.length, ids.slice(-3).join(", "));
}

console.log("\n— Desactivar y reactivar —");
{
  const apagado = editor.alternarProducto(base, "tamanos-chico");
  comprobar("se apaga", buscar(apagado, "tamanos-chico").active === false);

  const encendido = editor.alternarProducto(apagado, "tamanos-chico");
  comprobar("y se vuelve a encender",
    buscar(encendido, "tamanos-chico").active === true);

  comprobar("sigue existiendo (no se borra al apagarlo)",
    contarProductos(apagado) === contarProductos(base));
}

console.log("\n— Eliminar —");
{
  const despues = editor.eliminarProducto(base, "tamanos-mini");
  comprobar("desaparece", buscar(despues, "tamanos-mini") === null);
  comprobar("hay un producto menos",
    contarProductos(despues) === contarProductos(base) - 1);
}

console.log("\n— Mover de categoria —");
{
  const destino = {
    grupo: "sodas-italianas",
    bloque: "sodas-italianas",
    categoria: "sabores",
  };

  const despues = editor.editarProducto(
    base,
    "tamanos-cono",
    { name: "Cono" },
    destino,
  );

  const ubicacion = editor.localizarProducto(despues, "tamanos-cono").donde;
  comprobar("llega a la categoria destino",
    ubicacion.grupo === "sodas-italianas" && ubicacion.categoria === "sabores",
    JSON.stringify(ubicacion));
  comprobar("ya no esta en la de origen",
    !despues.groups
      .find((g) => g.slug === "frozen-yogurt")
      .screens[0].categories.find((c) => c.id === "tamanos")
      .items.some((i) => i.id === "tamanos-cono"));
  comprobar("el total no cambia",
    contarProductos(despues) === contarProductos(base));
}

console.log("\n— Color de la cinta —");
{
  const donde2 = { grupo: "blizz", bloque: "blizz", categoria: "clasico" };
  const despues = editor.editarCategoria(base, donde2, {
    name: "Clásico",
    accent: "morado",
    precioUnico: 55,
  });

  const cat = despues.groups
    .find((g) => g.slug === "blizz")
    .screens[0].categories.find((c) => c.id === "clasico");

  comprobar("el acento cambia a morado", cat.accent === "morado");
  comprobar("el precio se conserva", cat.price === 55);
  comprobar("solo se aceptan los cinco de marca",
    editor.ACENTOS.join(",") === "rosa,lavanda,menta,amarillo,morado");
}

console.log("\n— Precio de tarjeta: unico, por tamanios, o ninguno —");
{
  const donde3 = {
    grupo: "sodas-italianas",
    bloque: "sodas-italianas",
    categoria: "sabores",
  };
  const leerPrecio = (contenido) =>
    contenido.groups
      .find((g) => g.slug === "sodas-italianas")
      .screens[0].categories.find((c) => c.id === "sabores").price;

  const conTramos = editor.editarCategoria(base, donde3, {
    name: "Sabores",
    accent: "lavanda",
    tramos: [
      { label: "16 oz", value: 70 },
      { label: "24 oz", value: 80 },
    ],
  });
  comprobar("guarda dos tamanios",
    JSON.stringify(leerPrecio(conTramos)) ===
      '[{"label":"16 oz","value":70},{"label":"24 oz","value":80}]');

  const conUnico = editor.editarCategoria(base, donde3, {
    name: "Sabores",
    accent: "lavanda",
    precioUnico: 69,
  });
  comprobar("guarda un precio unico", leerPrecio(conUnico) === 69);

  const sinPrecio = editor.editarCategoria(base, donde3, {
    name: "Sabores",
    accent: "lavanda",
  });
  comprobar("sin precio BORRA la clave (no la deja en cero)",
    leerPrecio(sinPrecio) === undefined, String(leerPrecio(sinPrecio)));
}

console.log("\n— Jerarquia: mover un menu —");
{
  const orden = (c) => c.site.playlist.join(" > ");
  console.log(`  orden actual: ${orden(base)}`);

  const subido = editor.moverMenu(base, "bobas", "arriba");
  comprobar("Bobas sube al primer puesto",
    subido.site.playlist[0] === "bobas" && subido.site.playlist[1] === "frozen-yogurt",
    orden(subido));

  const primero = base.site.playlist[0];
  const tope = editor.moverMenu(base, primero, "arriba");
  comprobar("el primero no se sale por arriba",
    tope.site.playlist[0] === primero);

  const bajado = editor.moverMenu(base, "frozen-yogurt", "abajo");
  comprobar("bajar lo intercambia con el siguiente",
    bajado.site.playlist[0] === "bobas" && bajado.site.playlist[1] === "frozen-yogurt",
    orden(bajado));
}

console.log("\n— Apagar un menu entero —");
{
  const despues = editor.alternarMenu(base, "blizz");
  comprobar("el menu queda apagado",
    despues.groups.find((g) => g.slug === "blizz").active === false);
}

console.log("\n— Titulo y preparacion de un bloque —");
{
  const despues = editor.editarBloque(base, "bobas", "bobas", {
    title: "Bobas",
    section: "Sabores",
    preparation: "Latte, Frape o Soda",
  });
  const bloque = despues.groups
    .find((g) => g.slug === "bobas")
    .screens.find((s) => s.slug === "bobas");

  comprobar("cambia la preparacion",
    bloque.preparation === "Latte, Frape o Soda", bloque.preparation);

  const oculta = editor.editarBloque(base, "bobas", "bobas", {
    title: "Bobas",
    preparation: null,
  });
  comprobar("null la oculta",
    oculta.groups.find((g) => g.slug === "bobas").screens[0].preparation === null);

  const heredada = editor.editarBloque(base, "bobas", "bobas", {
    title: "Bobas",
    preparation: undefined,
  });
  comprobar("sin valor, hereda la general (clave ausente)",
    !("preparation" in heredada.groups.find((g) => g.slug === "bobas").screens[0]));
}

console.log("\n— Errores claros cuando algo no existe —");
{
  const intentar = (fn) => {
    try {
      fn();
      return null;
    } catch (error) {
      return error.message;
    }
  };

  comprobar("editar un producto inexistente avisa",
    (intentar(() => editor.editarProducto(base, "no-existe", { name: "X" })) || "")
      .includes("no-existe"));
  comprobar("una categoria inexistente avisa",
    (intentar(() =>
      editor.editarCategoria(base, { ...donde, categoria: "fantasma" }, {
        name: "X",
        accent: "rosa",
      })) || "").includes("fantasma"));
}

console.log(
  fallos === 0
    ? "\nTodas las operaciones del panel se comportan como deben.\n"
    : `\n${fallos} comprobaciones fallidas.\n`,
);
process.exit(fallos === 0 ? 0 : 1);
