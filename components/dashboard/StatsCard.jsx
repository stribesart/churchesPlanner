// components/dashboard/StatsCard.jsx
export default function StatsCard({ title, value }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow hover:shadow-md transition">
      <p className="text-gray-500 text-sm">{title}</p>
      <h2 className="text-2xl font-bold mt-2">{value}</h2>
    </div>
  );
}