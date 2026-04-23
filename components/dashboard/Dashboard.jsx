// components/dashboard/Dashboard.jsx
import AdminDashboard from "./AdminDashboard";
import LeaderDashboard from "./LeaderDashboard";
import MemberDashboard from "./MemberDashboard";

export default function Dashboard({ role, data }) {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {(role === "admin" || role === "pastor") && <AdminDashboard data={data} />}
      {role === "lider" && <LeaderDashboard data={data} />}
      {role === "miembro" && <MemberDashboard data={data} />}
    </div>
  );
}