import React, { useEffect, useState } from 'react';

interface Stats {
  totalUsers: number;
  totalProviders: number;
  totalRequests: number;
  totalReviews: number;
  pendingReports: number;
}

interface Report {
  id: string;
  reason: string;
  details: string | null;
  reporter: { fullName: string; phone: string };
  reported: { fullName: string; phone: string };
  createdAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load stats');
      setStats(data.stats);
      setReports(data.recentReports);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleResolveReport = async (reportId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/admin/reports/${reportId}/resolve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setReports(reports.filter((r) => r.id !== reportId));
        // Optionally decrement pendingReports count in stats state
        if (stats) {
          setStats({ ...stats, pendingReports: Math.max(0, stats.pendingReports - 1) });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center text-emerald-700 font-medium">Loading Admin Control Center...</div>;
  if (error) return <div className="p-8 text-center text-red-600 font-medium">Error: {error} (Ensure you are logged in as an ADMIN account).</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">KAAM PAKISTAN — Admin Control Panel</h1>
            <p className="text-sm text-slate-500">Platform operations, trust moderation, and verification management.</p>
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full">Secure Administrator</span>
        </header>

        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Users</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{stats.totalUsers}</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Service Providers</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.totalProviders}</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Service Requests</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.totalRequests}</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
              <p className="text-xs text-amber-600 uppercase tracking-wider font-semibold">Total Reviews</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{stats.totalReviews}</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
              <p className="text-xs text-rose-600 uppercase tracking-wider font-semibold">Pending Reports</p>
              <p className="text-2xl font-bold text-rose-700 mt-1">{stats.pendingReports}</p>
            </div>
          </div>
        )}

        <section className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-slate-800">Trust & Safety Moderation Queue</h2>
            <span className="bg-rose-50 text-rose-600 text-xs px-2.5 py-1 rounded-full font-medium">
              {reports.length} Unresolved Reports
            </span>
          </div>

          {reports.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No pending reports. Platform is running smoothly!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="p-4">Reporter</th>
                    <th className="p-4">Reported User</th>
                    <th className="p-4">Reason</th>
                    <th className="p-4">Details</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50">
                      <td className="p-4 font-medium">{report.reporter.fullName}</td>
                      <td className="p-4 text-rose-600 font-medium">{report.reported.fullName}</td>
                      <td className="p-4 font-semibold">{report.reason}</td>
                      <td className="p-4 text-slate-500 max-w-xs truncate">{report.details || 'N/A'}</td>
                      <td className="p-4 text-slate-400">{new Date(report.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleResolveReport(report.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded font-medium transition"
                        >
                          Resolve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}