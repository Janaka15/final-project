import { useState, useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/services/api";
import { formatLKR } from "@/lib/utils";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

export default function AdminAnalytics() {
  const [revenuePeriod, setRevenuePeriod] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [heatmapYear, setHeatmapYear] = useState(2025);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [seasonalData, setSeasonalData] = useState<any[]>([]);
  const [utilData, setUtilData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRevenue = (period: "daily" | "weekly" | "monthly") => {
    adminApi.analytics.revenue(period).then((res) => setRevenueData(res.data));
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      adminApi.analytics.revenue(revenuePeriod),
      adminApi.analytics.heatmap(heatmapYear),
      adminApi.analytics.seasonal(),
      adminApi.analytics.roomUtilization(),
    ])
      .then(([rev, heat, seas, util]) => {
        setRevenueData(rev.data);
        setHeatmapData(heat.data);
        setSeasonalData(seas.data);
        setUtilData(util.data);
      })
      .finally(() => setLoading(false));
  }, [heatmapYear]);

  const handlePeriodChange = (p: "daily" | "weekly" | "monthly") => {
    setRevenuePeriod(p);
    loadRevenue(p);
  };

  // Build heatmap grid: months × weeks
  const heatmapGrid = Array.from({ length: 12 }, (_, m) => {
    return heatmapData.filter((d) => new Date(d.date).getMonth() === m);
  });

  const maxOcc = Math.max(...heatmapData.map((d) => d.occupancy_rate), 1);

  const cellColor = (rate: number) => {
    const intensity = rate / maxOcc;
    if (intensity >= 0.95) return "#0369a1";
    if (intensity >= 0.85) return "#0ea5e9";
    if (intensity >= 0.75) return "#7dd3fc";
    if (intensity >= 0.65) return "#bae6fd";
    return "#e0f2fe";
  };

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />

      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
            <p className="text-slate-500 text-sm">Historical data from occupancy records</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0ea5e9]" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Revenue Trend */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Revenue Trend</CardTitle>
                    <div className="flex gap-2">
                      {(["daily", "weekly", "monthly"] as const).map((p) => (
                        <Button
                          key={p}
                          size="sm"
                          variant={revenuePeriod === p ? "default" : "outline"}
                          onClick={() => handlePeriodChange(p)}
                        >
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={revenueData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="period" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                      <YAxis
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip formatter={(v: number) => formatLKR(v)} />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#0ea5e9"
                        strokeWidth={2}
                        dot={false}
                        name="Revenue"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Occupancy Heatmap */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Occupancy Heatmap {heatmapYear}</CardTitle>
                    <div className="flex gap-2">
                      {[2023, 2024, 2025].map((y) => (
                        <Button
                          key={y}
                          size="sm"
                          variant={heatmapYear === y ? "default" : "outline"}
                          onClick={() => setHeatmapYear(y)}
                        >
                          {y}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <div className="flex gap-1 min-w-max">
                      {heatmapGrid.map((monthDays, mi) => (
                        <div key={mi}>
                          <p className="text-xs text-slate-500 text-center mb-1">{MONTHS[mi]}</p>
                          <div className="flex flex-col gap-0.5">
                            {monthDays.slice(0, 31).map((d: any) => (
                              <div
                                key={d.date}
                                className="w-4 h-4 rounded-sm"
                                style={{ backgroundColor: cellColor(d.occupancy_rate) }}
                                title={`${d.date}: ${(d.occupancy_rate * 100).toFixed(0)}%`}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Legend */}
                    <div className="flex items-center gap-3 mt-4 text-xs text-slate-500">
                      <span>Low</span>
                      {["#e0f2fe", "#bae6fd", "#7dd3fc", "#0ea5e9", "#0369a1"].map((c) => (
                        <div key={c} className="w-5 h-4 rounded-sm" style={{ backgroundColor: c }} />
                      ))}
                      <span>High</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Seasonal & Utilization side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Seasonal Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Seasonal Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart
                        data={seasonalData}
                        margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month_name" tick={{ fontSize: 11 }} />
                        <YAxis
                          domain={[0, 1]}
                          tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip
                          formatter={(v: number) => [`${(v * 100).toFixed(1)}%`, "Avg Occupancy"]}
                        />
                        <Bar
                          dataKey="avg_occupancy_rate"
                          fill="#0ea5e9"
                          radius={[4, 4, 0, 0]}
                          name="Avg Occupancy"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Room Utilization */}
                <Card>
                  <CardHeader>
                    <CardTitle>Room Utilization (This Month)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart
                        data={utilData}
                        margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="room_type" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="booked_nights" fill="#0ea5e9" name="Booked Nights" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="available_nights" fill="#e2e8f0" name="Available Nights" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2">
                      {utilData.map((u: any) => (
                        <div key={u.room_type} className="flex justify-between text-sm">
                          <span className="text-slate-600">{u.room_type}</span>
                          <span className="font-medium text-[#0ea5e9]">
                            {(u.utilization_rate * 100).toFixed(1)}% utilised
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
