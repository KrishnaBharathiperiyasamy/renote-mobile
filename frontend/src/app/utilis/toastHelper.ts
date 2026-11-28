// toastHelper.ts
import { toast } from "react-toastify";

export const safeToastError = (msg: string | unknown) => {
  const text = typeof msg === "string" ? msg : Array.isArray(msg) ? msg.join(", ") : String(msg || "Something went wrong");
  try {
    toast.error(text);
  } catch {}
  console.warn("[reNote notification]:", text);
};

export const safeToastSuccess = (msg: string) => {
  try {
    toast.success(msg);
  } catch {}
  console.log("[reNote notification]:", msg);
};

export const safeToastInfo = (msg: string) => {
  try {
    toast.info(msg);
  } catch {}
  console.log("[reNote notification]:", msg);
};


