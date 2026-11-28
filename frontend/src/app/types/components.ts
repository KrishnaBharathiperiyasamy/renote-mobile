import { ReactNode } from "react";

export type ButtonProps = {
    label: string | ReactNode;
    onClick?: () => void;
    type?: "button" | "submit" | "reset";
    className?: string; // Add className to ButtonProps
    disabled?: boolean;
};

export interface ToggleBtnProps {
    label: string;
    value?: boolean;
    onTrue?: () => void;
    onFalse?: () => void;
    className?: string;
    disabled?: boolean;
}


export interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  profileImageUrl?: string;
}
