import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils'; // Asumiendo utilidad clsx/tailwind-merge

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-dkv font-fsme font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      variant: {
        // Botón Principal: Verde DKV (Vol 2, pág 179)
        primary: "bg-dkv-green text-white hover:bg-dkv-green-hover focus:ring-dkv-green disabled:bg-dkv-gray-disabled",
        
        // Botón Secundario: Outline Gris (Vol 2, pág 179)
        secondary: "bg-transparent border-2 border-dkv-gray text-dkv-gray hover:bg-dkv-gray hover:text-white focus:ring-dkv-gray",
        
        // Botón Contratación: Rojo (Vol 1, pág 32 & Vol 2, pág 124)
        contract: "bg-dkv-red text-white hover:bg-dkv-red-hover focus:ring-dkv-red shadow-dkv-card",
        
        // Outline Blanco (para usar sobre fondos oscuros/verdes)
        outlineWhite: "bg-transparent border-2 border-white text-white hover:bg-white hover:text-dkv-green-dark",
      },
      size: {
        default: "h-12 px-8 text-base",
        sm: "h-10 px-6 text-sm",
        lg: "h-14 px-10 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };