import { API_ENDPOINTS } from "./api";

export const GST_OPTIONS_DEFAULT = [0, 5, 18, 40];

let cachedGstOptions: number[] | null = null;

export async function fetchGstOptions(): Promise<number[]> {
  if (cachedGstOptions) return cachedGstOptions;
  try {
    const res = await fetch(API_ENDPOINTS.SETTINGS.GST_OPTIONS);
    const data = await res.json();
    cachedGstOptions = data.gstOptions || GST_OPTIONS_DEFAULT;
    return cachedGstOptions!;
  } catch {
    return GST_OPTIONS_DEFAULT;
  }
}
