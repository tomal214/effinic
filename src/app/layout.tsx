import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import PwaBootSplash from "@/components/app/PwaBootSplash";
import "./globals.css";

export const metadata: Metadata = {
  title: "Effinic",
  description: "Dental clinic workflow app",
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0d9488",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} h-full antialiased`}>
      <body className={`${GeistSans.className} min-h-full flex flex-col`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `document.querySelectorAll('body link[rel="manifest"]').forEach(function(el){document.head.appendChild(el);});`,
          }}
        />
        <div
          id="effinic-boot"
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-[oklch(0.975_0.010_82)] px-6 transition-opacity duration-300"
          aria-hidden="true"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="flex size-16 items-center justify-center overflow-hidden rounded-2xl border border-[oklch(0.850_0.012_82)] bg-[oklch(0.990_0.004_82)] shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/icon-192.png"
                alt=""
                width={64}
                height={64}
                className="size-full object-cover"
              />
            </div>
            <p className="text-xl font-semibold tracking-tight text-[oklch(0.190_0.010_145)]">
              Effinic
            </p>
          </div>
          <div className="w-full max-w-[12rem] space-y-2">
            <div className="h-1 overflow-hidden rounded-full bg-[oklch(0.947_0.012_82)]">
              <div className="boot-progress-bar h-full w-2/5 rounded-full bg-[oklch(0.58_0.14_175)]" />
            </div>
            <p className="text-center text-sm text-[oklch(0.500_0.014_145)]">
              Loading…
            </p>
          </div>
        </div>
        <PwaBootSplash />
        {children}
      </body>
    </html>
  );
}
