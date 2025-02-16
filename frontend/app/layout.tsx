import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Sona - Medical Assistant",
    description: "Your personal AI medical assistant",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="bg-gray-50">{children}</body>
        </html>
    );
}
