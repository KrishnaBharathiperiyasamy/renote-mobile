export type Quotation = {
    _id: string;
    estimateID: string;
    total: number;
    products?: Product[];
    company_id: { name: string; logo?: string }[];
    quotationId?: string;
    companyName?: string;
    company?: { name?: string; logo?: string };
    customers: { name: string; phoneNumber?: string }[]; // added
    createdAt: string;
    isHeart: boolean;
};
export type Product = {
    name: string;
    quantity: number;
    price: number;
    gst?: number;
};

export type QuotationIdLike = string | number | undefined;