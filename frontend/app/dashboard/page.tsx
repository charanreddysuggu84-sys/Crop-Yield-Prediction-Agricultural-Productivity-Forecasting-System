"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Navbar from "../../components/Navbar";
import { getDashboardSummary, DashboardSummary } from "../../services/dashboardApi";
import { downloadPredictionsCsv } from "../../services/reportsApi";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    getDashboardSummary()
      .then(setData)
      .catch((err) => setError(err.message || "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadPredictionsCsv();
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <Navbar />
      <div className="page">
        <h1>Farm Dashboard</h1>
        <p className="subtitle">Your yield predictions and performance at a glance.</p>

        <button className="downloadBtn" onClick={handleDownload} disabled={downloading}>
          {downloading ? "Preparing download..." : "⬇ Download Report (CSV)"}
        </button>

        {loading && (
          <div className="card skeleton">
            <div className="skel-line skel-label" />
            <div className="skel-line skel-chart" />
          </div>
        )}

        {!loading && error && (
          <div className="card">
            <p className="error">{error}</p>
          </div>
        )}

        {!loading && !error && data && data.yield_trend.length === 0 && (
          <div className="card">
            <p className="empty">
              Not enough data yet. Make a prediction on the{" "}
              <a href="/predict" className="link">Predict Yield</a> page to see it show up here.
            </p>
          </div>
        )}

        {!loading && !error && data && data.yield_trend.length > 0 && (
          <>
            <div className="card score-card">
              <p className="label">Productivity Score</p>
              <p className="score">{data.productivity_score}%</p>
              <p className="sub">
                Latest prediction compared to your average across all past predictions.
              </p>
            </div>

            <div className="card">
              <p className="label">Yield Trend</p>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={data.yield_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="season" stroke="#6b7280" fontSize={13} />
                  <YAxis stroke="#6b7280" fontSize={13} />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: "1px solid #d1d5db", fontSize: 13 }}
                    formatter={(value: number) => [`${value.toLocaleString()} kg/ha`, "Yield"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="yield"
                    stroke="#15803d"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#15803d" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {data.crop_comparison.length > 1 && (
              <div className="card">
                <p className="label">Crop Comparison</p>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.crop_comparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={13} />
                    <YAxis stroke="#6b7280" fontSize={13} />
                    <Tooltip
                      contentStyle={{ borderRadius: 10, border: "1px solid #d1d5db", fontSize: 13 }}
                      formatter={(value: number) => [`${value.toLocaleString()} kg/ha`, "Avg Yield"]}
                    />
                    <Bar dataKey="yield" fill="#15803d" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {data.crop_comparison.length === 1 && (
              <div className="card">
                <p className="label">Crop Comparison</p>
                <p className="empty">
                  Predict yield for a second crop type to unlock the comparison chart.
                </p>
              </div>
            )}
          </>
        )}

        <style jsx>{`
          .page { max-width: 800px; margin: 0 auto; padding: 40px 24px; }
          h1 { font-size: 28px; font-weight: 800; color: #14532d; margin-bottom: 4px; }
          .subtitle { color: #6b7280; margin-bottom: 16px; }
          .downloadBtn {
            background: white;
            color: #15803d;
            border: 1.5px solid #15803d;
            padding: 10px 18px;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            margin-bottom: 24px;
          }
          .downloadBtn:hover { background: #f0fdf4; }
          .downloadBtn:disabled { opacity: 0.6; cursor: not-allowed; }
          .card {
            background: white;
            border-radius: 16px;
            padding: 28px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.06);
            margin-bottom: 20px;
          }
          .label { font-size: 14px; color: #4b5563; font-weight: 600; margin: 0 0 8px; }
          .score-card { background: #f0fdf4; }
          .score { font-size: 40px; font-weight: 800; color: #15803d; margin: 4px 0; }
          .sub { font-size: 13px; color: #6b7280; margin: 4px 0 0; }
          .error { color: #dc2626; font-size: 14px; }
          .empty { color: #6b7280; font-size: 14px; line-height: 1.6; }
          .link { color: #15803d; font-weight: 600; text-decoration: none; }
          .link:hover { text-decoration: underline; }

          .skeleton { display: flex; flex-direction: column; gap: 14px; }
          .skel-line {
            border-radius: 6px;
            background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
            background-size: 200% 100%;
            animation: shimmer 1.4s ease-in-out infinite;
          }
          .skel-label { width: 30%; height: 14px; }
          .skel-chart { width: 100%; height: 260px; }

          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>
    </>
  );
}
