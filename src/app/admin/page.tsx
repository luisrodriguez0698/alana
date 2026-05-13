import { getAdminSession } from "@/lib/auth";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) return <AdminLogin />;
  return <AdminDashboard />;
}
