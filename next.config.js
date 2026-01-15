/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Configuración de imágenes
  images: {
    remotePatterns: [
      {
        // Permitir carga de imágenes desde Supabase Storage (si subes fotos reales)
        protocol: 'https',
        hostname: '**.supabase.co', 
      },
      {
        // Útil para usar placeholders durante el desarrollo
        protocol: 'https',
        hostname: 'placehold.co',
      }
    ],
    // Mejora la seguridad evitando SVG maliciosos si permites subida de usuarios
    dangerouslyAllowSVG: false, 
  },

  // (Opcional) Si Leaflet te diera problemas de compilación en Vercel,
  // descomenta la siguiente línea para forzar la transpilación:
  // transpilePackages: ['react-leaflet', 'leaflet'], 
};

module.exports = nextConfig;