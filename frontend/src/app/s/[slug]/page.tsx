import { redirect, notFound } from "next/navigation";
import { API_ENDPOINTS } from "@constants/api";

interface ShortUrlPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ShortUrlRedirectPage({ params }: ShortUrlPageProps) {
  const { slug } = await params;
  if (!slug) notFound();

  let targetToken: string | null = null;
  try {
    const res = await fetch(API_ENDPOINTS.SHARABLE_LINKS.BY_SLUG(slug.toLowerCase()), {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.token) {
        targetToken = data.token;
      }
    }
  } catch (err: any) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
  }

  if (targetToken) {
    redirect(`/pages/view?token=${encodeURIComponent(targetToken)}`);
  }

  redirect(`/pages/view?error=not_found&slug=${encodeURIComponent(slug)}`);
}

