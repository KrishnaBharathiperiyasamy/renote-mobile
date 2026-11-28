import { useState } from "react";
import { PrimaryBtn, SecondaryBtn, inputRegister } from "@components/Button";
import apiClient from "@utilis/apiClient";
import { toast } from "react-toastify";
import { AlertTriangle } from "lucide-react";
import { API_ENDPOINTS } from "@constants/api";

interface OtpVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onVerified: () => void;
}

const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({ isOpen, onClose, onVerified }) => {
    const [otp, setOtp] = useState("");
    const [otpVerifying, setOtpVerifying] = useState(false);

    const handleVerify = async () => {
        const phoneNumber = localStorage.getItem("phoneNumber");
        const email = localStorage.getItem("email");

        if (!phoneNumber && !email) {
            toast.error("No phone number or email found for OTP verification");
            return;
        }

        try {
            setOtpVerifying(true);
            if (phoneNumber) {
                await apiClient.post(API_ENDPOINTS.OTP.VERIFY_PHONE, { phoneNumber, otp });
            } else if (email) {
                await apiClient.post(API_ENDPOINTS.OTP.VERIFY_EMAIL, { email, otp });
            }

            toast.success("OTP verified successfully");
            onClose();
            onVerified();
        } catch (err: any) {
            toast.error("Invalid OTP");
        } finally {
            setOtpVerifying(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-opacity-30 z-50">
            <div className="flex flex-col gap-6 sm:w-[24rem] p-6 rounded-xl animate-fadeIn bg-white">

                {/* Icon + Title */}
                <div className="flex flex-col items-center text-center gap-3">
                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 text-orange-500">
                        <AlertTriangle size={28} />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800">Enter OTP to Delete</h2>
                    
                </div>

                {/* OTP Input */}
                <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter OTP"
                    className={inputRegister}
                />

                {/* Buttons */}
                <div className="flex justify-end gap-3 mt-4">
                    <SecondaryBtn
                        label="Cancel"
                        onClick={onClose}
                        className="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200"
                    />
                    <PrimaryBtn
                        label={otpVerifying ? "Verifying..." : "Verify & Delete"}
                        disabled={otpVerifying}
                        onClick={handleVerify}
                        className={`px-4 py-2 text-sm rounded-lg ${otpVerifying
                            ? "bg-orange-300 cursor-not-allowed"
                            : "bg-orange-500 hover:bg-orange-600 text-white"
                            }`}
                    />
                </div>
            </div>
        </div>
    );
};

export default OtpVerificationModal;
