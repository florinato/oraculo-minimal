import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tarot de PI",
  description: "Consulta tu destino",
  openGraph: {
    title: "Tarot de PI",
    description: "Consulta tu destino",
    siteName: "Tarot de PI",
    images: [
      {
        url: "https://oraculo-minimal.vercel.app/ARC_icono.png",
        width: 1200,
        height: 630,
        alt: "Tarot de PI",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
