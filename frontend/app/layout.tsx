import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hasamex AI Case Study",
  description: "Hasamex AI Engineer technical case study"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
