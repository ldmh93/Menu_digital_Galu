/**
 * Migracion unica: de los literales de /data a data/contenido.json. YA SE
 * EJECUTO; se conserva como registro de como se hizo.
 *
 * SE NIEGA A CORRER si data/contenido.json ya existe. Volver a lanzarlo
 * sobrescribiria la carta con los datos de origen y se llevaria por delante
 * todo lo editado desde el panel. Para rehacer la migracion a proposito:
 *   node scripts/exportar-json.cjs --forzar
 *
 * Transpila los .ts con el compilador que ya trae el proyecto (no hace falta
 * instalar nada) y vuelca los grupos tal cual estan, sin reinterpretarlos: el
 * JSON resultante tiene que producir EXACTAMENTE la misma carta.
 */
const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const raiz = path.join(__dirname, "..");

/*
 * Guarda de seguridad, lo primero de todo. Este script reconstruye la carta
 * desde los .ts de origen; si se lanza sobre un contenido.json que ya existe
 * se lleva por delante todo lo editado desde el panel.
 */
const destino = path.join(raiz, "data", "contenido.json");
if (fs.existsSync(destino) && !process.argv.includes("--forzar")) {
  console.error(
    [
      "data/contenido.json ya existe.",
      "Volver a exportar lo sobrescribiria con los datos originales y perderias",
      "todo lo editado desde el panel.",
      "",
      "Si de verdad quieres rehacer la migracion:",
      "  node scripts/exportar-json.cjs --forzar",
    ].join("\n"),
  );
  process.exit(1);
}

// Permite `require("./bobas.ts")` y que `import "./types"` resuelva a types.ts.
require.extensions[".ts"] = (module, filename) => {
  const fuente = fs.readFileSync(filename, "utf8");
  const { outputText } = ts.transpileModule(fuente, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: filename,
  });
  module._compile(outputText, filename);
};

const archivos = {
  iceRollers: "iceRollers",
  bobas: "bobas",
  frozenYogurt: "frozenYogurt",
  sodasItalianas: "sodasItalianas",
  blizz: "blizz",
  malteadas: "malteadas",
  especialidades: "especialidades",
};

const grupos = Object.entries(archivos).map(([exportado, archivo]) => {
  const modulo = require(path.join(raiz, "data", `${archivo}.ts`));
  const grupo = modulo[exportado];
  if (!grupo) throw new Error(`data/${archivo}.ts no exporta "${exportado}"`);
  return grupo;
});

const { site } = require(path.join(raiz, "config", "site.ts"));

/** Identificador estable a partir del nombre, para poder editar cada renglon. */
function slugificar(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/*
 * Normaliza cada producto a objeto con `id`.
 *
 * En los .ts un producto podia ser una cadena suelta ("Coco"). El panel
 * necesita una llave estable para saber que renglon esta editando —el nombre
 * no sirve, porque cambiarlo es justo una de las cosas que se editan—, asi que
 * aqui todos pasan a objeto. La carta publica no lo nota: `toMenuItem` ya
 * normalizaba las dos formas.
 */
const usados = new Set();
function idUnico(base) {
  const raizId = base || "item";
  let id = raizId;
  let n = 2;
  while (usados.has(id)) id = `${raizId}-${n++}`;
  usados.add(id);
  return id;
}

const contenido = {
  site: {
    brand: site.brand,
    subtitle: site.subtitle,
    logo: site.logo,
    background: site.background,
    preparation: site.preparation,
    playlist: site.playlist,
    footer: site.footer,
    credits: site.credits,
  },
  groups: grupos.map((grupo) => ({
    slug: grupo.slug,
    label: grupo.label,
    active: true,
    screens: grupo.screens.map((pantalla) => ({
      ...pantalla,
      active: true,
      categories: pantalla.categories.map((categoria) => ({
        ...categoria,
        active: true,
        items: categoria.items.map((item) => {
          const objeto = typeof item === "string" ? { name: item } : { ...item };
          return {
            id: idUnico(`${categoria.id}-${slugificar(objeto.name)}`),
            active: true,
            ...objeto,
          };
        }),
      })),
    })),
  })),
};

fs.writeFileSync(destino, JSON.stringify(contenido, null, 2) + "\n", "utf8");

const productos = contenido.groups.reduce(
  (t, g) =>
    t +
    g.screens.reduce(
      (p, s) => p + s.categories.reduce((c, cat) => c + cat.items.length, 0),
      0,
    ),
  0,
);
console.log(`OK  ${contenido.groups.length} menus, ${productos} productos -> data/contenido.json`);
