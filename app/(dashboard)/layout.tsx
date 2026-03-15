import Sidebar from "@/components/layout/sidebar"
import Topbar from "@/components/layout/topbar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex">

      <Sidebar />

      <div className="flex-1 flex flex-col">

        <Topbar />

        <main className="p-6 bg-gray-50 min-h-screen">
          {children}
        </main>

      </div>

    </div>
  )
}