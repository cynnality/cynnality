/* ================================
   PUSHING APPLES - MENU / DEFINITIONS

   This file defines the things that exist in the game:
   products, machines, prices, and values.

   No movement logic.
   No rendering logic.
   No click events.
================================ */

const PRODUCTS = {
  apple: {
    id: "apple",
    label: "Apple",
    value: 1,
    emoji: "🍎"
  },

  appleJuice: {
    id: "appleJuice",
    label: "Apple Juice",
    value: 2,
    emoji: "🧃"
  }
};

const MACHINES = {
  appleJuiceFactory: {
    id: "appleJuiceFactory",
    label: "Apple Juice Factory",
    price: 10,
    input: "apple",
    output: "appleJuice"
  }
};