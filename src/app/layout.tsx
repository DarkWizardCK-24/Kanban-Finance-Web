import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/lib/authContext";
import { ToastProvider } from "@/components/common/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kanban Finance System",
  description: "Manage your wealth, one card at a time",
  icons: { icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ctext y='52' font-size='52'%3E%F0%9F%8F%A6%3C/text%3E%3C/svg%3E" },
};

export const viewport: Viewport = {
  themeColor: "#090E1A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-dark-bg text-text-primary antialiased">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
