// components/dashboard/MemberDashboard.jsx
import EventList from "./EventList";
import AnnouncementsList from "./AnnouncementsList";

export default function MemberDashboard({ data }) {
  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-bold">Bienvenido</h1>

      <div className="bg-white p-4 rounded-xl shadow">
        <p className="text-gray-600">
          Grupo: <span className="font-semibold">{data.groupName}</span>
        </p>
      </div>

      <AnnouncementsList announcements={data.announcements || []} />

      <EventList events={data.events} />

    </div>
  );
}