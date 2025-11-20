import React from "react";
import { PurchaseRequest } from "../../services/api";
import DataTable from "../table/DataTable";
import { requestListColumns } from "../columns";

interface RequestListProps {
  requests: PurchaseRequest[];
  loading: boolean;
  onSelect: (request: PurchaseRequest) => void;
  onRefresh: () => void;
}

const RequestList: React.FC<RequestListProps> = ({
  requests,
  loading,
  onSelect,
  onRefresh,
}) => {
  const getStatusBadge = (status: string) => {
    const statusClasses: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${
          statusClasses[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status}
      </span>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(numAmount);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <p className="mt-4">Loading requests...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          No requests found
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          There are no requests matching your current filter.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <DataTable
        data={requests}
        columns={requestListColumns(formatCurrency, formatDate, onSelect)}
      />
    </div>
  );
};

export default RequestList;
