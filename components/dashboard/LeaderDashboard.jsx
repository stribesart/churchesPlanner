// components/dashboard/LeaderDashboard.jsx
import StatsCard from "./StatsCard";
import EventList from "./EventList";

export default function LeaderDashboard({ data }) {
  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-bold">Mi Grupo</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatsCard title="Miembros en mi grupo" value={data.groupMembers} />
        <StatsCard title="Asistencia promedio" value={`${data.attendance}%`} />
      </div>

      <EventList events={data.events} />

    </div>
  );
}