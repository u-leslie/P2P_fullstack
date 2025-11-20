import React from "react";
import { PurchaseRequest } from "../../services/api";

interface AnalyticsCardsProps {
  requests: PurchaseRequest[];
  onFilterChange?: (filter: "all" | "pending" | "approved" | "rejected") => void;
  activeFilter?: "all" | "pending" | "approved" | "rejected";
}

const AnalyticsCards: React.FC<AnalyticsCardsProps> = ({
  requests,
  onFilterChange,
  activeFilter = "all",
}) => {
  const stats = {
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
    total: requests.length,
  };

  const totalAmount = requests.reduce((sum, r) => {
    const amount = typeof r.amount === "string" ? parseFloat(r.amount) : r.amount;
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  const approvedAmount = requests
    .filter((r) => r.status === "approved")
    .reduce((sum, r) => {
      const amount = typeof r.amount === "string" ? parseFloat(r.amount) : r.amount;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const cards = [
    {
      title: "Pending Requests",
      value: stats.pending,
      subtitle: "Awaiting approval",
      color: "yellow",
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      filter: "pending" as const,
    },
    {
      title: "Approved Requests",
      value: stats.approved,
      subtitle: formatCurrency(approvedAmount),
      color: "green",
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      filter: "approved" as const,
    },
    {
      title: "Rejected Requests",
      value: stats.rejected,
      subtitle: "Not approved",
      color: "red",
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      filter: "rejected" as const,
    },
  ];

  const colorClasses = {
    yellow: {
      bg: "bg-gradient-to-br from-yellow-50 to-amber-50",
      border: "border-yellow-200",
      icon: "text-yellow-600",
      value: "text-yellow-700",
      title: "text-yellow-900",
      subtitle: "text-yellow-600",
      hover: "hover:from-yellow-100 hover:to-amber-100",
    },
    green: {
      bg: "bg-gradient-to-br from-green-50 to-emerald-50",
      border: "border-green-200",
      icon: "text-green-600",
      value: "text-green-700",
      title: "text-green-900",
      subtitle: "text-green-600",
      hover: "hover:from-green-100 hover:to-emerald-100",
    },
    red: {
      bg: "bg-gradient-to-br from-red-50 to-rose-50",
      border: "border-red-200",
      icon: "text-red-600",
      value: "text-red-700",
      title: "text-red-900",
      subtitle: "text-red-600",
      hover: "hover:from-red-100 hover:to-rose-100",
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {cards.map((card) => {
        const colors = colorClasses[card.color as keyof typeof colorClasses];
        const isActive = activeFilter === card.filter;
        return (
          <div
            key={card.filter}
            onClick={() => onFilterChange?.(card.filter)}
            className={`${colors.bg} ${colors.border} border-2 rounded-xl p-6 shadow-sm transition-all duration-200 ${
              onFilterChange ? "cursor-pointer" : ""
            } ${isActive ? "ring-2 ring-purple-500 ring-offset-2" : ""} ${
              onFilterChange ? colors.hover : ""
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className={`text-sm font-medium ${colors.subtitle} mb-1`}>
                  {card.title}
                </p>
                <p className={`text-3xl font-bold ${colors.value} mb-2`}>
                  {card.value}
                </p>
                <p className={`text-xs font-medium ${colors.subtitle}`}>
                  {card.subtitle}
                </p>
              </div>
              <div className={`${colors.icon} opacity-80`}>{card.icon}</div>
            </div>
            {isActive && (
              <div className="mt-4 pt-4 border-t border-current border-opacity-20">
                <p className="text-xs font-semibold text-current">
                  Currently viewing
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AnalyticsCards;

