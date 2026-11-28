import { redirect } from "next/navigation";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const backendUrl = process.env.DATA_API_BASE_URL || "http://127.0.0.1:6003";

  try {
    const res = await fetch(`${backendUrl}/api/shared/${token}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return { title: "Shared Poster - reNote" };
    }

    const data = await res.json();
    const link = data.link || data;
    const poster = Array.isArray(link?.posterIds) ? link.posterIds[0] : null;

    const companyName = link?.company_name || poster?.company_id?.name || "reNote Vendor";
    const title = poster?.product_name || poster?.poster_name || link?.name || "Shared Poster";
    const description = `${title} shared by ${companyName}`;

    const rawLogo = link?.company_logo || poster?.company_id?.logo || "/uploads/companies/default-company/logo-1779622107439-878996187.webp";
    const logoUrl = rawLogo.startsWith("http")
      ? rawLogo
      : `https://renote.co.in${rawLogo.startsWith("/") ? "" : "/"}${rawLogo}`;

    const rawImg = poster?.product_image || "/logo.png";
    const imageUrl = rawImg.startsWith("http")
      ? rawImg
      : `https://renote.co.in${rawImg.startsWith("/") ? "" : "/"}${rawImg}`;

    return {
      title: `${companyName} | ${title}`,
      description,
      icons: {
        icon: logoUrl,
        shortcut: logoUrl,
        apple: logoUrl,
      },
      openGraph: {
        title: `${title} - ${companyName}`,
        description,
        siteName: companyName,
        images: [{ url: imageUrl }],
        url: `https://renote.co.in/preview/${token}`,
        type: "website",
      },
    };
  } catch {
    return { title: "Shared Poster - reNote" };
  }
}

export default async function TokenPreviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  redirect(`/pages/view?token=${token}`);
}
