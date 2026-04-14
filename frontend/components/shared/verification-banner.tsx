"use client";

import { useMemo, useState } from "react";
import { User } from "@/lib/types";
import { authApi } from "@/lib/api/endpoints";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react";

export function VerificationBanner({ user }: { user: User | null | undefined }) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ verification_type: "individual", phone: "" });
  const [error, setError] = useState("");
  const cleanedPhone = useMemo(() => formData.phone.replace(/[^\d+]/g, ""), [formData.phone]);

  if (!user) return null;

  if (user.verification_status === "verified") {
    return (
      <div className="flex items-center gap-2 mb-6 text-brand-600 bg-brand-50 px-4 py-2 rounded-lg border border-brand-100">
        <CheckCircle2 className="h-5 w-5" />
        <span className="font-medium text-sm">✓ Баталгаажсан</span>
      </div>
    );
  }

  if (user.verification_status === "pending") {
    return (
      <div className="flex items-center gap-2 mb-6 text-blue-600 bg-blue-50 px-4 py-3 rounded-lg border border-blue-100">
        <Clock className="h-5 w-5" />
        <span className="font-medium text-sm">Хянагдаж байна… (Тайлангийн хариуг хүлээнэ үү)</span>
      </div>
    );
  }

  if (user.verification_status === "suspended") {
    return (
      <div className="flex items-center gap-2 mb-6 text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-100">
        <XCircle className="h-5 w-5" />
        <div>
          <span className="font-medium text-sm block">Данс түр хаагдсан</span>
          {user.rejection_reason && <span className="text-xs mt-1 block">Шалтгаан: {user.rejection_reason}</span>}
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanedPhone.trim()) {
      setError("Утасны дугаараа оруулна уу.");
      return;
    }
    try {
      setIsSubmitting(true);
      setError("");
      await authApi.submitVerification({ ...formData, phone: cleanedPhone });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    } catch (err: any) {
      const payload = err?.response?.data;
      const detail =
        payload?.detail ||
        payload?.phone?.[0] ||
        payload?.non_field_errors?.[0] ||
        err?.message ||
        "Алдаа гарлаа. Дахин оролдоно уу.";
      setError(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mb-6 bg-accent-50 border border-accent-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-accent-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-accent-900 mb-1">Дансаа баталгаажуулна уу</h3>
          <p className="text-sm text-accent-700 mb-3">
            {user.rejection_reason && <strong className="block text-red-600 mb-2">Татгалзсан шалтгаан: {user.rejection_reason}</strong>}
            Аюулгүй гүйлгээ хийхийн тулд дансаа баталгаажуулах шаардлагатай.
          </p>
          
          <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs font-medium text-surface-700">Төрөл</label>
              <select
                value={formData.verification_type}
                onChange={(e) => setFormData({ ...formData, verification_type: e.target.value })}
                className="w-full text-sm rounded-md border-surface-300 bg-white py-1.5 px-3 focus:ring-brand-500 focus:border-brand-500"
              >
                <option value="individual">Хувь хүн</option>
                <option value="business">Байгууллага</option>
              </select>
            </div>
            
            <div className="space-y-1 min-w-[200px]">
              <label className="text-xs font-medium text-surface-700">Утасны дугаар</label>
              <input
                type="text"
                placeholder="99001234"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full text-sm rounded-md border-surface-300 bg-white py-1.5 px-3 focus:ring-brand-500 focus:border-brand-500"
              />
              <p className="text-[11px] text-surface-500">8-15 оронтой дугаар оруулна уу. Жишээ: +97699112233</p>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-brand-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50"
            >
              {isSubmitting ? "Илгээж байна..." : "Илгээх"}
            </button>
          </form>
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}
