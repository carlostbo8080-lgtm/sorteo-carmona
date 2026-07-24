import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import { FormularioPublico } from "./pages/FormularioPublico";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminDashboard } from "./pages/AdminDashboard";

const esRutaAdmin = window.location.pathname.replace(/\/+$/, "").toLowerCase() === "/admin";

export default function App() {
  const [session, setSession] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(esRutaAdmin);

  useEffect(() => {
    if (!esRutaAdmin) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCargandoSesion(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nuevaSesion) => {
      setSession(nuevaSesion);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (!esRutaAdmin) {
    return <FormularioPublico />;
  }

  if (cargandoSesion) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/15 border-t-white" />
      </div>
    );
  }

  return session ? <AdminDashboard session={session} /> : <AdminLogin />;
}
