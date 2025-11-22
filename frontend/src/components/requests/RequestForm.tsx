import React, { useState, useRef } from "react";
import { requestsAPI, documentsAPI, PurchaseRequest, RequestItem } from "../../services/api";

interface RequestFormProps {
  onClose: () => void;
  onSuccess: () => void;
  initialData?: PurchaseRequest;
}

// Form-specific item type that allows strings for inputs
interface FormItem {
  description: string;
  quantity: number | string;
  unit_price: number | string;
}

const RequestForm: React.FC<RequestFormProps> = ({
  onClose,
  onSuccess,
  initialData,
}) => {
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    amount: string;
    items: FormItem[];
  }>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    amount: initialData?.amount || "",
    items: initialData?.items?.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
    })) || [{ description: "", quantity: 1, unit_price: "" }],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [proformaFile, setProformaFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleItemChange = (
    index: number,
    field: keyof FormItem,
    value: string | number
  ) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { description: "", quantity: 1, unit_price: "" },
      ],
    });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => {
      const qty =
        typeof item.quantity === "number"
          ? item.quantity
          : parseFloat(String(item.quantity)) || 0;
      const price =
        typeof item.unit_price === "number"
          ? item.unit_price
          : parseFloat(String(item.unit_price)) || 0;
      return sum + qty * price;
    }, 0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProformaFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setProformaFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = {
        title: formData.title,
        description: formData.description,
        amount: calculateTotal() || parseFloat(formData.amount) || 0,
        items: formData.items
          .filter((item) => item.description && item.unit_price)
          .map(
            (item): RequestItem => ({
              description: item.description,
              quantity:
                typeof item.quantity === "number"
                  ? item.quantity
                  : parseFloat(String(item.quantity)) || 1,
              unit_price:
                typeof item.unit_price === "number"
                  ? item.unit_price
                  : parseFloat(String(item.unit_price)) || 0,
            })
          ),
      };

      let requestId: number;
      if (initialData) {
        await requestsAPI.update(initialData.id, data);
        requestId = initialData.id;
      } else {
        const response = await requestsAPI.create(data);
        requestId = response.data.id;
      }

      // Upload proforma if file is selected
      if (proformaFile && !initialData) {
        try {
          await documentsAPI.uploadProforma(requestId, proformaFile);
        } catch (uploadError: any) {
          console.error("Proforma upload error:", uploadError);
          // Don't fail the entire request if proforma upload fails
          setError(
            "Request created successfully, but proforma upload failed. You can upload it later."
          );
        }
      }

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Minimal Header */}
        <div className="px-8 py-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                {initialData ? "Edit Request" : "New Request"}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {initialData
                  ? "Update your purchase request"
                  : "Create a new purchase request"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Title Field */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                placeholder="Enter request title"
              />
            </div>

            {/* Description Field */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors resize-none"
                placeholder="Describe your purchase request..."
              />
            </div>

            {/* Items Section */}
            <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-gray-700 text-sm font-medium">
                  Items
                </label>
                <button
                  type="button"
                  onClick={addItem}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  + Add Item
                </button>
              </div>

              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg p-4 border border-gray-200"
                  >
                    <div className="grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-5">
                        <input
                          type="text"
                          placeholder="Item description"
                          value={item.description}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "quantity",
                              parseInt(e.target.value) || 1
                            )
                          }
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors text-sm"
                        />
                      </div>
                      <div className="col-span-3">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                            $
                          </span>
                          <input
                            type="number"
                            placeholder="0.00"
                            value={item.unit_price}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "unit_price",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            step="0.01"
                            min="0"
                            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors text-sm"
                          />
                        </div>
                      </div>
                      <div className="col-span-1">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="w-full h-10 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Amount Field */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Total Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  name="amount"
                  value={calculateTotal() || formData.amount}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  required
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors font-medium"
                  placeholder="0.00"
                />
              </div>
              {calculateTotal() > 0 && (
                <p className="mt-2 text-xs text-gray-500">
                  Calculated from items: ${calculateTotal().toFixed(2)}
                </p>
              )}
            </div>

            {/* Proforma Upload Field (only for new requests) */}
            {!initialData && (
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Proforma Invoice <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <div className="space-y-3">
                  {!proformaFile ? (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg
                          className="w-10 h-10 mb-3 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold text-purple-600">Click to upload</span> or
                          drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PDF, PNG, JPG (MAX. 10MB)
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleFileChange}
                      />
                    </label>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-shrink-0">
                          <svg
                            className="w-8 h-8 text-purple-600"
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
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {proformaFile.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(proformaFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="ml-3 text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        aria-label="Remove file"
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    You can upload the proforma invoice now or later when viewing the request.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </>
              ) : initialData ? (
                "Update"
              ) : (
                "Create"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestForm;
