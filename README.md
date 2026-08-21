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

**Lo normal es editarlo desde el panel, no tocando archivos.** Arranca el
proyecto y entra a <http://localhost:3000/admin>. Ahí se cambian títulos,
nombres, precios, descripciones, el color de la cinta de cada tarjeta y el
orden de los menús, y se agregan, ocultan o eliminan productos. Lo que guardes
se ve en la carta al momento.

**Todo el contenido vive en `data/contenido.json`. Nunca se escriben productos
dentro de un componente.**

```
data/
  contenido.json     ← LA CARTA ENTERA: menús, tarjetas, productos y precios
  types.ts           ← el "esquema" de los datos
  menus.ts           ← lectura para la carta pública (poda lo desactivado)
```

Se puede editar el JSON a mano si hace falta, pero el panel evita los errores
tontos: un id repetido, un precio en cero donde debía no haber precio, o un
color que no es de la marca.

Cada entrada de `groups` es un **menú** (`MenuGroup`), y puede ocupar un bloque
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

El nombre del negocio, el subtítulo, la frase de bienvenida, las redes, el
teléfono y la firma del pie **se editan desde el panel** (módulos Portada y
Configuración) y viven en el bloque `site` de `data/contenido.json`.

`config/site.ts` se quedó como **valores de respaldo**: los usa un componente
que se pinte fuera del proveedor —una prueba, una página suelta— para que se
vea la carta de siempre en vez de reventar. El orden de los menús tampoco está
ahí: es contenido, y lo decide el panel.

Los componentes de la carta reciben esos datos por contexto
(`components/SitioProvider.tsx`), poblado en el layout raíz. Antes cada uno
importaba el literal compilado, y con eso cambiar el subtítulo desde el panel
no servía de nada: la carta seguía pintando el valor del día que se compiló.

`preparation` es la pastilla de forma de preparación que sale bajo el título de
un menú. La general va **vacía**: no todo se sirve latte ni frape, y
anunciarlo donde no aplica confunde al cliente. Cada menú que sí la ofrece la
declara en su bloque — hoy solo **Bobas**, en los cinco:

```json
{ "slug": "bobas", "title": "Bobas", "preparation": "Latte o Frape", … }
```

Desde el panel son los tres botones de "Forma de preparación" al editar un
bloque: heredar la general, poner una propia, u ocultarla. Si algún día la
mayoría de los menús la ofreciera, conviene el camino contrario: ponerla como
general y ocultarla en los pocos que no.

### Las fotos de cada menú

Cada menú puede llevar una foto de producto que va **entre el título y las
tarjetas**: título → foto → contenido.

```json
{
  "slug": "bobas",
  "image": "/categorias/bobas.webp",
  "imageAlt": "Vaso de boba con tapioca y hielo",
  "imageRatio": 0.6023
}
```

Es opcional: un menú sin foto se pinta exactamente igual que antes, sin hueco
ni marcador. Hoy la tienen Frozen Yogurt, Bobas, Ice Rollers y Sodas Italianas
— **Blizz no**, y por eso se ve solo con su título.

**La foto tiene que venir recortada sobre transparente.** En la carta no se
enmarca: el producto flota sobre el fondo de marca con su propia sombra y un
halo del color de su primera tarjeta. Una foto con fondo opaco se vería como
un cuadro pegado encima.

Se dimensionan por **altura**, no por anchura. Los productos no comparten
proporción —el vaso de boba es alargado y el cuenco de yogurt casi cuadrado— y
fijando el ancho, el vaso alto se volvería gigante y el cuenco enano.

#### Añadir o cambiar una foto

Deja el archivo en `Imagenes categorias/`, apúntalo en el mapa de
`scripts/preparar-imagenes.cjs` y corre:

```bash
node scripts/preparar-imagenes.cjs
```

El script recorta el aire transparente que rodea al producto, lo redimensiona a
lo que de verdad se pinta en pantalla y lo guarda en `public/categorias/` como
WebP. Las cuatro fotos originales pesaban 7 MB entre todas y quedaron en 723 KB
—un 90 % menos— sin diferencia visible. Ese peso importa: la carta se abre casi
siempre con datos móviles y dentro del local.

Después actualiza `image`, `imageAlt` e `imageRatio` en `data/contenido.json`.

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

## El panel de administración

Vive en `/admin` y está protegido por contraseña. No se enlaza desde ninguna
parte de la carta y pide no ser indexado.

Está organizado **por módulos**: cada uno corresponde a una parte de la carta
y se administra por separado, sin que se mezclen sus ajustes.

| Módulo | Qué administra |
| --- | --- |
| 🏠 Portada | Logo, subtítulo y frase de bienvenida |
| 📂 Categorías | Los menús, su orden, su foto y las tarjetas de dentro |
| 🍔 Productos | Los 231, con búsqueda, filtros y acciones rápidas |
| ⭐ Destacados | Los que llevan insignia de nuevo o favorito |
| 🖼️ Imágenes | Las fotos y **dónde se usa cada una** |
| 🎨 Apariencia | La paleta, las tipografías y el logo |
| ⚙️ Configuración | Nombre del negocio, redes, teléfono y firma |
| 👁 Vista previa | La carta real dentro del panel, en tres anchos |

```
app/admin/
  modulos.ts             ← EL REGISTRO: define qué módulos existen
  estilos.ts             ← clases compartidas (neutro: servidor y cliente)
  ui.tsx                 ← piezas comunes: paneles, botones, estados
  navegacion.tsx         ← barra lateral / fila en móvil
  acciones.ts            ← lo único que puede escribir en el contenido
  page.tsx               ← portada: una tarjeta por módulo
  entrar/                ← la puerta
  portada/ categorias/ productos/ destacados/
  imagenes/ apariencia/ configuracion/ vista-previa/
lib/
  contenido.ts           ← TODO el acceso a disco pasa por aquí
  editor.ts              ← las reglas de edición, en funciones puras
  imagenes.ts            ← subida de fotos y medidas
  sesion.ts              ← la cookie firmada
```

### Añadir un módulo nuevo

No hace falta rediseñar nada. Se declara en `app/admin/modulos.ts` y se crea su
carpeta con un `page.tsx`:

```ts
{
  slug: "promociones",
  nombre: "Promociones",
  icono: "🏷️",
  descripcion: "Ofertas de temporada.",
  alcance: "Qué promociones se anuncian y cuándo caducan.",
  contar: (contenido) => ({ valor: 3, unidad: "activas" }),
}
```

Con eso ya sale como tarjeta en la portada —con su recuento— y en la barra de
navegación. Los recuentos se **calculan** sobre el contenido real: un número
escrito a mano es un número que acaba mintiendo.

### Acciones rápidas

Lo que se hace muchas veces al día cuesta un toque, sin abrir formularios:
cambiar un precio desde la lista, ocultar o mostrar, marcar como favorito o
nuevo, duplicar (la copia **nace oculta**, para que nadie la vea a medio
hacer), subir y bajar productos y tarjetas, y reordenar los menús.

Los formularios avisan de **cambios sin guardar** y confirman al guardar. El
aviso compara contra los valores iniciales, así que si escribes algo y lo
borras, el formulario vuelve a estar limpio.

**Para usarlo** copia `.env.example` a `.env.local` y pon una contraseña y un
secreto. Sin esas dos variables el panel avisa en vez de arrancar a medias.

```bash
cp .env.example .env.local
node -e "console.log(require(crypto).randomBytes(32).toString(hex))"
```

### Dónde funciona y dónde no

El panel guarda escribiendo `data/contenido.json`, así que **funciona cuando
corre en una computadora** — la tuya, con `npm run dev`. En Vercel el disco es
de solo lectura: la carta se sirve perfectamente, pero el panel no puede
guardar y lo avisa en pantalla en vez de fallar al pulsar el botón.

Para editar desde el móvil con el sitio ya publicado hay que mover el contenido
a una base de datos. Todo el acceso a disco está aislado en `lib/contenido.ts`
justamente para eso: se reimplementan `leerContenido` y `guardarContenido` y no
se toca ni el panel ni la carta.

### Comprobarlo

```bash
node scripts/probar-editor.cjs     # las reglas de edición
node scripts/probar-dashboard.cjs  # el panel entero en un navegador de verdad
node scripts/probar-fotos.cjs      # las fotos en móvil, tablet y escritorio
node scripts/verificar-json.cjs    # el JSON sigue siendo la carta original
```
