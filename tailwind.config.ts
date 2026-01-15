import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dkv: {
          // Colores Principales (Manual Vol 1, pág 26-27)
          green: "#849700", // Verde Claro Digital (Uso principal: Fondos, CTAs)
          "green-hover": "#43752B", // Verde Hover (Vol 1, pág 32)
          "green-dark": "#033837", // Verde Oscuro Digital (Textos sobre verde claro/blanco)
          
          // Colores Secundarios y Texto
          gray: "#6A625A", // Gris Corporativo (Cuerpos de texto, iconos)
          "gray-light": "#F7F7F7", // Gris Fondo Claro (Vol 1, pág 31)
          "gray-border": "#F0EFED", // Gris Claro (Separadores)
          "gray-disabled": "#A6A190", // Gris Deshabilitado (Vol 1, pág 32)
          
          // Colores de Acción / "Contract"
          red: "#ED0039", // Rojo Botón (Contratación/Alertas - Vol 1, pág 32)
          "red-hover": "#892737", // Rojo Destacado (Hover del botón rojo)
          white: "#FFFFFF",
        },
      },
      fontFamily: {
        // Tipografías Corporativas (Vol 1, pág 36-38)
        lemon: ["Lemon Milk Pro", "sans-serif"], // Titulares
        fsme: ["FS Me", "Arial", "sans-serif"], // Cuerpo de texto (Accesibilidad)
      },
      boxShadow: {
        // Sombra corporativa suave para tarjetas y botones flotantes
        'dkv-card': '0 4px 12px rgba(106, 98, 90, 0.15)', 
      },
      borderRadius: {
        'dkv': '4px', // Radio de borde estándar para botones (simulado de imágenes)
      },
    },
  },
  plugins: [],
};
export default config;