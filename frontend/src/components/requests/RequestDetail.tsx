import React, { useState } from "react";
import { toast } from "sonner";
import {
  PurchaseRequest,
  documentsAPI,
  requestsAPI,
  getFileUrl,
} from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import RequestForm from "./RequestForm";
import DataTable from "../table/DataTable";
import { itemsColumns } from "../columns";

interface RequestDetailProps {
  request: PurchaseRequest;
  onClose: () => void;
  onUpdate: () => void;
}

const RequestDetail: React.FC<RequestDetailProps> = ({
  request,
  onClose,
  onUpdate,
}) => {
  const { user, isStaff, isApprover } = useAuth();
  const [showEditForm, setShowEditForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [proformaFile, setProformaFile] = useState<File | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(numAmount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  const handleApprove = async () => {
    setLoading(true);
    setError("");
    try {
      await requestsAPI.approve(request.id);
      toast.success("Request approved!", {
        description: "The purchase request has been approved successfully.",
      });
      onUpdate();
      onClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || "Failed to approve request";
      setError(errorMessage);
      toast.error("Approval failed", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError("Please provide a rejection reason");
      toast.error("Rejection reason required", {
        description: "Please provide a reason for rejecting this request.",
      });
      return;
    }
    setLoading(true);
    setError("");
    try {
      await requestsAPI.reject(request.id, rejectReason);
      toast.success("Request rejected", {
        description: "The purchase request has been rejected.",
      });
      onUpdate();
      onClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || "Failed to reject request";
      setError(errorMessage);
      toast.error("Rejection failed", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProformaUpload = async () => {
    if (!proformaFile) {
      toast.error("No file selected", {
        description: "Please select a proforma file to upload.",
      });
      return;
    }
    setLoading(true);
    setError("");
    try {
      await documentsAPI.uploadProforma(request.id, proformaFile);
      toast.success("Proforma uploaded!", {
        description: "The proforma invoice has been uploaded successfully.",
      });
      setProformaFile(null);
      onUpdate();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || "Failed to upload proforma";
      setError(errorMessage);
      toast.error("Upload failed", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReceiptUpload = async () => {
    if (!receiptFile) {
      toast.error("No file selected", {
        description: "Please select a receipt file to upload.",
      });
      return;
    }
    setLoading(true);
    setError("");
    try {
      await documentsAPI.uploadReceipt(request.id, receiptFile);
      toast.success("Receipt uploaded!", {
        description: "The receipt has been uploaded successfully.",
      });
      setReceiptFile(null);
      onUpdate();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || "Failed to upload receipt";
      setError(errorMessage);
      toast.error("Upload failed", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showEditForm ? (
        <RequestForm
          initialData={request}
          onClose={() => setShowEditForm(false)}
          onSuccess={() => {
            setShowEditForm(false);
            onUpdate();
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">
                {request.title}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Status
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      request.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : request.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {request.status.toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Amount
                  </h3>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(request.amount)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Created By
                  </h3>
                  <p className="text-gray-900">{request.created_by.username}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Created At
                  </h3>
                  <p className="text-gray-900">
                    {formatDate(request.created_at)}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Description
                </h3>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {request.description}
                </p>
              </div>

              {request.items && request.items.length > 0 && (
                <DataTable columns={itemsColumns} data={request.items} />
              )}

              {isStaff && request.can_be_edited && (
                <div className="mb-6">
                  <button
                    onClick={() => setShowEditForm(true)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                  >
                    Edit Request
                  </button>
                </div>
              )}

              {isApprover && request.status === "pending" && (
                <div className="mb-6 space-y-4">
                  {!showRejectForm ? (
                    <div className="flex gap-3">
                      <button
                        onClick={handleApprove}
                        disabled={loading}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                      >
                        {loading ? "Processing..." : "Approve"}
                      </button>
                      <button
                        onClick={() => setShowRejectForm(true)}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-md p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rejection Reason
                      </label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3"
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={handleReject}
                          disabled={loading}
                          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                        >
                          {loading ? "Processing..." : "Confirm Rejection"}
                        </button>
                        <button
                          onClick={() => {
                            setShowRejectForm(false);
                            setRejectReason("");
                          }}
                          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isStaff && request.status === "pending" && (
                <div className="mb-6 border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Upload Proforma
                  </h3>
                  <div className="flex gap-3">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) =>
                        setProformaFile(e.target.files?.[0] || null)
                      }
                      className="text-sm"
                    />
                    <button
                      onClick={handleProformaUpload}
                      disabled={!proformaFile || loading}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      Upload
                    </button>
                  </div>
                  {request.proforma && (
                    <div className="mt-2 text-sm text-gray-600">
                      Proforma uploaded:{" "}
                      <a
                        href={getFileUrl(request.proforma.file) || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600"
                      >
                        View
                      </a>
                    </div>
                  )}
                </div>
              )}

              {isStaff && request.status === "approved" && (
                <div className="mb-6 border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Upload Receipt
                  </h3>
                  <div className="flex gap-3">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) =>
                        setReceiptFile(e.target.files?.[0] || null)
                      }
                      className="text-sm"
                    />
                    <button
                      onClick={handleReceiptUpload}
                      disabled={!receiptFile || loading}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      Upload
                    </button>
                  </div>
                  {request.receipts && request.receipts.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {request.receipts.map((receipt: any) => (
                        <div key={receipt.id} className="text-sm">
                          <a
                            href={getFileUrl(receipt.file) || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600"
                          >
                            Receipt {receipt.id}
                          </a>
                          <span
                            className={`ml-2 px-2 py-1 rounded text-xs ${
                              receipt.validation_status === "valid"
                                ? "bg-green-100 text-green-800"
                                : receipt.validation_status === "discrepancy"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {receipt.validation_status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {request.purchase_order && (
                <div className="border-t pt-6">
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          Purchase Order Generated
                        </h3>
                        <p className="text-sm text-gray-600">
                          PO Number:{" "}
                          <span className="font-semibold text-purple-700">
                            {request.purchase_order.po_number}
                          </span>
                        </p>
                        {request.purchase_order.generated_at && (
                          <p className="text-xs text-gray-500 mt-1">
                            Generated on:{" "}
                            {formatDate(request.purchase_order.generated_at)}
                          </p>
                        )}
                      </div>
                      {request.purchase_order.file && (
                        <div className="flex gap-2">
                          <a
                            href={
                              getFileUrl(request.purchase_order.file) || "#"
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            View PDF
                          </a>
                          <a
                            href={
                              getFileUrl(request.purchase_order.file) || "#"
                            }
                            download
                            className="bg-white text-purple-600 border-2 border-purple-600 px-4 py-2 rounded-md hover:bg-purple-50 transition-colors flex items-center gap-2"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                              />
                            </svg>
                            Download
                          </a>
                        </div>
                      )}
                    </div>
                    {request.purchase_order.vendor_name && (
                      <div className="mt-4 pt-4 border-t border-purple-200">
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">Vendor:</span>{" "}
                          {request.purchase_order.vendor_name}
                        </p>
                        {request.purchase_order.total_amount && (
                          <p className="text-sm text-gray-700 mt-1">
                            <span className="font-semibold">Total Amount:</span>{" "}
                            {formatCurrency(
                              request.purchase_order.total_amount
                            )}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {request.status === "approved" && !request.purchase_order && (
                <div className="border-t pt-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      Purchase Order is being generated. Please refresh the page
                      in a moment.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RequestDetail;
