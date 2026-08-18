import type { MenuGroup, MenuScreen } from "./types";

/**
 * ICE ROLLERS — datos oficiales tomados de la lista de precios de GALU.
 * Nota: se elimino el duplicado de "Pina Colada" y se corrigio "Kinder Chocolate".
 */
const iceRollersPantalla: MenuScreen = {
  slug: "ice-rollers",
  title: "Ice Rollers",
  section: "Helado Enrollado",
  layout: "feature",
  categories: [
    {
      id: "clasicos",
      name: "Clásicos",
      price: 60,
      description: "Sabores de siempre",
      accent: "rosa",
      items: [
        "Arándanos",
        "Café",
        "Cajeta",
        "Cereza",
        "Coco",
        "Durazno",
        "Fresa",
        "Frutos Rojos",
        "Guanábana",
        "Guayaba",
        "Kiwi",
        "Mandarina",
        "Mango",
        "Manzana Verde",
        "Mazapán",
        "Mora Azul",
        "Nuez",
        "Oreo",
        "Piña Colada",
        "Sandía",
        "Vainilla",
      ],
    },
    {
      id: "especiales",
      name: "Especiales",
      price: 70,
      description: "Con tu dulce favorito",
      accent: "lavanda",
      items: [
        "Canelitas",
        "Duvalín",
        "Ferrero",
        "Gansito",
        "Hershey's",
        "Kinder Chocolate",
        "Kinder Delice",
        "M&M's",
        "Nutella",
        "Pingüinos",
        "Rompope",
      ],
    },
    {
      id: "premium",
      name: "Premium",
      price: 80,
      description: "Lo más consentido",
      accent: "menta",
      items: [
        "Baileys",
        { name: "Chocolate Dubái", tag: "nuevo" },
        "Conejito Turín",
        "Kinder Bueno",
        "Lotus",
        "Nutella B‑Ready",
        { name: "Yakult", tag: "favorito" },
      ],
    },
  ],
  footnote: "Todos incluyen 2 toppings a elegir",
};

export const iceRollers: MenuGroup = {
  slug: "ice-rollers",
  label: "Ice Rollers",
  screens: [iceRollersPantalla],
};
