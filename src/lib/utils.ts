import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases condicionales (clsx) y resuelve conflictos de Tailwind (tailwind-merge).
 * Ejemplo: cn("px-2 py-1 bg-red-500", className) -> si className tiene "bg-blue-500", gana el blue.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formateador de moneda para precios (Euro español)
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

/**
 * Retardo simulado para efectos de carga (útil para demos)
 */
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));