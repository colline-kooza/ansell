import type { Metadata } from "next";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider } from "@/context/auth-context";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Anasell — South Sudan Digital Marketplace Hub",
    template: "%s | Anasell",
  },
  description:
    "Browse property listings, job openings, government tenders, training courses, verified companies, and the latest business news — all built for South Sudan.",
  keywords: [
    "South Sudan",
    "marketplace",
    "real estate",
    "jobs",
    "tenders",
    "Juba",
    "Anasell",
  ],
  metadataBase: new URL("https://ansell.collinzdev.com"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <AuthProvider>
          <QueryProvider>{children}</QueryProvider>
          <Toaster position="top-center" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
