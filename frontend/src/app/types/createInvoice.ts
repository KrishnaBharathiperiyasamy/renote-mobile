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
    upiId?: string;
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

export interface Suggestion {
    name: string;
    price: number;
    hsn: string;
    unit: string;
}

export interface Invoice {
    _id: string;
    invoiceID: string;
    invoiceLocalId: string;
    company: string;
    company_id?: any[]; // ideally type this properly
    customers?: {
        name?: string;
        address?: string;
        city?: string;
        phone?: string;
        phoneNumber?: string;
        email?: string;
    }[];
    products?: {
        name?: string;
        price?: number;
        quantity?: number;
        gst?: number;
        hsn?: string;
        amount?: number;
    }[];
}

export interface Product {
    name?: string;
    price?: number;
    quantity?: number;
    unit?: string;
    gst?: number;
    hsn?: string;
    amount?: number;
}