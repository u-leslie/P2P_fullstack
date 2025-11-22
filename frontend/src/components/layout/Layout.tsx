import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import LogoutModal from "../modals/LogoutModal";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    setShowLogoutModal(false);
    toast.success("Logged out successfully", {
      description: "You have been logged out of your account.",
    });
    navigate("/login");
  };

  const getRoleDisplay = (role?: string) => {
    const roleMap: Record<string, string> = {
      staff: "Staff",
      approver_level_1: "Approver Level 1",
      approver_level_2: "Approver Level 2",
      finance: "Finance",
    };
    return roleMap[role || ""] || role || "User";
  };

  const getRoleBadgeColor = (role?: string) => {
    const colorMap: Record<string, string> = {
      staff: "bg-blue-100 text-blue-800",
      approver_level_1: "bg-purple-100 text-purple-800",
      approver_level_2: "bg-indigo-100 text-indigo-800",
      finance: "bg-green-100 text-green-800",
    };
    return colorMap[role || ""] || "bg-gray-100 text-gray-800";
  };

  const getUserDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user?.first_name) {
      return user.first_name;
    }
    return user?.username || "User";
  };

  const getUserInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user?.first_name) {
      return user.first_name[0].toUpperCase();
    }
    return (user?.username?.[0] || "U").toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              {/* Unique P2P logo - stylized P with arrow, no background */}
              <svg
                className="w-10 h-10 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {/* Stylized P shape */}
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M6 4h6a4 4 0 014 4v0a4 4 0 01-4 4H6V4z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M6 4v16"
                />
                {/* Arrow representing "to Pay" flow */}
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M16 8l4 4-4 4"
                />
              </svg>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                  Procure to Pay
                </h1>
                <p className="text-xs text-gray-500 -mt-0.5 font-medium">
                  Procurement Management System
                </p>
              </div>
            </div>

            {/* User Info and Actions */}
            <div className="flex items-center gap-3">
              {/* User Profile Section */}
              <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors cursor-default">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-semibold text-sm border-2 border-purple-200">
                  {getUserInitials()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900 leading-tight">
                    {getUserDisplayName()}
                  </p>
                  <p className="text-xs text-gray-500 leading-tight">
                    {getRoleDisplay(user?.role)}
                  </p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogoutClick}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 hover:border-gray-300"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
        userName={getUserDisplayName()}
      />
    </div>
  );
};

export default Layout;
