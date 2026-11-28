import axios from "axios";
import { getImageFromIndexedDB, blobUrlToBase64 } from "@utilis/indexDB";
import { safeToastError, safeToastSuccess } from "./toastHelper";
import { API_ENDPOINTS } from "@constants/api";

interface Poster {
  _id?: string;
  poster_name: string;
  poster_title: string;
  product_name: string;
  product_description: string;
  product_price: string | number;
  product_image_id?: string;
  company_logo_id?: string;
  logo_zoom?: number;
  product_zoom?: number;
  [key: string]: any;
}

export const syncLocalDataToBackend = async (userId: string, token: string) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  let syncedSomething = false;

  try {
    const localQuotations = JSON.parse(localStorage.getItem("local_quotations") || "[]");
    const localInvoices = JSON.parse(localStorage.getItem("guestInvoices") || "[]");
    const vendorCompanies = JSON.parse(localStorage.getItem("vendor_companies") || "[]");
    const customerCompanies = JSON.parse(localStorage.getItem("customer_companies") || "[]");
    const localPosters: Poster[] = JSON.parse(
      localStorage.getItem("guest_posters") || "[]"
    );


    // Sync quotations
    if (localQuotations.length) {
      const { data } = await axios.post(
        API_ENDPOINTS.SYNC.SYNC_BACKEND(userId),
        { localQuotations },
        config
      );
      localStorage.removeItem("local_quotations");
      localStorage.removeItem("vendor_companies");
      localStorage.removeItem("customer_companies");
      syncedSomething = true;
    }

    // Sync invoices
    if (localInvoices.length) {
      try {
        const { data } = await axios.post(
          API_ENDPOINTS.SYNC.SYNC_INVOICE(userId),
          { localInvoices },
          config
        );
        localStorage.removeItem("guestInvoices");
        localStorage.removeItem("vendor_companies");
        localStorage.removeItem("customer_companies");
        syncedSomething = true;
      } catch (err: any) {
        localStorage.removeItem("guestInvoices");
        localStorage.removeItem("vendor_companies");
        localStorage.removeItem("customer_companies");
        safeToastError(err?.response?.data?.message || "Failed to sync local invoices");
      }
    }

    // Sync companies only if there are no local quotations/invoices
    const allCompanies = [...vendorCompanies, ...customerCompanies];
    const hasLocalDataDependencies = localQuotations.length > 0 || localInvoices.length > 0;

    if (allCompanies.length && !hasLocalDataDependencies) {
      try {
        await axios.post(
          API_ENDPOINTS.COMPANIES.CREATE_MULTIPLE(userId),
          { companies: allCompanies },
          config
        );
        localStorage.removeItem("vendor_companies");
        localStorage.removeItem("customer_companies");
        syncedSomething = true;
      } catch (err: any) {
        const msg = err?.response?.data?.message || "";
        if (msg.includes("already exists")) {
          localStorage.removeItem("vendor_companies");
          localStorage.removeItem("customer_companies");
        } else {
          throw err;
        }
      }
    }

    if (localPosters.length) {
      try {
        // Convert all poster images and logos to Base64
        const postersForBackend = await Promise.all(
          localPosters.map(async (p) => {
            let product_image = "";
            let company_logo = "";

            if (p.product_image_id) {
              const blobUrl = await getImageFromIndexedDB(p.product_image_id);
              if (blobUrl) {
                product_image = await blobUrlToBase64(blobUrl);
              } else {
                product_image = ""; // fallback
              }
            }

            if (p.company_logo_id) {
              const blobUrl = await getImageFromIndexedDB(p.company_logo_id);
              if (blobUrl) {
                company_logo = await blobUrlToBase64(blobUrl);
              } else {
                company_logo = ""; // fallback
              }
            }


            return {
              ...p,
              product_image,
              company_logo,
            };
          })
        );

        await axios.post(
          API_ENDPOINTS.SYNC.SYNC_POSTERS(userId),
          { posters: postersForBackend },
          config
        );

        localStorage.removeItem("guest_posters");
        syncedSomething = true;
      } catch (err: any) {
        safeToastError(err?.response?.data?.message || "Failed to sync local posters");
      }
    }

    if (syncedSomething) {
      safeToastSuccess("Local datas synced successfully!");
    }

  } catch (error: any) {
    safeToastError(error?.response?.data?.message || "Failed to sync local data");
  }
};
