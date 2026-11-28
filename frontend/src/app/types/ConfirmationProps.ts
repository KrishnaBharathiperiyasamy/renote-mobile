
export interface ConfirmationPopUpProps {
  message: React.ReactNode;
  onYes: () => void;
  onNo: () => void;
  deleteOptions?: {
    invoices: boolean;
    quotations: boolean;
    products: boolean;
  };
  setDeleteOptions?: React.Dispatch<
    React.SetStateAction<{
      invoices: boolean;
      quotations: boolean;
      products: boolean;
    }>
  >;
  showDeleteOptions?: boolean; // 👈 controls whether to render checkboxes
  deleting?: boolean; // 👈 for showing loader in Confirm button
  otpLoading?: boolean; 
}
