import type { MenuGroup } from "./types";

/**
 * BLIZZ — datos oficiales de GALU.
 * Nota: en la lista original "Fresa Kiwi" aparecia dos veces (una como
 * "Fresa-Kiwi"); se dejo una sola entrada.
 */
export const blizz: MenuGroup = {
  slug: "blizz",
  label: "Blizz",
  screens: [
    {
      slug: "blizz",
      title: "Blizz",
      section: "Clásicos, Especiales y Premium",
      layout: "trio",
      categories: [
        {
          id: "clasico",
          name: "Clásico",
          price: 55,
          accent: "rosa",
          items: [
            "Canelitas",
            "Coco",
            "Durazno",
            "Fresa Kiwi",
            "Fresa Plátano",
            "Fresas con Crema",
            "Frutos Rojos",
            "Kiwi",
            "Krankis",
            "Mango con Coco",
            "Mazapán",
            "Mora Azul",
            "Mora Fresa",
            "Oreo",
          ],
        },
        {
          id: "especial",
          name: "Especial",
          price: 65,
          accent: "lavanda",
          items: [
            "Bubulubu",
            "Ferrero",
            "Gansito",
            "Hershey's",
            "Kinder Bueno",
            "Kinder Delice",
            "Kisses",
            "Kit Kat",
            "M&M's",
            "Nutella",
            "Pingüino",
            "Red Velvet",
          ],
        },
        {
          id: "premium",
          name: "Premium",
          price: 75,
          accent: "menta",
          items: [
            "Baileys",
            { name: "Chocolate Dubái", tag: "nuevo" },
            "Huevo Kinder",
            "Lotus",
            // Guion no separable: evita que se parta en "Nutella B-" / "Ready".
            "Nutella B‑Ready",
            "Pistache",
          ],
        },
      ],
    },
  ],
};
