
export interface Product {
    _id: string;
    company_id: string;
    user_id: string;
    name: string;
    price: number;
    qty?: number;
    unit?: string;
    gst?: number;
    hsn?: string;
    isHeart?: string;
    description?: string;
    dealers?:string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Company {
    _id: string;
    name: string;
}