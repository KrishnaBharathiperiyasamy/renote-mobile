"use client";
import { useEffect, useState } from "react";
import Modal from "@components/Modal";
import AddCompanyModal from "@components/AddCompanyModal";
import { handleAuthErrorAndToast } from "@utilis/catchhandle";
import { API_ENDPOINTS } from "@constants/api";
import { safeToastError, safeToastSuccess } from "@utilis/toastHelper";
import apiClient from "@utilis/apiClient";
import { ConfirmationPopUp } from "@components/ConfirmationPopUp";
import { PrimaryBtn, OrangeSpinner } from "@components/Button";
import Header from "@components/header/page";
import { Phone } from "lucide-react";

function CustomerCompany() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<any>(null);
  const [editingCompany, setEditingCompany] = useState<any | null>(null);
  const [refreshCompanies, setRefreshCompanies] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);

  // Handle Delete
  const deleteCompany = async () => {
    if (!companyToDelete) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (companyToDelete._id) {
      try {
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        await apiClient.delete(
          API_ENDPOINTS.COMPANIES.DELETE_CUSTOMER(companyToDelete._id),
          { headers }
        );
        setRefreshCompanies((prev) => !prev);
        safeToastSuccess("Company deleted successfully");
        setShowDeleteModal(false);
      } catch (err: any) {
        if (handleAuthErrorAndToast(err, "Error deleting company")) return;
        safeToastError("Error deleting company");
      }
    } else {
      // Offline delete
      const stored = localStorage.getItem("customer_companies");
      let localCompanies = stored ? JSON.parse(stored) : [];
      localCompanies = localCompanies.filter(
        (c: any) => c.id !== companyToDelete.id
      );
      localStorage.setItem("customer_companies", JSON.stringify(localCompanies));
      setCompanies(localCompanies);
      safeToastSuccess("Company deleted successfully");
      setShowDeleteModal(false);
    }
  };

  const openDeleteModal = (company: any) => {
    setCompanyToDelete(company);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setCompanyToDelete(null);
  };

  const fetchCustomerCompanies = () => {
    setLoading(true);
    const storedUserId = typeof window !== "undefined" ? localStorage.getItem("user_id") : null;
    if (!storedUserId) {
      const localData = localStorage.getItem("customer_companies");
      setCompanies(localData ? JSON.parse(localData) : []);
      setLoading(false);
      return;
    }
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    apiClient
      .get(`${API_ENDPOINTS.COMPANIES.GET_ALLCOMPANY_BY_USER_ID(storedUserId)}?flag=customer`, {
        headers,
      })
      .then((response: any) => {
        setCompanies(response.data?.company || []);
      })
      .catch((err: any) => {
        const localData = localStorage.getItem("customer_companies");
        if (localData) {
          setCompanies(JSON.parse(localData));
        } else {
          if (handleAuthErrorAndToast(err, "Server Error")) return;
          setCompanies([]);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCustomerCompanies();
  }, [refreshCompanies]);

  return (
    <div className="min-h-screen bg-gray-50/40 dark:bg-[#0F1117] transition-colors duration-200">
      <Header />
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 mt-4 pb-12 flex flex-col gap-6">
        {/* Add Customer Button */}
        <div className="flex justify-end">
          <PrimaryBtn
            onClick={() => {
              setShowModal(true);
              setEditingCompany(null);
            }}
            label="Add Customer"
            className="w-36 sm:w-44 h-9 font-medium shadow-sm"
          />
        </div>

        {/* Companies Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 rounded-2xl shadow-2xl">
          {loading ? (
            <div className="col-span-full flex items-center justify-center h-[60vh] w-full">
              <OrangeSpinner size={40} />
            </div>
          ) : companies.length > 0 ? (
            companies.map((company, index) => (
              <div
                key={company._id || company.id || index}
                onClick={() => setSelectedCompany(company)}
                className="group relative flex items-center gap-4 p-5 rounded-2xl 
                  bg-white dark:bg-[#181B26] 
                  border border-gray-200/90 dark:border-[#282D3E] 
                  shadow-sm hover:shadow-md dark:shadow-black/40 
                  hover:scale-[1.01] transition-all duration-200 cursor-pointer"
              >
                {/* Circular Avatar with Orange Ring */}
                <div
                  className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center 
                    rounded-full bg-white dark:bg-[#1E2230] 
                    border-4 border-[#F57C00] dark:border-[#FB8C00] shadow-sm"
                >
                  <span className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {company.name?.[0]?.toUpperCase() || "C"}
                  </span>
                </div>

                {/* Company Details */}
                <div className="flex flex-col flex-1 min-w-0 justify-between gap-1.5 py-0.5">
                  <h3
                    className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate"
                    title={company.name}
                  >
                    {company.name}
                  </h3>

                  {/* Phone */}
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">
                    <Phone className="w-[18px] h-[18px] text-[#E91E63] dark:text-[#F06292] stroke-[2] shrink-0" />
                    <span className="truncate">{company.phone || "—"}</span>
                  </div>

                  {/* Created Date */}
                  {company.createdAt && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Created: {new Date(company.createdAt).toLocaleDateString("en-US")}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-2 mt-1 sm:mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCompany(company);
                        setShowModal(true);
                      }}
                      className="px-3.5 py-1 sm:py-1.5 rounded-lg bg-[#1976D2] hover:bg-[#1565C0] text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteModal(company);
                      }}
                      className="px-3.5 py-1 sm:py-1.5 rounded-lg bg-[#D32F2F] hover:bg-[#C62828] text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center h-[60vh] text-center px-4">
              <img
                src="/empty-icon.png"
                alt="No customers"
                className="w-24 h-24 mb-4 opacity-70 dark:invert dark:brightness-90"
              />
              <p className="text-gray-700 dark:text-gray-200 text-base font-medium">
                No customer companies found. Click &quot;Add Customer&quot; to create one.
              </p>
            </div>
          )}
        </div>

        {/* Delete Modal */}
        <Modal isOpen={showDeleteModal} onClose={closeDeleteModal}>
          <ConfirmationPopUp
            message="Are you sure want to delete the company?"
            onYes={deleteCompany}
            onNo={closeDeleteModal}
          />
        </Modal>

        {/* Details Modal */}
        <Modal
          isOpen={!!selectedCompany}
          onClose={() => setSelectedCompany(null)}
        >
          {selectedCompany && (
            <div className="flex flex-col gap-4 p-4 min-w-[280px] sm:min-w-[360px]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center bg-white dark:bg-[#1E2230] border-2 border-[#F57C00] dark:border-[#FB8C00] shadow-sm">
                  <span className="text-lg font-bold text-gray-800 dark:text-gray-100">
                    {selectedCompany.name?.[0]?.toUpperCase() || "C"}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {selectedCompany.name}
                </h2>
              </div>

              <div className="flex flex-col gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                {selectedCompany.createdAt && (
                  <div>
                    <strong className="text-gray-900 dark:text-white">Created At:</strong>{" "}
                    {new Date(selectedCompany.createdAt).toLocaleDateString("en-US")}
                  </div>
                )}
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
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <PrimaryBtn
                  label="Edit"
                  onClick={() => {
                    setEditingCompany(selectedCompany);
                    setShowModal(true);
                    setSelectedCompany(null);
                  }}
                />
                <PrimaryBtn
                  label="Close"
                  onClick={() => setSelectedCompany(null)}
                />
              </div>
            </div>
          )}
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
            flag="customer"
            closeModal={() => {
              setShowModal(false);
              setEditingCompany(null);
            }}
            refreshCompanies={fetchCustomerCompanies}
          />
        </Modal>
      </div>
    </div>
  );
}

export default CustomerCompany;
