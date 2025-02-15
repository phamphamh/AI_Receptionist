import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Medical Chat Bot",
    description: "A medical appointment chat bot interface",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
