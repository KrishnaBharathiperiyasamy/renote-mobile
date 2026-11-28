import { redirect } from "next/navigation";
import { Metadata } from "next";

function getBestImageForOG(poster: any) {
  const images = [
    poster.product_image,
    ...(Array.isArray(poster.product_gallery_images) ? poster.product_gallery_images : []),
    poster.poster_image,
    poster.thumbnailUrl,
    poster.imageUrl,
    poster.company_id?.logo,
    poster.company_logo,
  ].filter(Boolean);

  const isVideo = (url: string) => /\.(mp4|webm|mov|avi|m4v)$/i.test(url);
  const photo = images.find((url) => !isVideo(url));
  return photo || images[0] || "/logo.png";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const backendUrl = process.env.DATA_API_BASE_URL || "http://127.0.0.1:6003";

  try {
    const res = await fetch(`${backendUrl}/api/marketplace/item/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return { title: "Marketplace Listing - reNote" };
    }

    const data = await res.json();
    const poster = data.poster || data.item || data;

    if (!poster || (!poster._id && !poster.posterId)) {
      return { title: "Marketplace Listing - reNote" };
    }

    const companyName =
      poster.company_id?.name || poster.company_name || "reNote Vendor";
    const city = poster.marketplaceCity || poster.company_id?.city;
    const productName =
      poster.product_name ||
      poster.poster_name ||
      poster.poster_title ||
      "Marketplace Item";

    const price = poster.marketplacePrice ?? poster.product_price;
    const priceString = price ? ` • ₹${Number(price).toLocaleString("en-IN")}` : "";
    const title = `${productName}${priceString}`;

    const rawDesc = poster.product_description
      ? poster.product_description.replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim().slice(0, 160)
      : `Check out "${productName}" by ${companyName} on reNote Marketplace!`;

    const description = `${companyName}${city ? ` (${city})` : ""} • ${rawDesc}`;

    const rawLogo =
      poster.company_id?.logo || poster.company_logo || "/uploads/companies/default-company/logo-1779622107439-878996187.webp";
    const logoUrl = rawLogo.startsWith("http")
      ? rawLogo
      : `https://renote.co.in${rawLogo.startsWith("/") ? "" : "/"}${rawLogo}`;

    const chosenImg = getBestImageForOG(poster);
    const imageUrl = chosenImg.startsWith("http")
      ? chosenImg
      : `https://renote.co.in${chosenImg.startsWith("/") ? "" : "/"}${chosenImg}`;

    return {
      title: `${title} | ${companyName}`,
      description,
      icons: {
        icon: logoUrl,
        shortcut: logoUrl,
        apple: logoUrl,
      },
      openGraph: {
        title,
        description,
        siteName: "reNote Marketplace",
        images: [{ url: imageUrl, width: 1200, height: 630 }],
        url: `https://renote.co.in/preview/poster/${id}`,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [imageUrl],
      },
    };
  } catch (err) {
    console.error("Error generating poster metadata:", err);
    return { title: "reNote Marketplace" };
  }
}

export default async function PosterPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/pages/marketplace?posterId=${id}`);
}
