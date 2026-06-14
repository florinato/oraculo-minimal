import type { Metadata } from "next";
import "./globals.css";
import PiNetworkProvider from "@/components/PiNetworkProvider";

export const metadata: Metadata = {
  title: "PI ARCANA TAROT",
  description: "Consulta tu destino",
  icons: {
    icon: "/ARC_icono.png",
  },
  openGraph: {
    title: "PI ARCANA TAROT",
    description: "Consulta tu destino",
    images: [
      {
        url: "/ARC_icono.png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <PiNetworkProvider>{children}</PiNetworkProvider>
      </body>
    </html>
  );
}
