import type { Metadata } from "next";
import PiSDKProvider from "../components/PiSDKProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "ARCANA TAROT",
  description: "Consulta tu destino",
  icons: {
    icon: "/ARC_icono.png",
  },
  openGraph: {
    title: "ARCANA TAROT",
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
        <PiSDKProvider>
          {children}
        </PiSDKProvider>
      </body>
    </html>
  );
}
