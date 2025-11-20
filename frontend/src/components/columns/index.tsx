import { ColumnDef } from "@tanstack/react-table";
import { PurchaseRequest } from "../../services/api";

export const approverColumns = (
  formatCurrency: (v: any) => string,
  formatDate: (v: string | undefined) => string,
  onView: (r: PurchaseRequest) => void
): ColumnDef<PurchaseRequest>[] => [
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => formatCurrency(row.original.amount),
  },
  {
    header: "Created By",
    accessorFn: (r) => r.created_by?.username,
  },
  {
    header: "Created",
    accessorKey: "created_at",
    cell: ({ getValue }) => formatDate(getValue() as string),
  },
  {
    header: "Actions",
    cell: ({ row }) => (
      <button
        className="text-purple-600 hover:text-purple-900 font-medium"
        onClick={() => onView(row.original)}
      >
        View
      </button>
    ),
  },
];


export const financeColumns = (
  formatCurrency: (v: any) => string,
  formatDate: (v: string | undefined) => string,
  onView: (r: PurchaseRequest) => void
): ColumnDef<PurchaseRequest>[] => [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ getValue }) => (
      <span className="font-medium text-gray-900">{getValue() as string}</span>
    ),
  },

  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => formatCurrency(row.original.amount),
  },

  {
    header: "Status",
    accessorKey: "status",
    cell: ({ getValue }) => {
      const status = (getValue() as string) || "";
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            status === "approved"
              ? "bg-green-100 text-green-800"
              : status === "rejected"
              ? "bg-red-100 text-red-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {status.toUpperCase()}
        </span>
      );
    },
  },

  {
    header: "Created By",
    accessorFn: (r) => r.created_by?.username,
  },

  {
    header: "Created",
    accessorKey: "created_at",
    cell: ({ getValue }) => formatDate(getValue() as string),
  },

  {
    header: "Actions",
    cell: ({ row }) => (
      <button
        className="text-purple-600 hover:text-purple-900 font-medium"
        onClick={() => onView(row.original)}
      >
        View
      </button>
    ),
  },
];

export const requestListColumns = (
  formatCurrency: (v: any) => string,
  formatDate: (v: any) => string,
  onSelect: (r: PurchaseRequest) => void
): ColumnDef<PurchaseRequest>[] => [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ getValue }) => (
      <span className="font-medium text-gray-900">{getValue() as string}</span>
    ),
  },

  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => formatCurrency(row.original.amount),
  },

  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const status = getValue() as string;

      const classes = {
        pending: "bg-yellow-100 text-yellow-800",
        approved: "bg-green-100 text-green-800",
        rejected: "bg-red-100 text-red-800",
      };

      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${
            classes[status as keyof typeof classes] || "bg-gray-100 text-gray-800"
          }`}
        >
          {status}
        </span>
      );
    },
  },

  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ getValue }) => formatDate(getValue() as string),
  },

  {
    header: "Actions",
    cell: ({ row }) => (
      <button
        onClick={() => onSelect(row.original)}
        className="text-purple-600 hover:text-purple-900 font-medium"
      >
        View
      </button>
    ),
  },
];

export interface RequestItem {
  description: string;
  quantity: number;
  unit_price: number;
  total_price?: number;
}

export const itemsColumns: ColumnDef<RequestItem>[] = [
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <span className="text-gray-900">{row.original.description}</span>
    ),
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ row }) => (
      <span className="text-gray-700">{row.original.quantity}</span>
    ),
  },
  {
    accessorKey: "unit_price",
    header: "Unit Price",
    cell: ({ row }) => {
      const amount = row.original.unit_price;
      return (
        <span className="text-gray-700">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(amount)}
        </span>
      );
    },
  },
  {
    accessorKey: "total_price",
    header: "Total",
    cell: ({ row }) => {
      const item = row.original;
      const total = item.total_price || item.quantity * item.unit_price;
      return (
        <span className="font-semibold text-gray-900">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(total)}
        </span>
      );
    },
  },
];