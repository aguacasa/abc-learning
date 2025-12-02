import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ABC Fun Cards - Learn Letters with Fun!",
  description: "An interactive flashcard app to help toddlers learn the alphabet",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
