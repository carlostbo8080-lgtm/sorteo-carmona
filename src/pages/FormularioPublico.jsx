import { useState } from "react";
import { CheckCircle2, Loader2, MapPin, Phone, Sparkles, Ticket, User, UserCheck } from "lucide-react";
import { supabase } from "../lib/supabase";
import { BARRIOS_POR_CATEGORIA, normalizarCedula, normalizarTelefono, telefonoValido, traducirErrorSupabase } from "../utils/helpers";
import logo from "../img/davidlogo2.jpeg";

const FORM_VACIO = { nombre: "", cedula: "", telefono: "", barrio: "", barrioOtro: "" };

function Campo({ icon: Icon, label, error, children }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 font-condensed text-[11px] font-bold uppercase tracking-[0.08em] text-zinc-500">
        <Icon size={13} strokeWidth={2.5} className="text-ciudad" />
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-[12px] font-medium text-red-600">{error}</p>}
    </div>
  );
}

export function FormularioPublico() {
  const [form, setForm] = useState(FORM_VACIO);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const validar = () => {
    const errs = {};
    if (!form.nombre.trim() || form.nombre.trim().length < 3) errs.nombre = "Ingresá tu nombre y apellido completos.";
    if (!/^[0-9]{4,10}$/.test(normalizarCedula(form.cedula))) errs.cedula = "Ingresá un número de cédula válido.";
    if (!telefonoValido(form.telefono)) errs.telefono = "Ingresá un número de teléfono válido.";
    const barrioFinal = form.barrio === "__otro__" ? form.barrioOtro.trim() : form.barrio;
    if (!barrioFinal) errs.barrio = "Seleccioná o escribí tu barrio.";
    setErrores(errs);
    return { valido: Object.keys(errs).length === 0, barrioFinal };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorGeneral("");
    const { valido, barrioFinal } = validar();
    if (!valido) return;

    setEnviando(true);
    const { error } = await supabase.from("registros").insert({
      nombre: form.nombre.trim(),
      cedula: normalizarCedula(form.cedula),
      cedula_limpia: normalizarCedula(form.cedula),
      telefono: normalizarTelefono(form.telefono),
      barrio: barrioFinal,
    });
    setEnviando(false);

    if (error) {
      if (error.code === "23505") {
        setErrores((prev) => ({ ...prev, cedula: "Esa cédula ya está registrada." }));
      } else {
        setErrorGeneral(traducirErrorSupabase(error.message));
      }
      return;
    }

    setForm(FORM_VACIO);
    setErrores({});
    setEnviado(true);
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #ffffff 0%, #f2faf6 55%, #eaf6f0 100%)" }}>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden px-6 pb-20 pt-14 sm:pb-24 sm:pt-16">
        <div
          className="pointer-events-none absolute"
          style={{ top: -100, right: -80, width: 340, height: 340, borderRadius: 9999, background: "radial-gradient(circle, rgba(25,135,84,0.16), transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute"
          style={{ bottom: -110, left: "6%", width: 300, height: 300, borderRadius: 9999, background: "radial-gradient(circle, rgba(25,135,84,0.1), transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute"
          style={{ top: "20%", left: "-8%", width: 220, height: 220, borderRadius: 9999, background: "radial-gradient(circle, rgba(25,135,84,0.08), transparent 70%)" }}
        />

        <div className="relative mx-auto flex max-w-md flex-col items-center text-center">
          <div className="mb-5 flex h-28 items-center justify-center overflow-hidden rounded-2xl bg-white p-1 shadow-[0_10px_28px_rgba(25,135,84,0.2)] ring-1 ring-ciudad/15 animate-fade-in-up">
            <img src={logo} alt="Darío Carmona — Concejal 2026" className="h-full w-auto rounded-xl object-contain" />
          </div>
          <div
            className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-ciudad-light px-3 py-1 font-condensed text-[11px] font-bold uppercase tracking-[0.14em] text-ciudad-deep ring-1 ring-ciudad/20 animate-fade-in-up"
            style={{ animationDelay: "30ms" }}
          >
            <Ticket size={13} strokeWidth={2.5} />
            Sorteo abierto
          </div>
          <div
            className="mb-2 font-condensed text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-400 animate-fade-in-up"
            style={{ animationDelay: "60ms" }}
          >
            Darío Carmona — Concejal 2026
          </div>
          <h1
            className="font-display leading-[0.95] text-zinc-900 animate-fade-in-up"
            style={{ fontSize: "clamp(40px, 9vw, 56px)", letterSpacing: "0.01em", animationDelay: "110ms" }}
          >
            Completá el formulario
            <br />
            y participá del sorteo
          </h1>
          <div
            className="mx-auto mt-4 h-[3px] w-10 animate-fade-in-up"
            style={{ borderRadius: 2, background: "linear-gradient(90deg, #198754, #34c27a)", animationDelay: "160ms" }}
          />
          <p
            className="mt-4 max-w-xs text-[14px] leading-relaxed text-zinc-500 animate-fade-in-up"
            style={{ animationDelay: "200ms" }}
          >
            Dejanos tus datos, entrá al sorteo y sé parte del cambio que estamos construyendo juntos en Presidente Franco.
          </p>
        </div>
      </div>

      {/* ── TARJETA DEL FORMULARIO ───────────────────────────── */}
      <div className="relative mx-auto -mt-10 max-w-md px-4 pb-16 sm:-mt-12">
        <div
          className="animate-fade-in-up rounded-[24px] border border-ciudad/10 bg-white/90 p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_28px_54px_-20px_rgba(25,135,84,0.28)] backdrop-blur-sm sm:p-8"
          style={{ animationDelay: "260ms" }}
        >
          {enviado ? (
            <div className="flex flex-col items-center py-6 text-center animate-fade-in">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ciudad-light">
                <CheckCircle2 size={34} className="text-ciudad" strokeWidth={2} />
              </div>
              <h2 className="font-display text-[26px] uppercase tracking-[0.02em] text-zinc-900">¡Ya estás participando!</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-zinc-600">
                Tus datos fueron enviados correctamente y quedaste anotado en el sorteo.
              </p>
              <button
                onClick={() => setEnviado(false)}
                className="mt-6 rounded-xl border border-zinc-200 px-5 py-3 font-condensed text-[13px] font-bold uppercase tracking-wide text-zinc-600 transition-colors hover:bg-zinc-50"
              >
                Anotar a otra persona
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
              <Campo icon={User} label="Nombre y apellido" error={errores.nombre}>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={set("nombre")}
                  placeholder="Ej: María González"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-[15px] font-medium text-zinc-900 outline-none placeholder:text-zinc-400 transition-all duration-150 focus:border-ciudad focus:bg-white focus:ring-2 focus:ring-ciudad/15"
                />
              </Campo>

              <Campo icon={UserCheck} label="Número de cédula" error={errores.cedula}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.cedula}
                  onChange={(e) => setForm((f) => ({ ...f, cedula: e.target.value.replace(/\D/g, "") }))}
                  placeholder="Ej: 4123456"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-[15px] font-medium text-zinc-900 outline-none placeholder:text-zinc-400 transition-all duration-150 focus:border-ciudad focus:bg-white focus:ring-2 focus:ring-ciudad/15"
                />
              </Campo>

              <Campo icon={Phone} label="Número de teléfono" error={errores.telefono}>
                <input
                  type="tel"
                  inputMode="tel"
                  value={form.telefono}
                  onChange={set("telefono")}
                  placeholder="Ej: 0981 123 456"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-[15px] font-medium text-zinc-900 outline-none placeholder:text-zinc-400 transition-all duration-150 focus:border-ciudad focus:bg-white focus:ring-2 focus:ring-ciudad/15"
                />
              </Campo>

              <Campo icon={MapPin} label="Barrio" error={errores.barrio}>
                <select
                  value={form.barrio}
                  onChange={set("barrio")}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-[15px] font-medium text-zinc-900 outline-none transition-all duration-150 focus:border-ciudad focus:bg-white focus:ring-2 focus:ring-ciudad/15"
                >
                  <option value="">Seleccioná tu barrio</option>
                  {Object.entries(BARRIOS_POR_CATEGORIA).map(([categoria, barrios]) => (
                    <optgroup key={categoria} label={categoria}>
                      {barrios.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </optgroup>
                  ))}
                  <option value="__otro__">Otro (especificar)</option>
                </select>
                {form.barrio === "__otro__" && (
                  <input
                    type="text"
                    value={form.barrioOtro}
                    onChange={set("barrioOtro")}
                    placeholder="Escribí tu barrio"
                    className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-[15px] font-medium text-zinc-900 outline-none placeholder:text-zinc-400 transition-all duration-150 focus:border-ciudad focus:bg-white focus:ring-2 focus:ring-ciudad/15"
                  />
                )}
              </Campo>

              {errorGeneral && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">
                  {errorGeneral}
                </div>
              )}

              <button
                type="submit"
                disabled={enviando}
                className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-4 font-condensed text-[15px] font-extrabold uppercase tracking-wide text-white shadow-ciudad transition-all duration-200 hover:-translate-y-px hover:shadow-ciudad-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #1c9c5f 0%, #146c43 100%)" }}
              >
                {enviando ? (
                  <>
                    <Loader2 size={18} className="animate-spin" strokeWidth={2.5} />
                    Enviando…
                  </>
                ) : (
                  <>
                    <Sparkles size={18} strokeWidth={2.5} />
                    Participar del sorteo
                  </>
                )}
              </button>

              <p className="text-center text-[11px] leading-relaxed text-zinc-400">
                Tus datos se guardan de forma segura y se usan para el sorteo y fines de la campaña.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
