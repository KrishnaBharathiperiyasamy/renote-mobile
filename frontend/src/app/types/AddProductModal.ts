import { ReactNode } from "react";

export interface ProductInput {
    name: string;
    price?: number;
    qty?: number;
    unit?: string;
    gst?: number;
    hsn?: string;
    companyId?: string;
    description?: string;
    dealers?:string;
}

export interface Company {
    _id: string;
    name: string;
}

export interface AddProductModalProps {
    onClose: () => void;            
    onProductAdded?: (savedProduct?: any) => void;   
    product?: ProductInput & { _id: string };
    defaultCompanyId?: string;
    companies?: Company[];
    isDark?: boolean;
}

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    className?: string;
    overlayClassName?: string;
}
