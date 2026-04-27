import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Oráculo Celta",
  description: "Consulta tu destino",
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