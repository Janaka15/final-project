import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { bookingsApi } from "@/services/api";
import { formatLKR, formatDate } from "@/lib/utils";

const STATUS_VARIANT: Record<string, any> = {
  CONFIRMED: "success",
  PENDING: "warning",
  CANCELLED: "destructive",
  COMPLETED: "secondary",
};

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const load = () => {
    bookingsApi
      .myBookings()
      .then((res) => setBookings(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCancel = async (id: number) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setCancellingId(id);
    try {
      await bookingsApi.cancel(id);
      load();
    } catch (e: any) {
      alert(e?.response?.data?.detail || "Failed to cancel.");
    } finally {
      setCancellingId(null);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">My Bookings</h1>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0ea5e9]" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 mb-4">You have no bookings yet.</p>
            <Button asChild>
              <Link to="/rooms">Browse Rooms</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <Card key={b.id}>
                <CardContent className="pt-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-sm font-bold text-[#0ea5e9]">
                          #{b.confirmation_code}
                        </span>
                        <Badge variant={STATUS_VARIANT[b.status] || "secondary"}>
                          {b.status}
                        </Badge>
                      </div>
                      <p className="font-semibold text-slate-900">Room Type #{b.room_type_id}</p>
                      <p className="text-sm text-slate-500">
                        {formatDate(b.check_in)} → {formatDate(b.check_out)} ·{" "}
                        {b.guests} guest{b.guests !== 1 ? "s" : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[#0ea5e9]">
                        {formatLKR(b.total_price)}
                      </span>

                      {b.status === "CONFIRMED" && b.check_in > today && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancel(b.id)}
                          disabled={cancellingId === b.id}
                        >
                          {cancellingId === b.id ? "Cancelling…" : "Cancel"}
                        </Button>
                      )}

                      {b.status === "COMPLETED" && (
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/feedback/${b.id}`}>Leave Feedback</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
