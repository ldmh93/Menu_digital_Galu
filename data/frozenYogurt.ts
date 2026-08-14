import type { MenuGroup } from "./types";

/**
 * FROZEN YOGURT (HELADO DE YOGURT) — datos oficiales de GALU.
 *
 * A diferencia del resto de menus, aqui no se cobra por sabor sino por tamano:
 * cada renglon lleva su propio precio (`MenuItem.price`) y la tarjeta no tiene
 * precio de categoria. Se fuerza una sola columna (`columns: 1`) porque una
 * lista de tarifas se lee mucho mejor en columna que repartida.
 */
export const frozenYogurt: MenuGroup = {
  slug: "frozen-yogurt",
  label: "Frozen Yogurt",
  screens: [
    {
      slug: "frozen-yogurt",
      title: "Frozen Yogurt",
      section: "Tamaños y Toppings",
      layout: "solo",
      categories: [
        {
          id: "tamanos",
          name: "Tamaños",
          description: "Toppings incluidos en cada tamaño",
          accent: "menta",
          columns: 1,
          items: [
            {
              name: "Cono",
              description: "1 topping · no incluye fruta",
              price: 35,
            },
            {
              name: "Mini",
              description: "2 toppings · no incluye fruta",
              price: 40,
            },
            {
              name: "Chico",
              description: "3 toppings · máx. 2 frutas",
              price: 55,
            },
            {
              name: "Mediano",
              description: "3 toppings · máx. 2 frutas",
              price: 65,
            },
            {
              name: "Grande",
              description: "4 toppings · máx. 3 frutas",
              price: 75,
            },
            {
              name: "Medio Litro",
              description: "4 toppings · máx. 3 frutas",
              price: 140,
            },
            {
              name: "Litro",
              description: "4 toppings · máx. 3 frutas",
              price: 260,
            },
          ],
        },
      ],
      extras: [
        { name: "Topping", price: 10 },
        { name: "Fruta", price: 12 },
        { name: "Topping premium", price: 15 },
      ],
    },
  ],
};
