// components/dashboard/EventList.jsx
export default function EventList({ events }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h2 className="font-semibold mb-4">Próximos eventos</h2>

      {events?.length === 0 ? (
        <p className="text-gray-500">No hay eventos próximos</p>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <li
              key={event.id}
              className="border-b pb-2 flex justify-between"
            >
              <div>
                <p className="font-medium">{event.title}</p>
                <p className="text-sm text-gray-500">{event.date}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}