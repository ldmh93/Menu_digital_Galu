import type { MenuExtra, MenuGroup, MenuScreen } from "./types";

/**
 * BOBAS — datos oficiales de GALU.
 *
 * El menu completo son 64 sabores base + 72 combinaciones. Se reparte en cinco
 * bloques (sabores, especiales, combinaciones...) para que cada uno se lea como
 * una carta corta en el celular en lugar de una lista interminable.
 *
 * Todos los tamanos son 16 oz y 24 oz.
 */

/** Precios base: la mayoria de sabores. */
const PRECIO_BASE = [
  { label: "16 oz", value: 72 },
  { label: "24 oz", value: 89 },
];

/** Precios de especiales y de todas las combinaciones. */
const PRECIO_ESPECIAL = [
  { label: "16 oz", value: 79 },
  { label: "24 oz", value: 89 },
];

/** Complementos con costo adicional. Se muestran como pastillas en el pie. */
const EXTRAS: MenuExtra[] = [
  { name: "Leche vegetal", price: 10 },
  { name: "Pops", price: 15 },
  { name: "Jellys", price: 15 },
  { name: "Tapioca", price: 15 },
];

/**
 * Forma de preparacion. Es EXCLUSIVA de Bobas: el resto de la carta no se
 * sirve latte ni frape, asi que `config/site.ts` la deja vacia y solo este
 * menu la declara.
 *
 * Va en los cinco bloques, no solo en el primero: la pastilla la pinta el
 * titulo del menu, que lee el primer bloque, y si algun dia se reordenan los
 * bloques la preparacion desapareceria sin que nadie entendiera por que.
 */
const PREPARACION = "Latte o Frape";

// ---------------------------------------------------------------------------
// 1 · Sabores base
// ---------------------------------------------------------------------------

const bobasSabores: MenuScreen = {
  slug: "bobas",
  title: "Bobas",
  preparation: PREPARACION,
  section: "Sabores",
  layout: "trio",
  categories: [
    {
      id: "agua",
      name: "Agua",
      price: PRECIO_BASE,
      description: "Base de agua",
      accent: "menta",
      items: [
        "Cereza",
        "Fresa Sandía",
        "Kiwi",
        "Limonada Rosa",
        "Lychee",
        "Mandarina",
        "Mango Enchilado",
        "Melón Verde",
        "Naranja",
        "Pelón Pelonete",
        "Pepino con Limón",
        "Sandía",
        "Piña",
        "Uva",
      ],
    },
    {
      id: "agua-leche-yogurt",
      name: "Agua, Leche o Yogurt",
      price: PRECIO_BASE,
      description: "Tú eliges la base",
      accent: "rosa",
      items: [
        "Arándanos",
        "Coco",
        "Durazno",
        "Frambuesa",
        "Fresa",
        "Frutos Rojos",
        "Guanábana",
        "Guayaba",
        "Mamey",
        "Mango",
        "Manzana Verde",
        "Maracuyá",
        "Melón",
        "Mora Azul",
        "Piña Colada",
        "Ponche",
        "Tropical",
      ],
    },
    {
      id: "leche-yogurt",
      name: "Leche o Yogurt",
      price: PRECIO_BASE,
      description: "Cremosas",
      accent: "lavanda",
      items: [
        "Café",
        "Cajeta",
        "Capuccino",
        "Caramelo",
        "Chai",
        "Chocolate Blanco",
        "Fresas con Crema",
        "Galleta Oreo",
        "Horchata",
        "Matcha",
        "Mazapán",
        "Nuez",
        "Pay de Limón",
        "Pistache",
        "Pumpkin Spice",
        "Taro",
        "Vainilla",
        "Velvet Chocolate",
      ],
    },
  ],
  footnote: "Todas disponibles en 16 oz y 24 oz",
  extras: EXTRAS,
};

// ---------------------------------------------------------------------------
// 2 · Especiales y café
// ---------------------------------------------------------------------------

const bobasEspeciales: MenuScreen = {
  slug: "bobas-especiales",
  title: "Bobas",
  preparation: PREPARACION,
  section: "Especiales y Café",
  layout: "duo",
  categories: [
    {
      id: "leche-yogurt-especiales",
      name: "Leche o Yogurt",
      price: PRECIO_ESPECIAL,
      description: "Especiales",
      accent: "amarillo",
      items: [
        "Algodón de Azúcar",
        "Baileys",
        "Cheescake",
        "Chicle",
        "Chocolate Negro",
        "Chocomenta",
        "Chocoreta",
        "Ferrero",
        "Lotus",
        "Milk Tea",
        "Mocha",
        "Nutella",
        "Rompope",
        "Turín",
        { name: "Yakult", tag: "favorito" },
      ],
    },
    {
      id: "los-de-cafe",
      name: "Los de Café",
      price: PRECIO_ESPECIAL,
      accent: "morado",
      items: [
        { name: "Coffe Chainila", description: "Café · Chai · Vainilla" },
        { name: "Coffe Pumpkin", description: "Café · Pumpkin Spice" },
        {
          name: "Coffe Wonkas",
          description: "Café · Caramelo · Nieve de Vainilla · Hershey's",
        },
        {
          name: "French Coffe",
          description: "Café · Vainilla · Cajeta · Canela",
        },
        { name: "Pistachio Dream", description: "Café · Pistache" },
        { name: "Velvet Mocha", description: "Mocha · Velvet Chocolate" },
      ],
    },
  ],
  footnote: "Todas disponibles en 16 oz y 24 oz",
  extras: EXTRAS,
};

// ---------------------------------------------------------------------------
// 3 · Combinaciones de leche y yogurt
// ---------------------------------------------------------------------------

const bobasCombinacionesLeche: MenuScreen = {
  slug: "bobas-combinaciones-leche",
  title: "Bobas",
  preparation: PREPARACION,
  section: "Combinaciones · Leche y Yogurt",
  layout: "solo",
  categories: [
    {
      id: "combinaciones-leche-yogurt",
      name: "Leche o Yogurt",
      price: PRECIO_ESPECIAL,
      description: "Recetas de la casa",
      accent: "rosa",
      items: [
        { name: "Banana Beach", description: "Coco · Plátano" },
        {
          name: "Banana Split",
          description: "Plátano · Hershey's · Nieve de Vainilla",
        },
        {
          name: "Banani",
          description: "Plátano · Cacahuate · Nieve de Vainilla",
        },
        { name: "Bananutella", description: "Nutella · Plátano · Hershey's" },
        {
          name: "Carameli",
          description: "Cajeta · Caramelo · Nieve de Vainilla",
        },
        { name: "Caribean", description: "Mango · Coco · Jelly de Mango" },
        { name: "Chai Mood", description: "Chai · Mocha" },
        {
          name: "Chocochip",
          description: "Chips Ahoy · Cajeta · Nieve de Chocolate",
        },
        { name: "Coco Cocoa", description: "Chocolate · Coco" },
        {
          name: "Cocoa Bomb",
          description: "Brownie · Hershey's · Nieve de Vainilla",
        },
        {
          name: "Karyche",
          description: "Nutella · Nieve de Chocolate · Oreo triturado",
        },
        { name: "Mocha Nut", description: "Nuez · Mocha" },
        { name: "Monkey Choco", description: "Chocolate · Plátano" },
        {
          name: "Napolitan",
          description: "Fresa · Chocolate Blanco · Vainilla",
        },
        { name: "Nutty Brown", description: "Nuez · Chocolate" },
        { name: "Sugar Berry", description: "Fresa · Lechera" },
        { name: "Sugar Matcha", description: "Matcha · Lechera" },
        { name: "Tropical Banana", description: "Plátano · Coco" },
        {
          name: "Tropical Berry",
          description: "Fresa · Mora Azul · Plátano · Nieve de Vainilla",
        },
        {
          name: "Vanchuts",
          description: "Nutella · Cacahuate · Nieve de Vainilla",
        },
        {
          name: "Vanila",
          description: "Nutella · Nieve de Vainilla · Hershey's",
        },
        { name: "Vanilla Dream", description: "Plátano · Vainilla" },
      ],
    },
  ],
  footnote: "Todas disponibles en 16 oz y 24 oz",
  extras: EXTRAS,
};

// ---------------------------------------------------------------------------
// 4 · Combinaciones de agua
// ---------------------------------------------------------------------------

const bobasCombinacionesAgua: MenuScreen = {
  slug: "bobas-combinaciones-agua",
  title: "Bobas",
  preparation: PREPARACION,
  section: "Combinaciones · Agua",
  layout: "feature",
  categories: [
    {
      id: "combinaciones-agua",
      name: "Agua",
      price: PRECIO_ESPECIAL,
      description: "Frescas y cítricas",
      accent: "menta",
      items: [
        {
          name: "Bitter Boba",
          description: "Tamarindo · Mango · Limón · Chamoy",
        },
        { name: "Carnival", description: "Piña · Fresa · Coco" },
        { name: "Cherry Coco", description: "Coco · Cereza" },
        { name: "Citrix", description: "Kiwi · Mora Azul · Fresa" },
        { name: "Fresh Lemon", description: "Fresa · Pepino Limón" },
        { name: "Fresh Mango", description: "Mango · Pepino Limón" },
        { name: "Freslly", description: "Fresa · Jelly de Lychee" },
        {
          name: "Green Boba",
          description: "Kiwi · Pepino Limón · Jelly Manzana Verde",
        },
        { name: "Jelly Mango", description: "Mango · Jelly de Mango" },
        { name: "Mango Beach", description: "Mango · Piña · Chamoy" },
        { name: "Maui Mango", description: "Mango · Chamoy · Limón" },
        { name: "Paraíso", description: "Mango · Coco · Piña" },
        { name: "Passion Fruit", description: "Maracuyá · Jelly de Lychee" },
        { name: "Red Rush", description: "Fresa · Chamoy · Jelly de Fresa" },
        { name: "Sunset", description: "Fresa · Naranja · Cereza" },
        { name: "Yellow Rush", description: "Mango · Chamoy · Jelly de Mango" },
      ],
    },
    {
      id: "combinaciones-mixtas",
      name: "Leche, Agua o Yogurt",
      price: PRECIO_ESPECIAL,
      description: "Tú eliges la base",
      accent: "lavanda",
      items: [
        { name: "Berry Bloom", description: "Arándano · Lychee" },
        { name: "Green Splash", description: "Kiwi · Manzana Verde" },
        { name: "Island Breeze", description: "Piña · Coco" },
        { name: "Kiwi Berry", description: "Fresa · Kiwi" },
        { name: "Peach Kiss", description: "Durazno · Lychee" },
        { name: "Pink Lychee", description: "Lychee · Frambuesa" },
        { name: "Pink Wave", description: "Frambuesa · Coco" },
        {
          name: "Purple Sunset",
          description: "Arándano · Fruta de la Pasión",
        },
        {
          name: "Tropical Twist",
          description: "Manzana Verde · Fruta de la Pasión",
        },
      ],
    },
  ],
  footnote: "Todas disponibles en 16 oz y 24 oz",
  extras: EXTRAS,
};

// ---------------------------------------------------------------------------
// 5 · Monster y yogurt
// ---------------------------------------------------------------------------

const bobasMonster: MenuScreen = {
  slug: "bobas-monster",
  title: "Bobas",
  preparation: PREPARACION,
  section: "Monster",
  layout: "feature",
  categories: [
    {
      id: "los-de-monster",
      name: "Monster",
      price: PRECIO_ESPECIAL,
      description: "Con energizante",
      accent: "amarillo",
      items: [
        { name: "Boba Mix", description: "Piña · Mora Azul · Limón" },
        { name: "Boba Power", description: "Naranja · Mango" },
        { name: "Boba Punch", description: "Piña · Mora Azul · Kiwi" },
        { name: "Caipirina", description: "Fresa · Piña · Kiwi" },
        { name: "Crazy Boba", description: "Mango · Naranja · Limón" },
        { name: "Frankenstein", description: "Piña · Lychee · Kiwi" },
        { name: "Golden Green", description: "Mango · Manzana Verde" },
        { name: "Jungle Fury", description: "Limón · Mango · Piña" },
        {
          name: "Lunatic",
          description: "Kiwi · Pepino Limón · Jelly Manzana Verde",
        },
        { name: "Red Boba", description: "Fresa · Mora Azul · Frambuesa" },
        {
          name: "Red Dragon",
          description: "Fresa · Lychee · Chamoy · Tabasco",
        },
        { name: "Super Mango", description: "Mango · Jelly de Lychee" },
        { name: "Tropical Monster", description: "Fresa · Mango · Kiwi" },
      ],
    },
    {
      id: "los-de-yogurt",
      name: "Los de Yogurt",
      price: PRECIO_ESPECIAL,
      accent: "rosa",
      items: [
        { name: "Cream Berry", description: "Plátano · Fresa · Mora Azul" },
        { name: "Green Tai", description: "Taro · Chai" },
        { name: "Mantcha", description: "Matcha · Mango" },
        { name: "Oreo Twist", description: "Oreo · Vainilla" },
        { name: "Strawberry Chai", description: "Chai · Vainilla · Fresa" },
        { name: "Taro Dream", description: "Taro · Cheescake" },
      ],
    },
  ],
  footnote: "Todas disponibles en 16 oz y 24 oz",
  extras: EXTRAS,
};

/** Grupo completo de Bobas: cinco pantallas en orden de reproduccion. */
export const bobas: MenuGroup = {
  slug: "bobas",
  label: "Bobas",
  screens: [
    bobasSabores,
    bobasEspeciales,
    bobasCombinacionesLeche,
    bobasCombinacionesAgua,
    bobasMonster,
  ],
};
