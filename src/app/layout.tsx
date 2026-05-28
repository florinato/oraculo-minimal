import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PI ARCANA TAROT",
  description: "Consulta tu destino",
  icons: {
    icon: "/ARC_icono.png",
  },
  openGraph: {
    title: "PI ARCANA TAROT",
    description: "Consulta tu destino",
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
