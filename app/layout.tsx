import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Churches Planner",
  description: "ERP web para la administracion integral de iglesias.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
