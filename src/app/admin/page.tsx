import { getAdminSession } from "@/lib/auth";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) {
    return (
      <div className="min-h-screen bg-[#f8e8eb] flex items-center justify-center p-4">
        <AdminLogin />
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#f8e8eb] p-4">
      <AdminDashboard />
    </div>
  );
}
