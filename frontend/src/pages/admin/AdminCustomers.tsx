import { useState, useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/services/api";
import { formatLKR, formatDate } from "@/lib/utils";
import { Star } from "lucide-react";

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [tab, setTab] = useState<"customers" | "feedback">("customers");

  const loadCustomers = (q?: string) => {
    setLoading(true);
    adminApi.customers
      .list(q)
      .then((res) => setCustomers(res.data))
      .finally(() => setLoading(false));
  };

  const loadFeedback = () => {
    adminApi.customers.feedback().then((res) => setFeedback(res.data));
  };

  useEffect(() => {
    loadCustomers();
    loadFeedback();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadCustomers(search || undefined);
  };

  const viewBookings = async (user: any) => {
    setSelectedUser(user);
    setBookingsLoading(true);
    adminApi.customers
      .bookings(user.id)
      .then((res) => setUserBookings(res.data))
      .finally(() => setBookingsLoading(false));
  };

  const avgRating =
    feedback.length > 0
      ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1)
      : "—";

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />

      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
            <p className="text-slate-500 text-sm">Guest directory and feedback</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={tab === "customers" ? "default" : "outline"}
              size="sm"
              onClick={() => setTab("customers")}
            >
              Customers
            </Button>
            <Button
              variant={tab === "feedback" ? "default" : "outline"}
              size="sm"
              onClick={() => setTab("feedback")}
            >
              Feedback {feedback.length > 0 && `(${feedback.length})`}
            </Button>
          </div>

          {tab === "customers" && (
            <>
              {/* Search */}
              <form onSubmit={handleSearch} className="flex gap-2 mb-6 max-w-md">
                <Input
                  placeholder="Search by name or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Button type="submit">Search</Button>
              </form>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Customer list */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardContent className="pt-0">
                      {loading ? (
                        <div className="flex justify-center py-10">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0ea5e9]" />
                        </div>
                      ) : customers.length === 0 ? (
                        <p className="text-center text-slate-500 py-10">No customers found.</p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Name</th>
                              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Email</th>
                              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Joined</th>
                              <th className="py-3 px-4"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {customers.map((c) => (
                              <tr
                                key={c.id}
                                className={`border-b border-slate-100 hover:bg-slate-50 ${
                                  selectedUser?.id === c.id ? "bg-blue-50" : ""
                                }`}
                              >
                                <td className="py-3 px-4 font-medium">{c.name}</td>
                                <td className="py-3 px-4 text-slate-500">{c.email}</td>
                                <td className="py-3 px-4 text-slate-500">
                                  {c.created_at
                                    ? new Date(c.created_at).toLocaleDateString("en-GB")
                                    : "—"}
                                </td>
                                <td className="py-3 px-4">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => viewBookings(c)}
                                  >
                                    Bookings
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Booking history panel */}
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        {selectedUser ? `${selectedUser.name}'s Bookings` : "Select a customer"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {!selectedUser ? (
                        <p className="text-sm text-slate-400">Click "Bookings" to view history.</p>
                      ) : bookingsLoading ? (
                        <div className="flex justify-center py-6">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#0ea5e9]" />
                        </div>
                      ) : userBookings.length === 0 ? (
                        <p className="text-sm text-slate-400">No bookings yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {userBookings.map((b: any) => (
                            <div key={b.id} className="border border-slate-200 rounded-lg p-3 text-sm">
                              <div className="flex justify-between items-start">
                                <p className="font-medium">{b.room_type_name}</p>
                                <Badge
                                  variant={
                                    b.status === "CONFIRMED"
                                      ? "success"
                                      : b.status === "CANCELLED"
                                      ? "destructive"
                                      : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {b.status}
                                </Badge>
                              </div>
                              <p className="text-slate-500 mt-1">
                                {formatDate(b.check_in)} → {formatDate(b.check_out)}
                              </p>
                              {b.total_price && (
                                <p className="text-[#0ea5e9] font-medium mt-1">
                                  {formatLKR(b.total_price)}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}

          {tab === "feedback" && (
            <>
              {/* Avg rating card */}
              <div className="mb-6">
                <Card className="inline-block">
                  <CardContent className="pt-4 pb-4 px-6">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Average Rating</p>
                    <p className="text-4xl font-bold text-[#0ea5e9]">
                      {avgRating}
                      <span className="text-lg font-normal text-slate-400">/5</span>
                    </p>
                    <p className="text-sm text-slate-500">{feedback.length} reviews</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="pt-0">
                  {feedback.length === 0 ? (
                    <p className="text-center text-slate-500 py-10">No feedback yet.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Guest</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Room</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Rating</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Comment</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {feedback.map((f: any) => (
                          <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 font-medium">{f.user_name}</td>
                            <td className="py-3 px-4 text-slate-600">{f.room_type_name}</td>
                            <td className="py-3 px-4">
                              <span className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className="w-3.5 h-3.5"
                                    fill={s <= f.rating ? "#f59e0b" : "none"}
                                    stroke={s <= f.rating ? "#f59e0b" : "#94a3b8"}
                                  />
                                ))}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 max-w-xs">
                              {f.comment || <span className="text-slate-300 italic">No comment</span>}
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              {new Date(f.created_at).toLocaleDateString("en-GB")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
