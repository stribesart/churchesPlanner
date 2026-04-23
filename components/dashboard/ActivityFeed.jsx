// components/dashboard/ActivityFeed.jsx
export default function ActivityFeed({ activities }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h2 className="font-semibold mb-4">Actividad reciente</h2>

      {activities?.length === 0 ? (
        <p className="text-gray-500">Sin actividad reciente</p>
      ) : (
        <ul className="space-y-3">
          {activities.map((act) => (
            <li key={act.id} className="text-sm text-gray-600">
              • {act.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}