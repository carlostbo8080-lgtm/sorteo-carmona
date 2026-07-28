import { useState } from "react";
import { Loader2, Lock, LogIn, Mail } from "lucide-react";
import { supabase } from "../lib/supabase";
import { traducirErrorSupabase } from "../utils/helpers";
import logo from "../img/logoofi.png";

export function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setCargando(false);
    if (err) setError(traducirErrorSupabase(err.message));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm animate-fade-in-up rounded-[24px] border border-white/10 bg-zinc-900 p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white p-1.5">
            <img src={logo} alt="Darío Carmona" className="h-full w-full rounded-full object-cover" />
          </div>
          <div className="font-condensed text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            Darío Carmona — Concejal 2026
          </div>
          <h1 className="mt-1 font-display text-[26px] uppercase tracking-[0.02em] text-white">Panel Administrador</h1>
          <p className="mt-1 text-[13px] text-zinc-400">Acceso exclusivo para administrar los registros</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 font-condensed text-[11px] font-bold uppercase tracking-[0.08em] text-zinc-400">
              <Mail size={13} strokeWidth={2.5} />
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-[15px] font-medium text-white outline-none placeholder:text-zinc-600 transition-all duration-150 focus:border-brand focus:bg-white/10 focus:ring-2 focus:ring-brand/25"
            />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 font-condensed text-[11px] font-bold uppercase tracking-[0.08em] text-zinc-400">
              <Lock size={13} strokeWidth={2.5} />
              Contraseña
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-[15px] font-medium text-white outline-none placeholder:text-zinc-600 transition-all duration-150 focus:border-brand focus:bg-white/10 focus:ring-2 focus:ring-brand/25"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] font-medium text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3.5 font-condensed text-[14px] font-extrabold uppercase tracking-wide text-white shadow-brand transition-all duration-200 hover:-translate-y-px hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cargando ? (
              <>
                <Loader2 size={17} className="animate-spin" strokeWidth={2.5} />
                Ingresando…
              </>
            ) : (
              <>
                <LogIn size={17} strokeWidth={2.5} />
                Ingresar
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
