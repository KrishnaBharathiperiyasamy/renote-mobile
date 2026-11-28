import React from "react";
import { PrimaryBtn, SecondaryBtn } from "@components/Button";
import { AlertTriangle } from "lucide-react";
import { ConfirmationPopUpProps } from "@app-types/ConfirmationProps";

export const ConfirmationPopUp: React.FC<ConfirmationPopUpProps> = ({
  message,
  onYes,
  onNo,
  deleteOptions,
  setDeleteOptions,
  showDeleteOptions = false,
  deleting = false,
  otpLoading
}) => {
  return (
    <div className="flex flex-col gap-6 w-full p-6 rounded-xl animate-fadeIn bg-white dark:bg-[#16181E] text-gray-900 dark:text-[#E0E2EC]">
      {/* Icon + Title */}
      <div className="flex flex-col items-center text-center gap-3">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#FF5722]/10 dark:bg-[#FF5722]/20 border border-[#FF5722]/20 text-[#FF5722] shadow-[0_2px_12px_rgba(255,87,34,0.2)]">
          <AlertTriangle size={28} />
        </div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Confirm Action</h2>

        <div className="text-sm text-gray-500 dark:text-gray-400 w-full">{message}</div>
      </div>

      {/* Optional checkboxes */}
      {showDeleteOptions && deleteOptions && setDeleteOptions && (
        <div className="flex flex-col gap-3 text-gray-700 dark:text-gray-300 mt-2 text-sm font-semibold">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="w-4 h-4 accent-[#FF5722] cursor-pointer"
              checked={deleteOptions.invoices}
              onChange={(e) =>
                setDeleteOptions((prev) => ({
                  ...prev,
                  invoices: e.target.checked,
                }))
              }
            />
            Delete associated Invoices
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="w-4 h-4 accent-[#FF5722] cursor-pointer"
              checked={deleteOptions.quotations}
              onChange={(e) =>
                setDeleteOptions((prev) => ({
                  ...prev,
                  quotations: e.target.checked,
                }))
              }
            />
            Delete associated Estimations
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="w-4 h-4 accent-[#FF5722] cursor-pointer"
              checked={deleteOptions.products}
              onChange={(e) =>
                setDeleteOptions((prev) => ({
                  ...prev,
                  products: e.target.checked,
                }))
              }
            />
            Delete associated Products
          </label>
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-end gap-3 mt-4">
        <SecondaryBtn
          label="Cancel"
          onClick={onNo}
          className="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200"
        />
        <PrimaryBtn
          label={deleting || otpLoading ? "Processing..." : "Confirm"}
          disabled={deleting || otpLoading}
          onClick={onYes}
          className={`px-5 py-2 text-sm font-semibold rounded-xl ${deleting || otpLoading
              ? "bg-gray-300 dark:bg-white/10 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-[#FF5722] to-[#FF6B00] hover:from-[#FF7043] hover:to-[#FF5722] text-white shadow-[0_4px_14px_rgba(255,87,34,0.35)] hover:shadow-[0_6px_20px_rgba(255,87,34,0.45)]"
            }`}
        />
      </div>
    </div>
  );
};
