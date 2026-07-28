import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, MapPin, PartyPopper, RotateCcw, Sparkles, Trophy } from "lucide-react";
import { supabase } from "../lib/supabase";
import { lanzarConfeti, lanzarChispas, lanzarFuegosArtificiales } from "../utils/confeti";
import { tocarCelebracion, programarTicks } from "../utils/sonido";
import { traducirErrorSupabase } from "../utils/helpers";
import { barajarSeguro, duracionGiroMs, enteroSeguro } from "../utils/ruleta";
import { useAdminSession } from "../hooks/useAdminSession";
import { TamborSorteo } from "../components/TamborSorteo";
import { ParticulasFlotantes } from "../components/ParticulasFlotantes";
import logo from "../img/logocarmona.png";

const METODO_SELECCION = "csprng-fisher-yates-web-crypto";
const TAMANO_PAGINA = 1000; // Supabase limita cada respuesta a 1000 filas; hay que paginar

/** Trae TODOS los participantes, sin importar cuántos sean (supera el límite de 1000 por página). */
async function cargarTodosLosParticipantes() {
  const filas = [];
  let desde = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("sorteo_participantes_publico")
      .select("id, nombre, barrio")
      .order("created_at", { ascending: true })
      .range(desde, desde + TAMANO_PAGINA - 1);
    if (error) throw error;
    filas.push(...(data || []));
    if (!data || data.length < TAMANO_PAGINA) break;
    desde += TAMANO_PAGINA;
  }
  return filas;
}

export function SorteoPublico() {
  const { session } = useAdminSession();
  const [cargando, setCargando] = useState(true);
  const [nombreEvento, setNombreEvento] = useState("Gran Sorteo - Darío Carmona");
  const [total, setTotal] = useState(0);
  const [fase, setFase] = useState("idle"); // idle | girando | ganador
  const [ganador, setGanador] = useState(null);
  const [error, setError] = useState("");
  const [participantes, setParticipantes] = useState([]);
  const [ganadoresIds, setGanadoresIds] = useState(new Set());
  const [indiceGanador, setIndiceGanador] = useState(0);
  const [duracion, setDuracion] = useState(9800);

  const faseRef = useRef("idle");
  faseRef.current = fase;
  const ganadorPendienteRef = useRef(null);
  const segmentosSpinRef = useRef([]);
  const cancelarTicksRef = useRef(null);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      const [{ data: config }, { data: conteo }, registros, { data: ganadores }] = await Promise.all([
        supabase.from("sorteo_config").select("nombre_evento").eq("id", 1).maybeSingle(),
        supabase.from("sorteo_participantes_conteo").select("total").maybeSingle(),
        cargarTodosLosParticipantes(),
        supabase.from("sorteo_ganadores").select("registro_id"),
      ]);
      if (!activo) return;
      if (config?.nombre_evento) setNombreEvento(config.nombre_evento);
      if (conteo?.total != null) setTotal(conteo.total);
      setParticipantes(registros);
      setGanadoresIds(new Set((ganadores || []).map((g) => g.registro_id)));
      setCargando(false);
    }
    cargar();

    const intervalo = setInterval(() => {
      if (faseRef.current === "idle") cargar();
    }, 15000);

    // Sincroniza en vivo si otro dispositivo con esta misma página abierta
    // ejecuta el sorteo (varias pantallas mostrando el mismo evento).
    const canal = supabase
      .channel("sorteo-publico")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sorteo_ganadores" }, (payload) => {
        if (faseRef.current !== "idle") return;
        animarHaciaGanadorRemoto(payload.new);
      })
      .subscribe();

    return () => {
      activo = false;
      clearInterval(intervalo);
      supabase.removeChannel(canal);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => cancelarTicksRef.current?.(), []);

  const construirSegmentos = (lista) => lista.map((p, i) => ({ id: p.id, numero: i + 1, nombre: p.nombre, barrio: p.barrio }));

  const elegibles = participantes.filter((p) => !ganadoresIds.has(p.id));
  const segmentos = construirSegmentos(elegibles.length > 0 ? elegibles : participantes);

  const animarHaciaGanadorRemoto = (ganadorRemoto) => {
    if (segmentos.length === 0) return;
    // Buscar por id es más preciso que por número (evita corrimientos si la
    // lista local no está pixel-a-pixel igual a la del dispositivo que giró).
    let indice = segmentos.findIndex((s) => s.id === ganadorRemoto.registro_id);
    if (indice === -1) indice = Math.min(segmentos.length - 1, Math.max(0, ganadorRemoto.numero_participante - 1));

    const nuevaDuracion = duracionGiroMs();
    segmentosSpinRef.current = segmentos;
    ganadorPendienteRef.current = ganadorRemoto;
    setDuracion(nuevaDuracion);
    setIndiceGanador(indice);
    setGanador(null);
    setFase("girando");
  };

  const iniciarGiro = async () => {
    if (fase === "girando" || segmentos.length === 0) return;
    setError("");

    // 1-2. Traer participantes habilitados y excluir a quienes ya ganaron
    // en este evento (con reinicio automático si ya ganaron todos).
    const { data: ganadoresActuales } = await supabase.from("sorteo_ganadores").select("registro_id");
    const idsGanadores = new Set((ganadoresActuales || []).map((g) => g.registro_id));
    setGanadoresIds(idsGanadores);

    let elegiblesAhora = participantes.filter((p) => !idsGanadores.has(p.id));
    if (elegiblesAhora.length === 0) elegiblesAhora = participantes;
    if (elegiblesAhora.length === 0) return;

    // 3. Mezclar con un generador aleatorio criptográficamente seguro
    // (Web Crypto), no con Math.random().
    const barajados = barajarSeguro(elegiblesAhora);

    // 4. Seleccionar al ganador mediante un índice generado con el mismo
    // CSPRNG. La posición original en la base de datos es irrelevante.
    const indiceSeguro = enteroSeguro(barajados.length);
    const ganadorElegido = barajados[indiceSeguro];

    const segmentosGiro = construirSegmentos(elegiblesAhora);
    const indiceEnTambor = segmentosGiro.findIndex((s) => s.id === ganadorElegido.id);
    const elegido = segmentosGiro[indiceEnTambor];

    // 5. El resultado ya está decidido por el CSPRNG — el tambor de nombres
    // solo tiene que detenerse exactamente en ese índice, nunca decide nada.
    const nuevaDuracion = duracionGiroMs();

    segmentosSpinRef.current = segmentosGiro;
    ganadorPendienteRef.current = {
      id: elegido.id,
      nombre: elegido.nombre,
      barrio: elegido.barrio,
      numero_participante: elegido.numero,
      cantidadParticipantes: segmentosGiro.length,
    };

    cancelarTicksRef.current?.();
    cancelarTicksRef.current = programarTicks(nuevaDuracion);

    // 6-7. Iniciar la animación (~10s, aceleración + desaceleración).
    setDuracion(nuevaDuracion);
    setIndiceGanador(indiceEnTambor);
    setGanador(null);
    setFase("girando");
  };

  const handleFinGiro = async () => {
    cancelarTicksRef.current?.();
    const g = ganadorPendienteRef.current;
    ganadorPendienteRef.current = null;
    if (!g) {
      setFase("idle");
      return;
    }

    if (!g.elegido_en) {
      // 8. Validar antes de revelar: el participante debe seguir existiendo
      // y no haber sido registrado como ganador entretanto (otra pestaña,
      // otro dispositivo ejecutando el mismo sorteo casi al mismo tiempo).
      const [{ data: sigueExistiendo }, { data: yaGano }] = await Promise.all([
        supabase.from("sorteo_participantes_publico").select("id").eq("id", g.id).maybeSingle(),
        supabase.from("sorteo_ganadores").select("id").eq("registro_id", g.id).maybeSingle(),
      ]);

      if (!sigueExistiendo || yaGano) {
        setError("Ese participante ya no está disponible. Girá de nuevo, por favor.");
        setFase("idle");
        return;
      }

      const { data, error: err } = await supabase
        .from("sorteo_ganadores")
        .insert({ registro_id: g.id, nombre: g.nombre, barrio: g.barrio, numero_participante: g.numero_participante })
        .select()
        .single();
      if (err) {
        setError(traducirErrorSupabase(err.message));
        setFase("idle");
        return;
      }

      // Registro de auditoría (solo el admin puede leerlo). Nunca se
      // encadena `.select()` acá: "anon" no tiene permiso de lectura
      // sobre esta tabla a propósito.
      await supabase.from("sorteo_auditoria").insert({
        cantidad_participantes: g.cantidadParticipantes,
        ganador_registro_id: g.id,
        metodo_seleccion: METODO_SELECCION,
      });

      setGanadoresIds((prev) => new Set(prev).add(g.id));
      setGanador(data);
    } else {
      setGanador(g);
    }

    tocarCelebracion();
    setFase("ganador");
    lanzarConfeti();
    lanzarChispas();
    lanzarFuegosArtificiales();
  };

  const seguirSinGanadorActual = () => {
    setGanador(null);
    setFase("idle");
  };

  const reiniciarConTodos = async () => {
    setError("");
    const { error: err } = await supabase.from("sorteo_ganadores").delete().not("id", "is", null);
    if (err) {
      setError(traducirErrorSupabase(err.message));
      return;
    }
    setGanadoresIds(new Set());
    setGanador(null);
    setFase("idle");
  };

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#121214]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-[#D4A017]" />
      </div>
    );
  }

  const segmentosParaMostrar = fase === "girando" ? segmentosSpinRef.current : segmentos;

  return (
    <div
      className="relative flex min-h-screen flex-col items-center overflow-hidden px-5 py-8 sm:px-8 sm:py-10"
      style={{ background: "radial-gradient(140% 100% at 50% -10%, #2b2b2d 0%, #18181a 42%, #0a0a0b 78%)" }}
    >
      <div
        className="pointer-events-none absolute animate-[sorteo-glow_7s_ease-in-out_infinite] animate-sorteo-respirar"
        style={{ top: "-18%", left: "50%", transform: "translateX(-50%)", width: 760, height: 760, borderRadius: 9999, background: "radial-gradient(circle, rgba(212,160,23,0.18), transparent 68%)" }}
      />
      <div
        className="pointer-events-none absolute"
        style={{ bottom: "-15%", right: "-8%", width: 480, height: 480, borderRadius: 9999, background: "radial-gradient(circle, rgba(224,150,40,0.26), transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute"
        style={{ bottom: "8%", left: "-12%", width: 340, height: 340, borderRadius: 9999, background: "radial-gradient(circle, rgba(224,150,40,0.14), transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute"
        style={{ top: "30%", right: "-6%", width: 260, height: 260, borderRadius: 9999, background: "radial-gradient(circle, rgba(212,160,23,0.1), transparent 70%)" }}
      />
      <ParticulasFlotantes />

      {session && (
        <a
          href="/admin"
          className="absolute left-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 font-condensed text-[11px] font-bold uppercase tracking-wide text-white/50 backdrop-blur-sm transition-colors hover:bg-white/[0.09] hover:text-white/85 sm:left-6 sm:top-6"
        >
          <ArrowLeft size={13} strokeWidth={2.5} />
          Volver al panel
        </a>
      )}

      {/* ── encabezado ──────────────────────────────────────── */}
      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center text-center">
        <div className="relative mb-4">
          <div
            className="pointer-events-none absolute inset-0 -z-10 animate-sorteo-pulso rounded-full blur-xl"
            style={{ background: "radial-gradient(circle, rgba(212,160,23,0.5), transparent 70%)" }}
          />
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.55)] ring-1 ring-white/20 animate-fade-in-up sm:h-[108px] sm:w-[108px]">
            <img src={logo} alt="Darío Carmona" className="h-full w-full rounded-full object-cover" />
          </div>
        </div>
        <div
          className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#D4A017]/30 bg-[#D4A017]/10 px-3.5 py-1.5 font-condensed text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#f0c352] shadow-[0_0_20px_-4px_rgba(212,160,23,0.5)] animate-fade-in-up"
          style={{ animationDelay: "40ms" }}
        >
          <Sparkles size={12} strokeWidth={2.5} className="animate-sorteo-titilar" />
          Sorteo oficial
        </div>
        <h1
          className="font-display leading-[0.95] text-white animate-fade-in-up"
          style={{
            fontSize: "clamp(30px, 6vw, 50px)",
            letterSpacing: "0.01em",
            animationDelay: "80ms",
            textShadow: "0 0 40px rgba(212,160,23,0.35), 0 4px 24px rgba(0,0,0,0.5)",
          }}
        >
          {nombreEvento}
        </h1>
        <p
          className="mt-3 max-w-sm text-[14.5px] leading-relaxed text-white/55 animate-fade-in-up"
          style={{ animationDelay: "120ms" }}
        >
          Gracias por ser parte de esta gran comunidad
        </p>
      </div>

      {/* ── contador ────────────────────────────────────────── */}
      <div className="relative z-10 mt-6 flex flex-col items-center animate-fade-in-up" style={{ animationDelay: "160ms" }}>
        <div className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-white/40">Participantes registrados</div>
        <div
          key={total}
          className="mt-0.5 bg-clip-text font-display text-transparent animate-sorteo-numero-pop"
          style={{
            fontSize: "clamp(34px, 6vw, 48px)",
            lineHeight: 1,
            backgroundImage: "linear-gradient(180deg, #fde68a 0%, #D4A017 100%)",
            filter: "drop-shadow(0 0 18px rgba(212,160,23,0.35))",
          }}
        >
          {total.toLocaleString("es-PY")}
        </div>
      </div>

      {/* ── tarjeta central: tambor de nombres + botón ──────────────── */}
      <div className="relative z-10 mt-7 w-full max-w-3xl flex-1">
        <div
          className="relative flex w-full flex-col items-center justify-center overflow-hidden rounded-[20px] border border-[#D4A017]/25 bg-[#171614] px-4 pt-8 shadow-[0_30px_70px_-24px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.04)] animate-fade-in-up sm:px-10 sm:pt-10"
          style={{ animationDelay: "200ms" }}
        >
          <div className="relative flex items-center justify-center">
            <div className="pointer-events-none absolute -inset-3 rounded-[30px] border border-[#D4A017]/20 sm:-inset-4" />
            <TamborSorteo
              segmentos={segmentosParaMostrar}
              indiceGanador={indiceGanador}
              girando={fase === "girando"}
              duracionMs={duracion}
              onFinish={handleFinGiro}
            />
          </div>

          {/* ── perforación de ticket ─────────────────────────────── */}
          <div className="relative my-9 -mx-4 w-[calc(100%+2rem)] flex-shrink-0 sm:-mx-10 sm:w-[calc(100%+5rem)]">
            <span className="pointer-events-none absolute left-0 top-1/2 z-10 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0b0a09]" />
            <span className="pointer-events-none absolute right-0 top-1/2 z-10 h-7 w-7 -translate-y-1/2 translate-x-1/2 rounded-full bg-[#0b0a09]" />
            <div className="border-t-2 border-dashed border-[#D4A017]/30" />
          </div>

          <div className="flex flex-col items-center pb-8 text-center sm:pb-10">
            {fase === "idle" && (
              <>
                <button
                  onClick={iniciarGiro}
                  disabled={segmentos.length === 0}
                  className="animate-sorteo-boton-pulso inline-flex items-center justify-center gap-3 rounded-full bg-[#d4a017] py-4 pl-4 pr-9 font-condensed text-[18px] font-extrabold uppercase tracking-wide text-[#231a00] shadow-[0_14px_32px_-10px_rgba(212,160,23,0.6)] transition-all hover:-translate-y-0.5 hover:bg-[#e2b32a] active:translate-y-0 active:scale-[0.98] disabled:animate-none disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#231a00]/10">
                    <Sparkles size={18} strokeWidth={2.5} />
                  </span>
                  Comenzar sorteo
                </button>
                {segmentos.length === 0 && (
                  <p className="mt-3 text-[12px] text-white/35">Todavía no hay participantes registrados.</p>
                )}
                {error && <p className="mt-3 text-[12px] font-medium text-red-400">{error}</p>}
              </>
            )}
            {fase === "girando" && (
              <p className="font-condensed text-[13px] font-bold uppercase tracking-[0.22em] text-[#f0c352] animate-sorteo-titilar">
                Girando…
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── pantalla completa de ganador ────────────────────────── */}
      {fase === "ganador" && ganador && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-6 animate-fade-in"
          style={{ background: "radial-gradient(140% 100% at 50% 30%, #2b2b2d 0%, #18181a 45%, #0a0a0b 85%)" }}
        >
          <div
            className="pointer-events-none absolute animate-sorteo-rotar"
            style={{
              top: "50%",
              left: "50%",
              width: 900,
              height: 900,
              marginTop: -450,
              marginLeft: -450,
              background:
                "repeating-conic-gradient(from 0deg, rgba(212,160,23,0.12) 0deg 4deg, transparent 4deg 20deg)",
              borderRadius: 9999,
            }}
          />
          <ParticulasFlotantes />

          <div className="relative w-full max-w-md animate-sorteo-zoom text-center">
            <div className="relative mx-auto mb-6 flex h-28 w-28 items-center justify-center">
              <div
                className="pointer-events-none absolute inset-0 animate-sorteo-pulso rounded-full blur-lg"
                style={{ background: "radial-gradient(circle, rgba(212,160,23,0.55), transparent 70%)" }}
              />
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-b from-[#D4A017]/25 to-[#D4A017]/5 ring-1 ring-[#D4A017]/40 animate-sorteo-trofeo">
                <Trophy size={46} className="text-[#f5d375]" strokeWidth={1.5} />
              </div>
            </div>
            <div className="mb-3 flex items-center justify-center gap-2 font-condensed text-[14px] font-extrabold uppercase tracking-[0.22em] text-[#f0c352]">
              <PartyPopper size={18} strokeWidth={2.5} />
              ¡Tenemos ganador!
              <PartyPopper size={18} strokeWidth={2.5} />
            </div>
            <h2
              className="font-display uppercase leading-[0.95] text-white"
              style={{ fontSize: "clamp(38px, 11vw, 64px)", textShadow: "0 0 50px rgba(212,160,23,0.45), 0 6px 30px rgba(0,0,0,0.6)" }}
            >
              {ganador.nombre}
            </h2>
            <div className="mt-7 flex items-center justify-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3.5 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)]">
                <div className="text-[10px] font-bold uppercase tracking-wide text-white/40">Número</div>
                <div className="font-display text-[26px] text-[#D4A017]">#{ganador.numero_participante}</div>
              </div>
              {ganador.barrio && (
                <div className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3.5 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)]">
                  <MapPin size={14} className="text-white/40" strokeWidth={2.5} />
                  <div className="font-condensed text-[14px] font-semibold text-white">{ganador.barrio}</div>
                </div>
              )}
            </div>

            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={reiniciarConTodos}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-5 py-3 font-condensed text-[13px] font-bold uppercase tracking-wide text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
              >
                <RotateCcw size={14} strokeWidth={2.5} />
                Reiniciar sorteo con todos los participantes
              </button>
              <button
                onClick={seguirSinGanadorActual}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#D4A017]/30 bg-[#D4A017]/10 px-5 py-3 font-condensed text-[13px] font-bold uppercase tracking-wide text-[#f0c352] transition-colors hover:bg-[#D4A017]/20"
              >
                Seguir el sorteo sin el ganador actual
                <ArrowRight size={14} strokeWidth={2.5} />
              </button>
            </div>
            {error && <p className="mt-4 text-[12px] font-medium text-red-400">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
