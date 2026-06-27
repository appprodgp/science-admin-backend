import type { Metadata } from "next";

import "./globals.css";

import { AdminShell } from "@/components/AdminShell";

export const metadata: Metadata = {
    title: "Science Admin Dashboard",
    description: "Local admin dashboard for the science article pipeline",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en">
            <body>
                <AdminShell>{children}</AdminShell>
            </body>
        </html>
    );
}