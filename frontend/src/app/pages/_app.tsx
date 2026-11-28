import "@fontsource/reggae-one"; // default weight 400
import { useEffect } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { useRouter } from "next/navigation";
import type { AppProps } from "next/app";

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    let lastBackPress = 0;
    const listener: any = CapacitorApp.addListener("backButton", (event: any) => {
      event?.preventDefault?.();

      if (window.history.length > 1) {
        router.back();
      } else {
        const now = new Date().getTime();
        if (now - lastBackPress < 2000) {
          CapacitorApp.exitApp();
        } else {
          lastBackPress = now;
          alert("Press back again to exit");
        }
      }
    });

    return () => {
      // @ts-ignore: Capacitor listener has remove() at runtime
      listener.remove();
    };
  }, [router]);

  return <Component {...pageProps} />;
}
