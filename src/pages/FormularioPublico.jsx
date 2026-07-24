import { useState } from "react";
import { CheckCircle2, Loader2, MapPin, Phone, User, UserCheck } from "lucide-react";
import { supabase } from "../lib/supabase";
import { LISTA_BARRIOS, normalizarCedula, normalizarTelefono, telefonoValido, traducirErrorSupabase } from "../utils/helpers";
import logo from "../img/davidlogo.png";

const FORM_VACIO = { nombre: "", cedula: "", telefono: "", barrio: "", barrioOtro: "" };

function Campo({ icon: Icon, label, error, children }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 font-condensed text-[11px] font-bold uppercase tracking-[0.08em] text-zinc-500">
        <Icon size={13} strokeWidth={2.5} className="text-brand" />
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
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #fafafa 0%, #f4f4f5 100%)" }}>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden px-6 pb-20 pt-14 sm:pb-24 sm:pt-16"
        style={{ background: "linear-gradient(135deg, #3d0410 0%, #6e0818 32%, #C8102E 78%, #e8203e 100%)" }}
      >
        <div
          className="pointer-events-none absolute"
          style={{ top: -80, right: -80, width: 320, height: 320, borderRadius: 9999, background: "radial-gradient(circle, rgba(255,255,255,0.16), transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute"
          style={{ bottom: -100, left: "8%", width: 300, height: 300, borderRadius: 9999, background: "radial-gradient(circle, rgba(255,255,255,0.08), transparent 70%)" }}
        />

        <div className="relative mx-auto flex max-w-md flex-col items-center text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white/95 p-2 shadow-[0_8px_28px_rgba(0,0,0,0.35)] animate-fade-in-up">
            <img src={logo} alt="David Dvdburg" className="h-full w-full object-contain" />
          </div>
          <div
            className="mb-2 font-condensed text-[11px] font-bold uppercase tracking-[0.22em] animate-fade-in-up"
            style={{ color: "rgba(255,255,255,0.6)", animationDelay: "60ms" }}
          >
            David Dvdburg — Concejal 2026
          </div>
          <h1
            className="font-display leading-[0.95] text-white animate-fade-in-up"
            style={{ fontSize: "clamp(40px, 9vw, 56px)", letterSpacing: "0.01em", animationDelay: "110ms" }}
          >
            Completá el formulario
            <br />
            y participá del sorteo
          </h1>
          <div
            className="mx-auto mt-4 h-[3px] w-10 animate-fade-in-up"
            style={{ borderRadius: 2, background: "linear-gradient(90deg, #fde68a, #f59e0b)", animationDelay: "160ms" }}
          />
          <p
            className="mt-4 max-w-xs text-[14px] leading-relaxed animate-fade-in-up"
            style={{ color: "rgba(255,255,255,0.75)", animationDelay: "200ms" }}
          >
            Dejanos tus datos y sé parte del cambio que estamos construyendo juntos en Tobatí.
          </p>
        </div>
      </div>

      {/* ── TARJETA DEL FORMULARIO ───────────────────────────── */}
      <div className="relative mx-auto -mt-10 max-w-md px-4 pb-16 sm:-mt-12">
        <div className="animate-fade-in-up rounded-[24px] border border-black/5 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_48px_-20px_rgba(0,0,0,0.25)] sm:p-8" style={{ animationDelay: "260ms" }}>
          {enviado ? (
            <div className="flex flex-col items-center py-6 text-center animate-fade-in">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle2 size={34} className="text-emerald-600" strokeWidth={2} />
              </div>
              <h2 className="font-display text-[26px] uppercase tracking-[0.02em] text-zinc-900">¡Listo!</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-zinc-600">
                Gracias por registrarte. Tus datos fueron enviados correctamente.
              </p>
              <button
                onClick={() => setEnviado(false)}
                className="mt-6 rounded-xl border border-zinc-200 px-5 py-3 font-condensed text-[13px] font-bold uppercase tracking-wide text-zinc-600 transition-colors hover:bg-zinc-50"
              >
                Registrar a otra persona
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
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-[15px] font-medium text-zinc-900 outline-none placeholder:text-zinc-400 transition-all duration-150 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/12"
                />
              </Campo>

              <Campo icon={UserCheck} label="Número de cédula" error={errores.cedula}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.cedula}
                  onChange={(e) => setForm((f) => ({ ...f, cedula: e.target.value.replace(/\D/g, "") }))}
                  placeholder="Ej: 4123456"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-[15px] font-medium text-zinc-900 outline-none placeholder:text-zinc-400 transition-all duration-150 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/12"
                />
              </Campo>

              <Campo icon={Phone} label="Número de teléfono" error={errores.telefono}>
                <input
                  type="tel"
                  inputMode="tel"
                  value={form.telefono}
                  onChange={set("telefono")}
                  placeholder="Ej: 0981 123 456"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-[15px] font-medium text-zinc-900 outline-none placeholder:text-zinc-400 transition-all duration-150 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/12"
                />
              </Campo>

              <Campo icon={MapPin} label="Barrio" error={errores.barrio}>
                <select
                  value={form.barrio}
                  onChange={set("barrio")}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-[15px] font-medium text-zinc-900 outline-none transition-all duration-150 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/12"
                >
                  <option value="">Seleccioná tu barrio</option>
                  {LISTA_BARRIOS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                  <option value="__otro__">Otro (especificar)</option>
                </select>
                {form.barrio === "__otro__" && (
                  <input
                    type="text"
                    value={form.barrioOtro}
                    onChange={set("barrioOtro")}
                    placeholder="Escribí tu barrio"
                    className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-[15px] font-medium text-zinc-900 outline-none placeholder:text-zinc-400 transition-all duration-150 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/12"
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
                className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-4 font-condensed text-[15px] font-extrabold uppercase tracking-wide text-white shadow-brand transition-all duration-200 hover:-translate-y-px hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {enviando ? (
                  <>
                    <Loader2 size={18} className="animate-spin" strokeWidth={2.5} />
                    Enviando…
                  </>
                ) : (
                  "Enviar datos"
                )}
              </button>

              <p className="text-center text-[11px] leading-relaxed text-zinc-400">
                Tus datos se guardan de forma segura y solo son utilizados con fines de la campaña.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
