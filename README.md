# GALU · Menú digital

Carta en línea de GALU (Ice Rollers, Bobas, Frozen Yogurt, Sodas Italianas,
Blizz, Malteadas y Especialidades). Next.js 15 (App Router) + TypeScript +
TailwindCSS 4 + Framer Motion + Lucide.

Pensada para el **celular** del cliente: una sola página que se recorre con el
dedo, con barra de menús pegajosa y buscador. Se adapta sola a tablet y a
computadora.

---

## Arrancar

```bash
npm install
npm run dev        # http://localhost:3000
```

Producción:

```bash
npm run build
npm start
```

### ⚠️ No trabajes desde el disco externo `E:`

**El disco externo está corrompiendo archivos.** No es una sospecha: durante el
trabajo del 13 de agosto de 2026 se comprobó tres veces sobre la misma copia en
`E:\Proyectos web\menu digital galu`.

1. `node_modules/next/dist/build/webpack/plugins/eval-source-map-dev-tool-plugin.js`
   apareció con sus 10 144 bytes **escritos a ceros**. Síntoma: al arrancar,
   `SyntaxError: Invalid or unexpected token` y nada más.
2. Tras reinstalar, el binario nativo de SWC (148 MB) quedó dañado y `next
   build` moría con `exited with code: 3221225477` — que es
   `STATUS_ACCESS_VIOLATION` de Windows, o sea un cierre en seco del proceso.
3. Tras esa reinstalación, `framer-motion/dist/es/index.mjs` **contenía en
   disco el código de otro archivo de Next**, un `recursive-readdir.ts` que no
   tiene nada que ver.

Y `npm ci` tarda **9 minutos** ahí contra **28 segundos** en el disco interno.

Copia el proyecto a una carpeta del disco interno y trabaja desde ahí. Conviene
además pasarle un `chkdsk E: /f` al disco y revisar el cable o la carcasa; los
archivos de `/data`, `/app` y `/components` también pueden corromperse, y ahí
sí se pierde trabajo.

El proyecto ya no necesita ningún parche para vivir en exFAT: donde el
controlador daba problemas era en `readlink`, y ahora `next.config.ts` apaga la
resolución de enlaces simbólicos de webpack (`resolve.symlinks = false`), que
evita esas llamadas de raíz. Se borraron `exfat-readlink-fix.cjs` y los scripts
`dev:exfat` / `build:exfat`: bastan `npm run dev` y `npm run build`.

## URLs

| URL | Qué muestra |
| --- | --- |
| `/` | **La del código QR.** Toda la carta, un menú tras otro |
| `/menu/ice-rollers` | Solo Ice Rollers |
| `/menu/bobas` | Solo Bobas (sus 5 bloques) |
| `/menu/frozen-yogurt` | Solo Frozen Yogurt |
| `/menu/sodas-italianas` | Solo Sodas Italianas |
| `/menu/blizz` | Solo Blizz |
| `/menu/malteadas` | Pendiente de datos |
| `/menu/especialidades` | Pendiente de datos |

Las rutas de un solo menú salen de **una** ruta dinámica (`app/menu/[slug]`):
al añadir un menú a `/data` su URL existe sola, sin crear carpetas. Siguen
siendo estáticas.

---

## Cómo se recorre la carta

- **Barra de menús pegajosa.** Se arrastra con el dedo, se ilumina el menú que
  se está leyendo y la fila se centra sola en él.
- **Buscador.** Filtra por nombre y por ingredientes, sin acentos ("platano"
  encuentra "Plátano") y marcando en amarillo lo encontrado. Con más de 200
  productos repartidos en siete cartas, es la diferencia entre encontrar la
  Nutella y rendirse.
- **Volver arriba.** Aparece tras un rato de recorrido.
- Se respeta `prefers-reduced-motion`: con esa opción se detienen los bucles de
  fondo y las entradas de las tarjetas.

---

## Editar el menú

**Todo el contenido vive en `/data`. Nunca se escriben productos dentro de un
componente.**

```
data/
  iceRollers.ts      ← datos reales (1 bloque)
  bobas.ts           ← datos reales (5 bloques)
  frozenYogurt.ts    ← datos reales (1 bloque)
  sodasItalianas.ts  ← datos reales (1 bloque)
  blizz.ts           ← datos reales (1 bloque)
  malteadas.ts       ← PENDIENTE, sin productos
  especialidades.ts  ← PENDIENTE, sin productos
  types.ts           ← el "esquema" de los datos
  menus.ts           ← registro y orden de aparición
```

Cada archivo exporta un **grupo** (`MenuGroup`): un menú puede ocupar un bloque
o varios. Bobas usa cinco porque son 64 sabores base + 72 combinaciones; todos
llevan el mismo título "Bobas" y se distinguen por el subtítulo de sección
(`section`).

Un producto puede ser texto plano o un objeto:

```ts
items: [
  "Arándanos",                                        // simple
  { name: "Fresa", note: "$79" },                     // excepción de precio
  { name: "Chocolate Dubái", tag: "nuevo" },          // insignia
  { name: "Yakult", tag: "favorito" },
  { name: "Banana Split",                             // con ingredientes
    description: "Plátano · Hershey's · Nieve de Vainilla" },
]
```

El precio puede ser único, por tamaños, o vivir en cada producto:

```ts
price: 60                                             // una sola pastilla
price: [{ label: "16 oz", value: 72 },                // dos pastillas
        { label: "24 oz", value: 89 }]

// Sin `price` de categoría: cada renglón lleva el suyo, alineado a la derecha.
// Es lo que usa Frozen Yogurt, donde se cobra por tamaño y no por sabor.
items: [{ name: "Cono", description: "1 topping · sin fruta", price: 35 }]
```

Y se puede forzar una sola columna cuando la lista es una tarifa y se lee mejor
seguida (`columns: 1` en Frozen Yogurt):

```ts
{ id: "tamanos", name: "Tamaños", columns: 1, items: [...] }
```

Los extras aparecen como pastillas justo debajo de las tarjetas, pegados al
contenido:

```ts
extras: [{ name: "Leche vegetal", price: 10 }, { name: "Tapioca", price: 15 }]
```

Los acentos disponibles (`accent`) son los colores del fondo oficial:
`rosa`, `lavanda`, `menta`, `amarillo`, `morado`.

### Ajustes globales

`config/site.ts` — subtítulo, orden de los menús, redes sociales y la firma del
pie. No hay que tocar código para cambiarlos.

`preparation` es la pastilla de forma de preparación que sale bajo el título de
un menú. En `config/site.ts` va **vacía**: no todo se sirve latte ni frape, y
anunciarlo donde no aplica confunde al cliente. Cada menú que sí la ofrece la
declara en su archivo de `/data` — hoy solo **Bobas**, en los cinco bloques:

```ts
const PREPARACION = "Latte o Frape";   // data/bobas.ts

const bobasSabores: MenuScreen = {
  title: "Bobas",
  preparation: PREPARACION,
  ...
};
```

Si algún día la mayoría de los menús la ofreciera, conviene el camino
contrario: ponerla en `config/site.ts` y marcar con `preparation: null` los
pocos que no.

`credits` es la firma del desarrollo (nombre, descripción y teléfono). El
teléfono se convierte solo en un enlace `tel:` marcable.

---

## Cómo está construido

```
app/
  layout.tsx            fuentes, metadatos para compartir y fondo
  page.tsx              la carta completa → es la URL del QR
  menu/[slug]/page.tsx  un solo menú, generado estáticamente
components/
  MenuBrowser.tsx       búsqueda, menú activo y montaje de la página
  MenuNav.tsx           barra pegajosa: menús + buscador
  MenuSection.tsx       un menú entero (título, bloques, extras, nota)
  CategoryCard.tsx      tarjeta de categoría
  ProductList.tsx       lista de productos y resaltado de la búsqueda
  SiteHeader / SiteFooter / SiteBackground / Logo / ExtrasBar / BackToTop
lib/
  layout.ts             reglas de reparto y filtrado
  accents.ts            colores de marca por acento
  motion.ts             lenguaje de animación
  format.ts             precios y utilidades
styles/globals.css      tokens de diseño (paleta, sombras, cristal)
```

### Decisiones que conviene conocer

**Una página, no un pase de diapositivas.** La versión anterior era señalización
para un televisor: lienzo fijo de 1080 × 1920 escalado con `transform`, y las
cartas pasando solas cada doce segundos. En un televisor tiene sentido, porque
el cliente mira de lejos y no puede tocar nada. En un celular las dos ideas se
vuelven en contra: el lienzo fijo deja la letra diminuta, y esperar turno para
ver el precio de un frozen yogurt es insufrible. Ahora todo fluye y se navega.

**El navegador reparte, nosotros declaramos.** Ya no se calcula en píxeles
cuántas columnas caben: las listas usan `column-width` de CSS, así que el
aparato mete dos columnas de sabores en un celular y seis en un monitor, con el
mismo código y sin saber de antemano el ancho. El orden de lectura sigue siendo
vertical, como en una carta impresa. Los tamaños de letra son `clamp()`: crecen
con la pantalla, y una lista de siete tamaños se lee más grande que una de
cuarenta sabores.

**El reparto de tarjetas es solo para pantallas grandes.** `solo`, `duo`, `trio`
y `feature` siguen existiendo en los datos, pero ahora significan "hasta cuántas
por fila cuando sobra ancho". En el celular siempre es una.

**Lo repetido se dice una vez.** Cada bloque de Bobas repetía "Todas disponibles
en 16 y 24 oz" y las cuatro pastillas de extras, porque cada pantalla se veía
sola. En una página que se recorre de un tirón eso es ruido: si el dato es igual
en todos los bloques, se saca una sola vez al final del menú.

**Nada de `backdrop-filter` en las tarjetas.** Obliga al navegador a releer y
desenfocar todo lo que hay detrás en cada repintado — y en una página que se
arrastra con el dedo, eso es en cada cuadro del scroll. Sobre un cristal que ya
es blanco al 80-90 % el desenfoque no se nota: el aspecto lo dan el degradado,
el borde claro y la sombra. La única excepción es la barra pegajosa, que son 70
píxeles de alto y no cuesta nada.

**Fondo fijo.** El arte va en una capa `fixed` y la carta se desliza por encima:
da sensación de profundidad y el compositor no repinta nada al hacer scroll. El
arte es un lienzo 9:16, así que en un monitor ancho se recorta y quedaría solo
la trama de chispas; los halos pastel de esa misma capa (medidos en `vmax`)
devuelven las manchas de color a cualquier proporción.

**Animaciones al entrar en pantalla, y una sola vez.** Las tarjetas aparecen con
`whileInView` en lugar de animarse todas al cargar. Los productos ya no se
animan uno a uno: doscientos elementos escalonados se sienten como lentitud
justo cuando el dedo quiere avanzar.

---

## Preparado para el panel administrativo

Los archivos de `/data` implementan los tipos de `data/types.ts`. Cuando exista
el panel, basta con:

1. Convertir `getGroup()` y `getPlaylistGroups()` de `data/menus.ts` en
   funciones `async` que consulten la base de datos.
2. Hacer lo mismo con `site` de `config/site.ts`.

Ningún componente cambia: todos reciben los datos por props y ninguno conoce el
origen.
