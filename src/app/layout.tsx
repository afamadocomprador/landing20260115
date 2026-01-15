import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DKV Dentisalud | Seguro Dental Sin Esperas y Niños Gratis",
  description: "Contrata tu seguro dental DKV desde 9,90€/mes. Uso inmediato para urgencias, limpiezas gratis y hasta 40% de ahorro en tratamientos. ¡Calcula tu precio ahora!",
  keywords: ["seguro dental", "dentista urgencia", "implantes baratos", "ortodoncia invisible precio", "dkv dentisalud"],
  openGraph: {
    title: "¿Te duele hoy? Ve al dentista hoy con DKV.",
    description: "Accede a más de 1.400 clínicas. Niños gratis en pack familiar. Precios claros, sin sorpresas.",
    images: ["/og-image-dkv-dentisalud.jpg"], // Imagen ficticia
    type: "website",
    locale: "es_ES",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Schema.org para FAQ y Producto (SEO Semántico)
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "name": "DKV Dentisalud Élite",
        "description": "Seguro dental completo con acceso a red nacional y descuentos en tratamientos.",
        "brand": { "@type": "Brand", "name": "DKV Seguros" },
        "offers": {
          "@type": "Offer",
          "price": "14.50",
          "priceCurrency": "EUR",
          "availability": "https://schema.org/InStock"
        }
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "¿El seguro dental tiene carencias?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "La mayoría de servicios son de acceso inmediato (urgencias, limpiezas, extracciones simples, radiografías). Solo tratamientos complejos como grandes cirugías o endodoncias tienen carencia reducida."
            }
          },
          {
            "@type": "Question",
            "name": "¿Los niños pagan seguro dental?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "No. Con DKV Dentisalud, si aseguras a un adulto, los menores de 14 años se incluyen GRATIS en la póliza."
            }
          }
        ]
      }
    ]
  };

  return (
    <html lang="es" className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}