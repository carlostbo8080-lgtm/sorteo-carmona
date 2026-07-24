import { FormularioPublico } from "./pages/FormularioPublico";
import { AdminDashboard } from "./pages/AdminDashboard";
import { SorteoPublico } from "./pages/SorteoPublico";
import { AdminGate } from "./components/AdminGate";

const ruta = window.location.pathname.replace(/\/+$/, "").toLowerCase();

export default function App() {
  if (ruta === "/sorteo") return <SorteoPublico />;

  if (ruta === "/admin") {
    return <AdminGate>{(session) => <AdminDashboard session={session} />}</AdminGate>;
  }

  return <FormularioPublico />;
}
