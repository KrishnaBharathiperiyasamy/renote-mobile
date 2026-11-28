import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Modal from "@components/Modal";
import AddCompanyModal from "@components/AddCompanyModal";
import { API_ENDPOINTS } from "@constants/api";
import { toast } from "react-toastify";
import apiClient from "@utilis/apiClient";
import OtpVerificationModal from "@components/OtpVerificationModal"
import { handleAuthErrorAndToast } from "@utilis/catchhandle";
import { useRouter, useSearchParams } from "next/navigation";
import { ConfirmationPopUp } from "@components/ConfirmationPopUp";
import { getLogoUrl } from "@utilis/getLogoUrl";
import { PrimaryBtn, OrangeSpinner } from "@components/Button";

function CompanySettings() {
    const [tkn, setTkn] = useState<string | null>(null);
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const searchParams = useSearchParams();
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [companyToDelete, setCompanyToDelete] = useState<any>({});
    const [editingCompany, setEditingCompany] = useState<any | null>(null);
    const [refreshCompanies, setRefreshCompanies] = useState(true);
    const [otpLoading, setOtpLoading] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpRequested, setOtpRequested] = useState(false);
    const [verifyingCompanyId, setVerifyingCompanyId] = useState<string>("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (typeof window !== "undefined") {
            setTkn(localStorage.getItem("token"));
        }
    }, []);

    const [deleteOptions, setDeleteOptions] = useState({
        invoices: true,
        quotations: true,
        products: true,
    });

    const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
    const router = useRouter();

    const isPanVerified = (company: any) => company?.panVerificationStatus === "verified";

    const handleVerifyPan = async (company: any) => {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("user_id");

        if (!token || !userId) {
            toast.error("Login is required to verify PAN");
            return;
        }

        if (!company?.panNo) {
            toast.error("Please add PAN number before verification");
            return;
        }

        try {
            setVerifyingCompanyId(company._id);
            const { data } = await apiClient.post(
                API_ENDPOINTS.COMPANIES.PAN_VERIFY_INITIATE(company._id, userId)
            );

            if (data?.consentUrl) {
                window.location.href = data.consentUrl;
                return;
            }

            toast.success("PAN verification initiated");
            fetchCompanies();
        } catch (err: any) {
            if (handleAuthErrorAndToast(err, "Failed to initiate PAN verification")) return;
            toast.error(err?.response?.data?.message || "Unable to start PAN verification");
        } finally {
            setVerifyingCompanyId("");
        }
    };

    const openDeleteModal = (company: any) => {
        setCompanyToDelete(company);
        setShowDeleteModal(true);
        setDeleteOptions({ invoices: true, quotations: true, products: true });
    };

    const handleDelete = async () => {
        const phoneNumber = localStorage.getItem("phoneNumber");
        const email = localStorage.getItem("email");

        if (!phoneNumber && !email) {
            toast.error("No phone number or email found for OTP verification");
            return;
        }

        try {
            setOtpLoading(true); // ✅ start loading
            if (phoneNumber) {
                await apiClient.post(API_ENDPOINTS.OTP.REQUEST_PHONE, { phoneNumber });
                toast.success(`OTP sent successfully to your phone number: ${phoneNumber}`);
            } else if (email) {
                await apiClient.post(API_ENDPOINTS.OTP.REQUEST_EMAIL, { email });
                toast.success(`OTP sent successfully to your email: ${email}`);
            }

            setOtpRequested(true);
            setShowOtpModal(true);
        } catch (err: any) {
            toast.error("Failed to request OTP");
        } finally {
            setOtpLoading(false); // ✅ stop loading
        }
    };

    const performActualDelete = async () => {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("user_id");
        if (!companyToDelete) return;

        const localCompanies = JSON.parse(localStorage.getItem("vendor_companies") || "[]");
        const updatedCompanies = localCompanies.filter((c: any) => c._id !== companyToDelete._id);
        localStorage.setItem("vendor_companies", JSON.stringify(updatedCompanies));
        setCompanies(updatedCompanies);

        const localQuotations = JSON.parse(localStorage.getItem("local_quotations") || "[]");
        const updatedQuotations = localQuotations.filter(
            (q: any) => q.company_id?.[0] !== companyToDelete._id
        );
        localStorage.setItem("local_quotations", JSON.stringify(updatedQuotations));
        if (!token || !userId) {
            toast.success("Company and linked quotations deleted successfully");
            return;
        }
        try {
            setDeleting(true);
            const res = await apiClient.delete(
                API_ENDPOINTS.COMPANIES.DELETE_BY_ID(companyToDelete._id),
                { data: deleteOptions }
            );
            toast.success(res.data.message || "Company deleted successfully");
            setRefreshCompanies((prev) => !prev);
        } catch (err: any) {
            if (handleAuthErrorAndToast(err, "Error deleting company")) return;
            toast.error("Failed to delete company");
        } finally {
            setDeleting(false);
            closeDeleteModal();
            setDeleteOptions({ invoices: true, quotations: true, products: true });
        }
    };
    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setCompanyToDelete(null);
    };

    const fetchCompanies = () => {
        setLoading(true);
        const storedUserId = typeof window !== "undefined" ? localStorage.getItem("user_id") : null;
        if (!storedUserId) {
            const localCompanies = JSON.parse(localStorage.getItem("vendor_companies") || "[]");
            setCompanies(localCompanies);
            setLoading(false);
            return;
        }

        apiClient
            .get(`${API_ENDPOINTS.COMPANIES.GET_ALLCOMPANY_BY_USER_ID(storedUserId)}?flag=vendor`)
            .then((response: any) => {
                setCompanies(response.data?.company || []);
            })
            .catch((err: any) => {
                const localCompanies = JSON.parse(localStorage.getItem("vendor_companies") || "[]");
                if (localCompanies.length > 0) {
                    setCompanies(localCompanies);
                } else {
                    if (handleAuthErrorAndToast(err, "Failed to fetch companies")) return;
                    setCompanies([]);
                }
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        const openModal = searchParams.get("openModal") === "true";
        if (openModal) {
            setShowModal(true);
            const newParams = new URLSearchParams(searchParams.toString());
            newParams.delete("openModal");
            router.replace(`/pages/Settings?${newParams.toString()}`);
        }
    }, [searchParams, router]);

    useEffect(() => {
        fetchCompanies();
    }, [refreshCompanies]);

    const addCompanyButton = (
        <PrimaryBtn
            onClick={() => {
                setShowModal(true);
                setEditingCompany(null);
            }}
            label="Add Company"
            className="w-40 h-8 md:w-44 md:h-8 font-medium shadow-sm shrink-0"
        />
    );

    const portalTarget = mounted && typeof document !== "undefined"
        ? document.getElementById("settings-tab-action")
        : null;

    return (
        <div className="flex flex-col gap-2.5">
            {portalTarget ? (
                createPortal(addCompanyButton, portalTarget)
            ) : (
                <div className="flex md:justify-end justify-start">
                    {addCompanyButton}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 rounded-2xl shadow-2xl">
                {loading ? (
                    <div className="flex items-center justify-center h-[60vh] w-full">
                        <OrangeSpinner size={40} />
                    </div>
                ) : companies.length > 0 ? (
                    companies.map((company, index) => (
                        <div
                            key={index}
                            onClick={() => setSelectedCompany(company)}
                            className="flex p-4 sm:p-5 gap-4 sm:gap-4 rounded-2xl bg-gradient-to-br from-white to-orange-50/60 dark:from-[#181B26] dark:to-[#12141D] border border-orange-100/80 dark:border-[#282D3E] shadow-md hover:shadow-2xl dark:shadow-black/40 hover:scale-105 transition-all duration-300 cursor-default"
                        >
                            {/* Logo */}
                            <div className="w-20 h-20 sm:w-24 sm:h-24 relative rounded-full overflow-hidden flex-shrink-0 ring-2 sm:ring-4 ring-orange-400 dark:ring-orange-500 hover:ring-6 hover:ring-orange-300 dark:hover:ring-orange-400 shadow-md transition-all duration-300 bg-white flex items-center justify-center">
                                <Image
                                    src={getLogoUrl(company.logo)}
                                    alt={company.name || "Company Logo"}
                                    fill
                                    style={{ objectFit: "contain", padding: "4px" }}
                                    unoptimized
                                    priority
                                />
                            </div>

                            {/* Info */}
                            <div className="flex flex-col justify-between flex-1 gap-1.5 sm:gap-2">
                                <div className="flex flex-col items-start gap-1">
                                    <span className="text-base sm:text-xl font-semibold text-gray-900 dark:text-white">{company.name}</span>
                                    {isPanVerified(company) && (
                                        <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-transparent dark:border-emerald-500/30 px-2.5 py-0.5 text-[11px] sm:text-xs font-semibold">
                                            Verified
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                    Created on: {new Date(company.createdAt).toLocaleDateString()}
                                </div>
                                {/* Total Consumed Space */}
                                {company.totalConsumedSpace && (
                                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                        Storage Used: {company.totalConsumedSpace}
                                    </div>
                                )}
                                <div className="flex flex-nowrap justify-end items-center gap-1.5 mt-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingCompany(company);
                                            setShowModal(true);
                                        }}
                                        className="inline-flex items-center justify-center h-8 sm:h-7 px-2.5 sm:px-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md shadow-sm transition-colors whitespace-nowrap"
                                    >
                                        Edit
                                    </button>
                                    {isPanVerified(company) ? (
                                        <span className="inline-flex items-center justify-center h-8 sm:h-7 px-2.5 sm:px-2 text-[11px] font-semibold rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-transparent dark:border-emerald-500/30 whitespace-nowrap">
                                            PAN Verified
                                        </span>
                                    ) : (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleVerifyPan(company);
                                            }}
                                            disabled={verifyingCompanyId === company._id}
                                            className={`inline-flex items-center justify-center h-8 sm:h-7 px-2.5 sm:px-2 text-xs font-medium text-white rounded-md shadow-sm transition-colors whitespace-nowrap ${verifyingCompanyId === company._id ? "bg-emerald-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"}`}
                                        >
                                            {verifyingCompanyId === company._id ? "Verifying..." : "Verify PAN"}
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openDeleteModal(company);
                                        }}
                                        disabled={deleting}
                                        className={`inline-flex items-center justify-center h-8 sm:h-7 px-2.5 sm:px-2 text-xs font-medium text-white rounded-md shadow-sm transition-colors whitespace-nowrap ${deleting ? "bg-red-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                                            }`}
                                    >
                                        {deleting ? (
                                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            "Delete"
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center h-[60vh] text-center px-4">
                        <img
                            src="/empty-icon.png"
                            alt="No companies"
                            className="w-24 h-24 sm:w-32 sm:h-32 mb-4 opacity-80"
                        />
                        {tkn ? (
                            <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg font-semibold">
                                No companies yet, add your company to get started
                            </p>
                        ) : (
                            <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg font-semibold">
                                No companies yet, create one locally to get started
                            </p>
                        )}
                    </div>
                )}
            </div>

            <Modal isOpen={showDeleteModal} onClose={closeDeleteModal}>
                <ConfirmationPopUp
                    message="Are you sure you want to delete this company? You can also choose to delete linked data."
                    onYes={handleDelete}
                    onNo={closeDeleteModal}
                    showDeleteOptions
                    deleteOptions={deleteOptions}
                    setDeleteOptions={setDeleteOptions}
                    deleting={deleting}
                    otpLoading={otpLoading}
                />
            </Modal>

            {/* Details Modal */}
            <Modal isOpen={!!selectedCompany} onClose={() => setSelectedCompany(null)}>
                {selectedCompany && (
                    <div className="flex flex-col gap-4 p-4 text-gray-800 dark:text-gray-100">
                        <div className="flex justify-center mb-4">
                            <div className="w-24 h-24 relative rounded-full overflow-hidden ring-4 ring-orange-400 dark:ring-orange-500 bg-white">
                                <Image
                                    src={getLogoUrl(selectedCompany.logo)}
                                    alt={selectedCompany.name}
                                    layout="fill"
                                    objectFit="contain"
                                    className="p-1"
                                    unoptimized
                                />
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">{selectedCompany.name}</h2>
                        {isPanVerified(selectedCompany) && (
                            <div className="mx-auto inline-flex w-fit items-center rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-transparent dark:border-emerald-500/30 px-2.5 py-1 text-xs font-semibold">
                                Verified
                            </div>
                        )}

                        <div className="flex flex-col gap-2 text-gray-700 dark:text-gray-300">
                            <div>
                                <strong className="text-gray-900 dark:text-white">Created At:</strong> {new Date(selectedCompany.createdAt).toLocaleDateString()}
                            </div>
                            {selectedCompany.email && (
                                <div>
                                    <strong className="text-gray-900 dark:text-white">Email:</strong> {selectedCompany.email}
                                </div>
                            )}
                            {selectedCompany.phone && (
                                <div>
                                    <strong className="text-gray-900 dark:text-white">Phone:</strong> {selectedCompany.phone}
                                </div>
                            )}
                            {selectedCompany.address && (
                                <div>
                                    <strong className="text-gray-900 dark:text-white">Address:</strong> {selectedCompany.address}
                                </div>
                            )}
                            {selectedCompany.panNo && (
                                <div>
                                    <strong className="text-gray-900 dark:text-white">PAN:</strong> {selectedCompany.panNo}
                                </div>
                            )}
                            <div>
                                <strong className="text-gray-900 dark:text-white">PAN Status:</strong> {selectedCompany.panVerificationStatus || "unverified"}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-4">
                            {!isPanVerified(selectedCompany) && (
                                <PrimaryBtn
                                    label={verifyingCompanyId === selectedCompany._id ? "Verifying..." : "Verify PAN"}
                                    onClick={() => handleVerifyPan(selectedCompany)}
                                    disabled={verifyingCompanyId === selectedCompany._id}
                                />
                            )}
                            <PrimaryBtn
                                label="Edit"
                                onClick={() => {
                                    setEditingCompany(selectedCompany);
                                    setShowModal(true);
                                    setSelectedCompany(null);
                                }}
                            />
                            <PrimaryBtn label="Close" onClick={() => setSelectedCompany(null)} />
                        </div>
                    </div>
                )}
            </Modal>
            <Modal isOpen={showOtpModal}
                onClose={() => setShowOtpModal(false)}>
                <OtpVerificationModal
                    isOpen={showOtpModal}
                    onClose={() => setShowOtpModal(false)}
                    onVerified={performActualDelete}
                />
            </Modal>
            {/* Add/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setEditingCompany(null);
                }}
            >
                <AddCompanyModal
                    existingCompany={editingCompany}
                    refreshCompanies={fetchCompanies}
                    closeModal={() => {
                        setShowModal(false);
                        setEditingCompany(null);
                    }}
                />
            </Modal>
        </div>
    );
}

export default CompanySettings;
