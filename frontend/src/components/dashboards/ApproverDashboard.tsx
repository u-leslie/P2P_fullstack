import React, { useState, useEffect } from "react";
import { requestsAPI, PurchaseRequest } from "../../services/api";
import RequestDetail from "../requests/RequestDetail";
import DataTable from "../table/DataTable";
import { approverColumns } from "../columns";
import AnalyticsCards from "../cards/AnalyticsCards";

const ApproverDashboard: React.FC = () => {
  const [allRequests, setAllRequests] = useState<PurchaseRequest[]>([]);
  const [selectedRequest, setSelectedRequest] =
    useState<PurchaseRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await requestsAPI.list();
      const data = Array.isArray(response.data)
        ? response.data
        : response.data.results;
      setAllRequests(data);
    } catch (error) {
      console.error("Error loading requests:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const getFilteredRequests = () => {
    if (filter === "all") return allRequests;
    return allRequests.filter((r) => r.status === filter);
  };

  const filteredRequests = getFilteredRequests();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">
              Approver Dashboard
            </h1>
            <p className="text-gray-600">
              Review and manage purchase requests awaiting your approval
            </p>
          </div>
        </div>

        <AnalyticsCards
          requests={allRequests}
          onFilterChange={setFilter}
          activeFilter={filter}
        />

        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            {(["all", "pending", "approved", "rejected"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === f
                    ? "bg-purple-600 text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f !== "all" && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-white bg-opacity-20 text-xs">
                    {allRequests.filter((r) => r.status === f).length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={loadRequests}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg
              className="w-4 h-4 inline mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="mt-4">Loading requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
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
              No {filter === "all" ? "" : filter} requests found
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {filter === "all"
                ? "There are no requests in the system yet."
                : `There are no ${filter} requests at the moment.`}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <DataTable
              data={filteredRequests}
              columns={approverColumns(formatCurrency, formatDate, (req) =>
                setSelectedRequest(req)
              )}
            />
          </div>
        )}

        {selectedRequest && (
          <RequestDetail
            request={selectedRequest}
            onClose={() => {
              setSelectedRequest(null);
              loadRequests();
            }}
            onUpdate={loadRequests}
          />
        )}
      </div>
    </div>
  );
};

export default ApproverDashboard;
