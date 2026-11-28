"use client";
import { useState, useEffect } from "react";
import Modal from "@components/Modal";
import { HsnModalProps } from "@app-types/invoiceHomepage";
import { PrimaryBtn, SecondaryBtn } from "@components/Button";

export default function HsnModal({
  isOpen,
  initialValue = "",
  onSave,
  onCancel,
}: HsnModalProps) {
  const [tempHsn, setTempHsn] = useState(initialValue);

  // Reset tempHsn whenever modal opens or initialValue changes
  useEffect(() => {
    if (isOpen) setTempHsn(initialValue);
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onCancel}>
      <div className="flex flex-col gap-4 sm:w-[24rem] p-6 rounded-xl animate-fadeIn">
        <h2 className="text-lg font-semibold text-gray-800">Enter HSN Code</h2>
        <input
          type="text"
          value={tempHsn}
          onChange={(e) => setTempHsn(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-300 outline-none"
        />
        <div className="flex justify-end gap-3 mt-2">
          <SecondaryBtn
            label="Cancel"
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200"
          />
          <PrimaryBtn
            label="Save"
            onClick={() => onSave(tempHsn)}
            className="px-4 py-2 text-sm rounded-lg bg-orange-500 hover:bg-orange-600 text-white"
          />
        </div>
      </div>
    </Modal>
  );
}
