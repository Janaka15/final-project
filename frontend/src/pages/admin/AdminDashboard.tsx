import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminSidebar from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminApi } from "@/services/api";
import { formatLKR } from "@/lib/utils";

interface KPIs {
  todays_occupancy_pct: number;
  revenue_mtd: number;
  active_bookings: number;
  checkins_today: number;
}

export default function AdminDashboard() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.analytics
      .kpis()
      .then((res) => setKpis(res.data))
      .finally(() => setLoading(false));
  }, []);

  const KPI_CARDS = kpis
    ? [
        {
          label: "Today's Occupancy",
          value: `${kpis.todays_occupancy_pct}%`,
          icon: "🏨",
          color: "text-[#0ea5e9]",
        },
        {
          label: "Revenue (MTD)",
          value: formatLKR(kpis.revenue_mtd),
          icon: "💰",
          color: "text-emerald-600",
        },
        {
          label: "Active Bookings",
          value: kpis.active_bookings.toString(),
          icon: "📋",
          color: "text-violet-600",
        },
        {
          label: "Check-ins Today",
          value: kpis.checkins_today.toString(),
          icon: "🔑",
          color: "text-amber-600",
        },
      ]
    : [];

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />

      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
            <p className="text-slate-500 text-sm mt-1">
              Somerset Mirissa Beach Hotel — {new Date().toLocaleDateString("en-GB", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0ea5e9]" />
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {KPI_CARDS.map((card) => (
                  <Card key={card.label}>
                    <CardContent className="pt-5">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{card.icon}</span>
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide">
                            {card.label}
                          </p>
                          <p className={`text-2xl font-bold ${card.color}`}>
                            {card.value}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Quick nav cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { to: "/admin/predictions", title: "Occupancy Forecast", desc: "30-day AI prediction", icon: "🔮" },
                  { to: "/admin/analytics", title: "Analytics", desc: "Revenue, heatmap, seasonal trends", icon: "📈" },
                  { to: "/admin/bookings", title: "Manage Bookings", desc: "Update booking statuses", icon: "📋" },
                  { to: "/admin/rooms", title: "Room Management", desc: "Edit room types & pricing", icon: "🛏️" },
                  { to: "/admin/customers", title: "Customers", desc: "Guest directory & history", icon: "👥" },
                ].map((item) => (
                  <Link key={item.to} to={item.to}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="pt-5 flex items-start gap-4">
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                          <p className="font-semibold text-slate-900">{item.title}</p>
                          <p className="text-sm text-slate-500">{item.desc}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
