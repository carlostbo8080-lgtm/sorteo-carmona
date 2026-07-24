import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, FileSpreadsheet, LogOut, PartyPopper, Search, Trash2, Users, XCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { traducirErrorSupabase } from "../utils/helpers";
import logo from "../img/davidlogo.png";

export function AdminDashboard({ session }) {
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [barrioFiltro, setBarrioFiltro] = useState("");
  const [aptoFiltro, setAptoFiltro] = useState("todos"); // todos | apto | no-apto
  const [exportando, setExportando] = useState(false);
  const [borrandoId, setBorrandoId] = useState(null);

  useEffect(() => {
    cargarRegistros();
  }, []);

  async function cargarRegistros() {
    setCargando(true);
    setError("");
    const { data, error: err } = await supabase.from("registros").select("*").order("created_at", { ascending: false });
    if (err) setError(traducirErrorSupabase(err.message));
    else setRegistros(data || []);
    setCargando(false);
  }

  async function borrarRegistro(registro) {
    const confirmado = window.confirm(`¿Borrar el registro de "${registro.nombre}"? Esta acción no se puede deshacer.`);
    if (!confirmado) return;

    setBorrandoId(registro.id);
    const { error: err } = await supabase.from("registros").delete().eq("id", registro.id);
    setBorrandoId(null);

    if (err) {
      setError(traducirErrorSupabase(err.message));
      return;
    }
    setRegistros((prev) => prev.filter((r) => r.id !== registro.id));
  }

  const barrios = useMemo(() => [...new Set(registros.map((r) => r.barrio))].sort((a, b) => a.localeCompare(b, "es")), [registros]);

  const aptosCount = useMemo(() => registros.filter((r) => r.apto_sorteo).length, [registros]);
  const noAptosCount = registros.length - aptosCount;

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return registros.filter((r) => {
      if (barrioFiltro && r.barrio !== barrioFiltro) return false;
      if (aptoFiltro === "apto" && !r.apto_sorteo) return false;
      if (aptoFiltro === "no-apto" && r.apto_sorteo) return false;
      if (!q) return true;
      return (
        r.nombre.toLowerCase().includes(q) ||
        r.cedula.includes(q) ||
        r.telefono.includes(q) ||
        r.barrio.toLowerCase().includes(q)
      );
    });
  }, [registros, busqueda, barrioFiltro, aptoFiltro]);

  const handleExportar = async () => {
    // Siempre exporta el 100% de los registros, sin importar los filtros
    // en pantalla (búsqueda, barrio o estado del sorteo).
    if (exportando || registros.length === 0) return;
    setExportando(true);
    try {
      const [{ default: ExcelJS }, { saveAs }] = await Promise.all([import("exceljs"), import("file-saver")]);

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Registro David Dvdburg";
      workbook.created = new Date();

      const ROJO = "FFC8102E";
      const BLANCO = "FFFFFFFF";
      const NEGRO = "FF18181B";
      const FILA_PAR = "FFFDF2F4";
      const bordeFino = { style: "thin", color: { argb: "FFE4E4E7" } };
      const bordeCompleto = { top: bordeFino, left: bordeFino, bottom: bordeFino, right: bordeFino };

      const sheet = workbook.addWorksheet("Registros", { views: [{ state: "frozen", ySplit: 3 }] });
      sheet.columns = [
        { header: "Fecha de registro", key: "fecha", width: 22 },
        { header: "Nombre y apellido", key: "nombre", width: 30 },
        { header: "Cédula", key: "cedula", width: 16 },
        { header: "Número de teléfono", key: "telefono", width: 20 },
        { header: "Barrio", key: "barrio", width: 26 },
        { header: "Estado del Sorteo", key: "estado", width: 20 },
      ];

      sheet.mergeCells("A1:F1");
      sheet.getRow(1).height = 32;
      sheet.getCell("A1").value = "REGISTROS PARA EL SORTEO - DAVID DVDBURG";
      sheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: ROJO } };
      sheet.getCell("A1").font = { bold: true, size: 15, color: { argb: BLANCO } };
      sheet.getCell("A1").alignment = { vertical: "middle", horizontal: "left", indent: 1 };

      sheet.mergeCells("A2:F2");
      sheet.getRow(2).height = 20;
      const ahora = new Date();
      sheet.getCell("A2").value =
        `Generado el ${ahora.toLocaleDateString("es-PY", { day: "2-digit", month: "long", year: "numeric" })} — ` +
        `Total: ${registros.length} registros (${aptosCount} aptos, ${noAptosCount} no aptos)`;
      sheet.getCell("A2").font = { italic: true, size: 10, color: { argb: "FF71717A" } };
      sheet.getCell("A2").alignment = { vertical: "middle", horizontal: "left", indent: 1 };

      const headerRow = sheet.getRow(3);
      headerRow.values = ["Fecha de registro", "Nombre y apellido", "Cédula", "Número de teléfono", "Barrio", "Estado del Sorteo"];
      headerRow.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ROJO } };
        cell.font = { bold: true, color: { argb: BLANCO } };
        cell.border = bordeCompleto;
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });
      headerRow.height = 22;
      sheet.autoFilter = "A3:F3";

      registros.forEach((r, i) => {
        const fecha = new Date(r.created_at);
        const fechaTexto = `${fecha.toLocaleDateString("es-PY")} ${fecha.toLocaleTimeString("es-PY", { hour: "2-digit", minute: "2-digit" })}`;
        const estadoTexto = r.apto_sorteo ? "Apto para el sorteo" : "No apto para el sorteo";
        const row = sheet.addRow([fechaTexto, r.nombre, r.cedula, r.telefono, r.barrio, estadoTexto]);
        const fillArgb = i % 2 !== 0 ? FILA_PAR : BLANCO;
        row.eachCell((cell, colNumber) => {
          cell.border = bordeCompleto;
          cell.alignment = { vertical: "middle", horizontal: colNumber === 2 || colNumber === 5 ? "left" : "center" };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fillArgb } };
          cell.font = { size: 11, color: { argb: NEGRO } };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const tipoExcel = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      const filename = "Registro_David_Dvdburg.xlsx";
      saveAs(new Blob([buffer], { type: tipoExcel }), filename);
    } catch {
      setError("No se pudo generar el Excel. Intentá nuevamente.");
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-50 p-1.5">
              <img src={logo} alt="David Dvdburg" className="h-full w-full object-contain" />
            </div>
            <div>
              <div className="font-display text-[18px] uppercase leading-none tracking-[0.02em] text-brand">REGISTROS PARA EL SORTEO</div>
              <div className="font-condensed text-[11px] font-bold uppercase tracking-[0.08em] text-zinc-400">David Dvdburg — Concejal 2026</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/sorteo"
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3.5 py-2 font-condensed text-[12px] font-bold uppercase tracking-wide text-zinc-600 transition-colors hover:bg-zinc-50"
            >
              <PartyPopper size={14} strokeWidth={2.5} />
              Ir al sorteo
            </a>
            <span className="hidden text-[13px] text-zinc-400 sm:inline">{session.user.email}</span>
            <button
              onClick={() => supabase.auth.signOut()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3.5 py-2 font-condensed text-[12px] font-bold uppercase tracking-wide text-zinc-600 transition-colors hover:bg-zinc-50"
            >
              <LogOut size={14} strokeWidth={2.5} />
              Salir
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
              <Users size={12} strokeWidth={2.5} />
              Total registros
            </div>
            <div className="mt-1 font-display text-[30px] leading-none text-zinc-900">{registros.length}</div>
          </div>
          <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
              <CheckCircle2 size={12} strokeWidth={2.5} className="text-emerald-500" />
              Aptos
            </div>
            <div className="mt-1 font-display text-[30px] leading-none text-emerald-600">{aptosCount}</div>
          </div>
          <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
              <XCircle size={12} strokeWidth={2.5} className="text-zinc-400" />
              No aptos
            </div>
            <div className="mt-1 font-display text-[30px] leading-none text-zinc-500">{noAptosCount}</div>
          </div>
          <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">Filtro actual</div>
            <div className="mt-1 font-display text-[30px] leading-none text-brand">{filtrados.length}</div>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, cédula, teléfono o barrio…"
              className="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-10 pr-4 text-[14px] font-medium text-zinc-900 outline-none placeholder:text-zinc-400 transition-all focus:border-brand focus:ring-2 focus:ring-brand/12"
            />
          </div>
          <select
            value={barrioFiltro}
            onChange={(e) => setBarrioFiltro(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-[14px] font-medium text-zinc-900 outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/12"
          >
            <option value="">Todos los barrios</option>
            {barrios.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <div className="inline-flex flex-shrink-0 rounded-xl border border-zinc-200 bg-white p-1">
            {[
              { valor: "todos", label: "Todos" },
              { valor: "apto", label: "Aptos" },
              { valor: "no-apto", label: "No aptos" },
            ].map((opcion) => (
              <button
                key={opcion.valor}
                onClick={() => setAptoFiltro(opcion.valor)}
                className={`rounded-lg px-3 py-2 font-condensed text-[12px] font-bold uppercase tracking-wide transition-colors ${
                  aptoFiltro === opcion.valor ? "bg-brand text-white" : "text-zinc-500 hover:bg-zinc-50"
                }`}
              >
                {opcion.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleExportar}
            disabled={exportando || registros.length === 0}
            className="inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 font-condensed text-[13px] font-extrabold uppercase tracking-wide text-white shadow-brand transition-all hover:-translate-y-px hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exportando ? (
              <Download size={16} className="animate-bounce" strokeWidth={2.5} />
            ) : (
              <FileSpreadsheet size={16} strokeWidth={2.5} />
            )}
            Exportar Excel
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">{error}</div>
        )}

        <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          {cargando ? (
            <div className="flex items-center justify-center py-16 text-zinc-400">Cargando registros…</div>
          ) : filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-400">
              <Users size={32} className="mb-2 opacity-40" />
              <p className="text-[14px]">Todavía no hay registros que coincidan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[13px]">
                <thead>
                  <tr className="bg-brand text-white">
                    <th className="px-4 py-3 font-condensed text-[11px] font-bold uppercase tracking-wide">Fecha</th>
                    <th className="px-4 py-3 font-condensed text-[11px] font-bold uppercase tracking-wide">Nombre y apellido</th>
                    <th className="px-4 py-3 font-condensed text-[11px] font-bold uppercase tracking-wide">Cédula</th>
                    <th className="px-4 py-3 font-condensed text-[11px] font-bold uppercase tracking-wide">Teléfono</th>
                    <th className="px-4 py-3 font-condensed text-[11px] font-bold uppercase tracking-wide">Barrio</th>
                    <th className="px-4 py-3 font-condensed text-[11px] font-bold uppercase tracking-wide">Estado del Sorteo</th>
                    <th className="px-4 py-3 font-condensed text-[11px] font-bold uppercase tracking-wide"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filtrados.map((r, i) => (
                    <tr key={r.id} className={i % 2 !== 0 ? "bg-red-50/40" : "bg-white"}>
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                        {new Date(r.created_at).toLocaleDateString("es-PY")}{" "}
                        {new Date(r.created_at).toLocaleTimeString("es-PY", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-3 font-semibold text-zinc-900">{r.nombre}</td>
                      <td className="px-4 py-3 text-zinc-700">{r.cedula}</td>
                      <td className="px-4 py-3 text-zinc-700">{r.telefono}</td>
                      <td className="px-4 py-3 text-zinc-700">{r.barrio}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {r.apto_sorteo ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-condensed text-[10.5px] font-bold uppercase tracking-wide text-emerald-700">
                            <CheckCircle2 size={11} strokeWidth={2.5} />
                            Apto
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 font-condensed text-[10.5px] font-bold uppercase tracking-wide text-zinc-500">
                            <XCircle size={11} strokeWidth={2.5} />
                            No apto
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => borrarRegistro(r)}
                          disabled={borrandoId === r.id}
                          title="Borrar registro"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 size={15} strokeWidth={2.25} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
