import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/lib/authContext";
import { ToastProvider } from "@/components/common/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kanban Finance System",
  description: "Manage your wealth, one card at a time",
  icons: {
    icon: [{ url: "/icon-512.png", sizes: "512x512", type: "image/png" }],
    apple: [{ url: "/icon-512.png", sizes: "512x512", type: "image/png" }],
  },
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
