import type { Metadata } from "next";
import { API_ENDPOINTS, FRONT_END_URL, getPosterImageSrc, viewUrl } from "@constants/api";
import ViewClient from "./ViewClient";

type SearchParams = { [key: string]: string | string[] | undefined };

interface PageProps {
  searchParams: Promise<SearchParams>;
}

const DEFAULT_OG_IMAGE = `${FRONT_END_URL}/reNote logo.png`;

async function fetchSharedPosters(token: string) {
  try {
    const res = await fetch(API_ENDPOINTS.SHARABLE_LINKS.GET_SHARED(token), {
      // Always fetch fresh so the OG image reflects the latest company logo
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const tokenRaw = params?.token;
  const token = Array.isArray(tokenRaw) ? tokenRaw[0] : tokenRaw;

  let title = "reNote";
  let description = "Explore an expansive Poster & Template Marketplace, create professional estimations, and manage instant client invoicing all in one unified platform.";
  let image = DEFAULT_OG_IMAGE;
  let url = FRONT_END_URL;

  if (token) {
    url = viewUrl(token);
    const data = await fetchSharedPosters(token);
    const posters = data?.posters as Array<{
      poster_title?: string;
      product_name?: string;
      companyName?: string;
      company_logo?: string;
      product_image?: string;
    }> | undefined;

    if (posters && posters.length > 0) {
      const first = posters[0];
      if (first.companyName) {
        title = first.companyName;
      } else if (first.poster_title) {
        title = first.poster_title;
      }
      if (first.product_name) {
        description = first.product_name;
      }
      if (first.company_logo) {
        image = getPosterImageSrc(first.company_logo);
      } else if (first.product_image) {
        image = getPosterImageSrc(first.product_image);
      } else {
        image = getPosterImageSrc("/uploads/companies/default-company/logo-1779622107439-878996187.webp");
      }
    }
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "reNote",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default function Page() {
  return <ViewClient />;
}
