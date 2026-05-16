// components/dashboard/Dashboard.jsx
import AdminDashboard from "./AdminDashboard";
import LeaderDashboard from "./LeaderDashboard";
import MemberDashboard from "./MemberDashboard";

export default function Dashboard({ role, data }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="mx-auto max-w-7xl px-6 py-10 text-slate-900 sm:py-12 lg:py-16">
        {(role === "admin" || role === "pastor") && <AdminDashboard data={data} />}
        {role === "lider" && <LeaderDashboard data={data} />}
        {role === "miembro" && <MemberDashboard data={data} />}
      </div>
    </div>
  );
}
