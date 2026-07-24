import { useAdminSession } from "../hooks/useAdminSession";
import { AdminLogin } from "../pages/AdminLogin";

export function AdminGate({ children }) {
  const { session, cargando } = useAdminSession();

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/15 border-t-white" />
      </div>
    );
  }

  if (!session) return <AdminLogin />;

  return children(session);
}
