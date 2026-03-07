import { useState, useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/services/api";
import { formatLKR, formatDate } from "@/lib/utils";

const STATUSES = ["ALL", "CONFIRMED", "PENDING", "CANCELLED", "COMPLETED"];

const STATUS_VARIANT: Record<string, any> = {
  CONFIRMED: "success",
  PENDING: "warning",
  CANCELLED: "destructive",
  COMPLETED: "secondary",
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  const load = (status?: string) => {
    setLoading(true);
    adminApi.bookings
      .list(status === "ALL" ? undefined : status)
      .then((res) => setBookings(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const handleFilter = (s: string) => {
    setFilter(s);
    load(s === "ALL" ? undefined : s);
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    setUpdating(id);
    try {
      await adminApi.bookings.update(id, newStatus);
      load(filter === "ALL" ? undefined : filter);
    } catch (e: any) {
      alert(e?.response?.data?.detail || "Update failed.");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />

      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Bookings Management</h1>
            <p className="text-slate-500 text-sm">View and update all reservations</p>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {STATUSES.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={filter === s ? "default" : "outline"}
                onClick={() => handleFilter(s)}
              >
                {s}
              </Button>
            ))}
          </div>

          <Card>
            <CardContent className="pt-0">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0ea5e9]" />
                </div>
              ) : bookings.length === 0 ? (
                <p className="text-center text-slate-500 py-12">No bookings found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Code</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Guest</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Room</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Dates</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono text-xs text-[#0ea5e9]">
                            {b.confirmation_code}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-medium">{b.user_name}</p>
                            <p className="text-slate-400 text-xs">{b.user_email}</p>
                          </td>
                          <td className="py-3 px-4">{b.room_type_name}</td>
                          <td className="py-3 px-4 text-slate-600">
                            {formatDate(b.check_in)} → {formatDate(b.check_out)}
                          </td>
                          <td className="py-3 px-4 font-medium">
                            {b.total_price ? formatLKR(b.total_price) : "—"}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={STATUS_VARIANT[b.status] || "secondary"}>
                              {b.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <select
                              className="text-xs border border-slate-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]"
                              value={b.status}
                              onChange={(e) => handleStatusChange(b.id, e.target.value)}
                              disabled={updating === b.id}
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="CONFIRMED">CONFIRMED</option>
                              <option value="COMPLETED">COMPLETED</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
