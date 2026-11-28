import { POSTER_IMAGE_BASE_URL, DEFAULT_COMPANY_LOGO_PATH, DEFAULT_KRISHTECH_LOGO } from "@constants/api";

export const getLogoUrl = (logoPath: string | undefined): string => {
    if (!logoPath) return DEFAULT_KRISHTECH_LOGO;
    if (logoPath.startsWith("http://") || logoPath.startsWith("https://") || logoPath.startsWith("data:") || logoPath.startsWith("blob:")) {
        return logoPath;
    }
    if (logoPath.startsWith("/uploads/") || logoPath.startsWith("uploads/")) {
        const cleaned = logoPath.replace(/\\/g, "/").replace(/^\/+/, "");
        return `${POSTER_IMAGE_BASE_URL}${cleaned}`;
    }
    // Extract just the filename — the DB may store a full server filesystem path
    const filename = logoPath.replace(/\\/g, "/").split("/").pop();
    if (!filename) return DEFAULT_KRISHTECH_LOGO;
    return `${POSTER_IMAGE_BASE_URL}${DEFAULT_COMPANY_LOGO_PATH}${filename}`;
};
