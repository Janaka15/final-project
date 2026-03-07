import { useState, useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminApi } from "@/services/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";

interface Forecast {
  date: string;
  predicted_occupancy: number;
  confidence_lower?: number;
  confidence_upper?: number;
}

export default function AdminPredictions() {
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [modelName, setModelName] = useState("");
  const [avgOccupancy, setAvgOccupancy] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi
      .predictions(30)
      .then((res) => {
        setForecasts(res.data.forecasts);
        setModelName(res.data.model_name);
        setAvgOccupancy(res.data.avg_predicted_occupancy);
      })
      .catch((e) => {
        setError(e?.response?.data?.detail || "Model not available yet. Run the ML notebooks first.");
      })
      .finally(() => setLoading(false));
  }, []);

  const chartData = forecasts.map((f) => ({
    date: new Date(f.date).toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
    occupancy: +(f.predicted_occupancy * 100).toFixed(1),
    lower: f.confidence_lower != null ? +(f.confidence_lower * 100).toFixed(1) : undefined,
    upper: f.confidence_upper != null ? +(f.confidence_upper * 100).toFixed(1) : undefined,
  }));

  const peakDays = forecasts.filter((f) => f.predicted_occupancy >= 0.9).length;
  const lowDays = forecasts.filter((f) => f.predicted_occupancy < 0.8).length;

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />

      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Occupancy Forecast</h1>
            <p className="text-slate-500 text-sm mt-1">
              30-day AI prediction{modelName ? ` · Model: ${modelName.toUpperCase()}` : ""}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0ea5e9]" />
            </div>
          ) : error ? (
            <Card>
              <CardContent className="pt-6 text-center py-16">
                <p className="text-slate-500 text-lg mb-2">Prediction model unavailable</p>
                <p className="text-sm text-slate-400">{error}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-5">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Avg Predicted</p>
                    <p className="text-3xl font-bold text-[#0ea5e9]">
                      {(avgOccupancy * 100).toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-5">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Peak Days (≥90%)</p>
                    <p className="text-3xl font-bold text-amber-600">{peakDays}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-5">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Low Days (&lt;80%)</p>
                    <p className="text-3xl font-bold text-slate-600">{lowDays}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>30-Day Occupancy Forecast</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={360}>
                    <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <defs>
                        <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        interval={4}
                      />
                      <YAxis
                        domain={[50, 100]}
                        tickFormatter={(v) => `${v}%`}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip
                        formatter={(val: number, name: string) => [
                          `${val}%`,
                          name === "occupancy"
                            ? "Predicted"
                            : name === "upper"
                            ? "Upper bound"
                            : "Lower bound",
                        ]}
                      />
                      <ReferenceLine y={90} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "90%", fontSize: 10 }} />
                      <ReferenceLine y={80} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: "80%", fontSize: 10 }} />
                      {chartData[0]?.upper != null && (
                        <Area
                          type="monotone"
                          dataKey="upper"
                          stroke="none"
                          fill="#bfdbfe"
                          fillOpacity={0.3}
                        />
                      )}
                      {chartData[0]?.lower != null && (
                        <Area
                          type="monotone"
                          dataKey="lower"
                          stroke="none"
                          fill="white"
                          fillOpacity={1}
                        />
                      )}
                      <Area
                        type="monotone"
                        dataKey="occupancy"
                        stroke="#0ea5e9"
                        strokeWidth={2.5}
                        fill="url(#colorOccupancy)"
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
