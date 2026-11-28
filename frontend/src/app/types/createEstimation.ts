export interface Company {
  _id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city?: string;
  state?: string;
  gstNo?: string;
  panNo?: string;
  panVerificationStatus?: "unverified" | "pending" | "verified" | "failed";
  logo?: string;
}

export interface ToDetails {
  name: string;
  address: string;
  city: string;
  state?: string;
  phone: string;
  email: string;
  gstNo?: string;
}

export interface ProductRow {
  product: string;
  qty: number | string;
  price: number | string;
  gst?: number | string;
  unit?: string;
  hsn?: string;
  amount?: number;
}

export interface Suggestion {
  name: string;
  price: number;
  unit: string;
}

export interface Customer {
  name: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  gstNo?:string
}