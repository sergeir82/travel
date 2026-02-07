import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI‑Гид СПб и Ленобласти (demo)",
  description:
    "Демо туристического портала: персональные маршруты по Санкт‑Петербургу и Ленобласти с помощью Gemini.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}
