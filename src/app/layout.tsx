import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Order & Rate Constant Finder",
  description: "Fit t vs C kinetics data to zero, first, second, and third order rate laws.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
