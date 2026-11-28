export type Invoices = {
  id?: string;
  _id?: string; // present for logged-in users
  invoiceLocalId?: string; // present for guest invoices
  invoiceID: string;
  estimateID: string;
  total: number;
  products?: Product[];
  company_id?: Company; // single company reference
  companyName?: string; // optional, derived from company_id or guest data
  quotationId?: string;
  customers?: Customer[]; // optional for guest invoices without customers
  createdAt: string;
  isHeart: boolean;
};

export type Product = {
  name: string;
  quantity: number;
  amount: number;
  price: number;
  gst?: number;
};

export interface HsnModalProps {
  isOpen: boolean;
  initialValue?: string;
  onSave: (value: string) => void;
  onCancel: () => void;
}

export type Customer = {
  name: string;
  phoneNumber?: string;
};

export type Company = {
  _id: string;
  name: string;
};
