import type { MenuGroup } from "./types";

/** SODAS ITALIANAS — datos oficiales de GALU. Todos los sabores al mismo precio. */
export const sodasItalianas: MenuGroup = {
  slug: "sodas-italianas",
  label: "Sodas Italianas",
  screens: [
    {
      slug: "sodas-italianas",
      title: "Sodas Italianas",
      section: "Todos los Sabores",
      layout: "solo",
      categories: [
        {
          id: "sabores",
          name: "Sabores",
          price: [
            { label: "16 oz", value: 65 },
            { label: "24 oz", value: 75 },
          ],
          accent: "lavanda",
          // Dos columnas en vez de tres: con 17 sabores la tarjeta queda mas
          // alta y llena mejor la pantalla, sin dejar un hueco arriba.
          columns: 2,
          items: [
            "Lavanda",
            "Taro",
            "Chicle",
            "Pepino",
            "Fresa",
            "Grosella",
            "Frambuesa",
            "Piña Colada",
            "Mora Azul",
            "Kiwi",
            "Manzana Verde",
            "Mango",
            "Frutos Rojos",
            "Maracuyá",
            "Cereza",
            { name: "Dragon Fruit", tag: "nuevo" },
            "Durazno",
          ],
        },
      ],
      footnote: "Todas disponibles en 16 oz y 24 oz",
      extras: [
        { name: "Pops", price: 15 },
        { name: "Jellys", price: 15 },
        { name: "Tapioca", price: 15 },
      ],
    },
  ],
};
