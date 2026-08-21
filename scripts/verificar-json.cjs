/**
 * Red de seguridad de la migracion: el JSON tiene que describir la MISMA carta
 * que los .ts originales. Se comparan los dos arboles despues de quitarles lo
 * que el panel anadio (`id` y `active`) y de normalizar los productos que en
 * los .ts eran cadenas sueltas.
 */
const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const raiz = path.join(__dirname, "..");

require.extensions[".ts"] = (module, filename) => {
  const fuente = fs.readFileSync(filename, "utf8");
  const { outputText } = ts.transpileModule(fuente, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  });
  module._compile(outputText, filename);
};

/*
 * Los .ts originales ya no estan en el arbol: la carta se sirve del JSON y
 * dejarlos ahi solo confundiria a quien llegue despues. Se sacan del commit
 * anterior a la migracion, que es donde siguen viviendo intactos.
 */
const COMMIT = process.env.COMMIT_ORIGINAL || "90e18c1";
const temporal = path.join(require("os").tmpdir(), "galu-originales");
fs.mkdirSync(temporal, { recursive: true });
fs.writeFileSync(
  path.join(temporal, "types.ts"),
  require("child_process").execSync(`git show ${COMMIT}:data/types.ts`, {
    cwd: raiz, encoding: "utf8", maxBuffer: 10 * 1024 * 1024,
  }),
);

const nombres = ["iceRollers", "bobas", "frozenYogurt", "sodasItalianas", "blizz", "malteadas", "especialidades"];
const originales = nombres.map((n) => {
  const destino = path.join(temporal, `${n}.ts`);
  fs.writeFileSync(
    destino,
    require("child_process").execSync(`git show ${COMMIT}:data/${n}.ts`, {
      cwd: raiz,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    }),
  );
  return require(destino)[n];
});
const json = JSON.parse(fs.readFileSync(path.join(raiz, "data", "contenido.json"), "utf8"));

/** Deja un grupo en su forma canonica, sin los campos nuevos del panel. */
function canonico(grupo) {
  return {
    slug: grupo.slug,
    label: grupo.label,
    screens: grupo.screens.map((s) => {
      const { active, categories, ...resto } = s;
      return {
        ...resto,
        categories: categories.map((c) => {
          const { active, items, ...restoCat } = c;
          return {
            ...restoCat,
            items: items.map((i) => {
              const item = typeof i === "string" ? { name: i } : { ...i };
              delete item.id;
              delete item.active;
              // Orden de llaves estable para que la comparacion sea fiable.
              return Object.fromEntries(Object.entries(item).sort());
            }),
          };
        }),
      };
    }),
  };
}

let fallos = 0;
originales.forEach((original, indice) => {
  const migrado = json.groups[indice];
  const a = JSON.stringify(canonico(original));
  const b = JSON.stringify(canonico(migrado));
  if (a === b) {
    console.log(`  ok   ${original.slug}`);
  } else {
    fallos++;
    console.log(`  FALLA ${original.slug}`);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (a[i] !== b[i]) {
        console.log(`        primera diferencia en ${i}`);
        console.log(`        .ts   ...${a.slice(Math.max(0, i - 60), i + 60)}`);
        console.log(`        json  ...${b.slice(Math.max(0, i - 60), i + 60)}`);
        break;
      }
    }
  }
});

fs.writeFileSync(
  path.join(temporal, "site.ts"),
  require("child_process").execSync(`git show ${COMMIT}:config/site.ts`, {
    cwd: raiz, encoding: "utf8", maxBuffer: 10 * 1024 * 1024,
  }),
);
const { site } = require(path.join(temporal, "site.ts"));
/*
 * Del sitio solo se comparan los campos que YA existian en los .ts. El
 * contenido evoluciona —la frase de bienvenida se anadio despues, y las fotos
 * de categoria tambien—, y comparar contra el original campo por campo haria
 * que esta comprobacion fallara cada vez que el panel gana una funcion. Lo que
 * tiene que seguir siendo cierto es que nada de lo que ya estaba se perdio.
 */
const { intro: _bienvenida, ...siteComparable } = json.site;
const siteIgual = JSON.stringify(siteComparable) === JSON.stringify({
  brand: site.brand, subtitle: site.subtitle, logo: site.logo,
  background: site.background, preparation: site.preparation,
  playlist: site.playlist, footer: site.footer, credits: site.credits,
});
console.log(
  siteIgual
    ? "  ok   config/site"
    : "  FALLA config/site (algo de lo original cambio)",
);
if (!siteIgual) fallos++;

console.log(fallos === 0 ? "\nMigracion identica al original." : `\n${fallos} diferencias.`);
process.exit(fallos === 0 ? 0 : 1);
