import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { requestsAPI, PurchaseRequest } from "../services/api";
import RequestList from "../components/requests/RequestList";
import RequestForm from "../components/requests/RequestForm";
import RequestDetail from "../components/requests/RequestDetail";
import ApproverDashboard from "../components/dashboards/ApproverDashboard";
import FinanceDashboard from "../components/dashboards/FinanceDashboard";
import AnalyticsCards from "../components/cards/AnalyticsCards";

const Dashboard: React.FC = () => {
  const { user, isStaff, isApprover, isFinance } = useAuth();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<PurchaseRequest | null>(null);
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
      setRequests(data);
    } catch (error) {
      console.error("Error loading requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCreated = () => {
    setShowForm(false);
    loadRequests();
  };

  const handleRequestUpdated = () => {
    setSelectedRequest(null);
    loadRequests();
  };

  const getFilteredRequests = () => {
    if (filter === "all") return requests;
    return requests.filter((r) => r.status === filter);
  };

  const filteredRequests = getFilteredRequests();

  if (isApprover) {
    return <ApproverDashboard />;
  }

  if (isFinance) {
    return <FinanceDashboard />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                Welcome back, {user?.first_name || user?.username}
              </h1>
              <p className="text-gray-600">
                Manage your purchase requests and track their status
              </p>
            </div>
            {isStaff && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors flex items-center gap-2 font-medium"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                New Request
              </button>
            )}
          </div>
        </div>

        <AnalyticsCards
          requests={requests}
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
                    {requests.filter((r) => r.status === f).length}
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

        {showForm && (
          <RequestForm
            onClose={() => setShowForm(false)}
            onSuccess={handleRequestCreated}
          />
        )}

        {selectedRequest && (
          <RequestDetail
            request={selectedRequest}
            onClose={() => setSelectedRequest(null)}
            onUpdate={handleRequestUpdated}
          />
        )}

        <RequestList
          requests={filteredRequests}
          loading={loading}
          onSelect={setSelectedRequest}
          onRefresh={loadRequests}
        />
      </div>
    </div>
  );
};

export default Dashboard;
