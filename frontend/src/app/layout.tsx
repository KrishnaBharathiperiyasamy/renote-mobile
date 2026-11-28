import type { Metadata, Viewport } from "next";
import "./globals.css";
import "@utilis/apiClient";
import UserProviderWrapper from "@components/UserWrapper/page";
import "react-toastify/dist/ReactToastify.css";
import { FRONT_END_URL } from "@constants/api";

export const metadata: Metadata = {
  metadataBase: new URL(FRONT_END_URL),

  title: "reNote | Creative Poster Marketplace & Smart Business Suite",
  description: "Explore an expansive Poster & Template Marketplace, create professional estimations, and manage instant client invoicing all in one unified platform.",

  openGraph: {
    title: "reNote — Creative Poster Marketplace & Smart Business Suite",
    description: "Explore an expansive Poster & Template Marketplace, create professional estimations, and manage instant client invoicing all in one unified platform.",
    url: FRONT_END_URL,
    siteName: "reNote",
    images: [
      {
        url: "/reNote logo.png",      // ← now relative paths work correctly
        width: 1200,
        height: 630,
        alt: "reNote Marketplace Preview",
      },
    ],
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "reNote — Creative Poster Marketplace & Smart Business Suite",
    description: "Explore an expansive Poster & Template Marketplace, create professional estimations, and manage instant client invoicing all in one unified platform.",
    images: ["/reNote logo.png"],
  },

  icons: {
    icon: "/reNote logo.png",
    shortcut: "/reNote logo.png",
    apple: "/reNote logo.png",
  },
};

// ✅ Disable browser pinch-zoom & control theme color
export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Dynamic Theme & System Sync */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem("spa_theme")||localStorage.getItem("poster_theme");var d=s?s==="dark":false;if(d){document.documentElement.classList.add("dark");document.documentElement.classList.remove("light");document.documentElement.style.colorScheme="dark";}else{document.documentElement.classList.remove("dark");document.documentElement.classList.add("light");document.documentElement.style.colorScheme="light";}}catch(e){}})();`,
          }}
        />

        {/* Disable system-level zoom gestures */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />

        {/* ✅ Replace Next.js logo with reNote logo */}
        <link rel="icon" href="/reNote logo.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/reNote logo.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/reNote logo.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/reNote logo.png" />
      </head>

      <body className="antialiased">
        <UserProviderWrapper>{children}</UserProviderWrapper>
      </body>
    </html>
  );
}

