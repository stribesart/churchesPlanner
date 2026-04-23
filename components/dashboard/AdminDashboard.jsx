// components/dashboard/AdminDashboard.jsx
import StatsCard from "./StatsCard";
import EventList from "./EventList";
import ActivityFeed from "./ActivityFeed";

export default function AdminDashboard({ data }) {
  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-bold">Dashboard General</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Miembros" value={data.totalMembers} />
        <StatsCard title="Nuevos este mes" value={data.newMembers} />
        <StatsCard title="Líderes" value={data.totalLeaders} />
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EventList events={data.events} />
        <ActivityFeed activities={data.activities} />
      </div>

    </div>
  );
}