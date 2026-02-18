"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Fireworks, { type FireworksHandlers } from "@fireworks-js/react";

gsap.registerPlugin(ScrollTrigger);

// Rutas base de assets (copia tu carpeta Assets dentro de public/ para que quede public/Assets/...)
const ASSETS = {
  textos: "/Assets/TEXTOS",
  recursos: "/Assets/RECURSOS",
  nombres: "/Assets/nombres",
} as const;

/** Genera la ruta de un asset (codifica el nombre por si tiene espacios). */
function asset(path: string, file: string) {
  return `${path}/${encodeURIComponent(file)}`;
}

const GOOGLE_MAPS_LINK = "https://maps.app.goo.gl/mVcKrYhK5jDT455p9";
const APPLE_MAPS_LINK = "https://maps.apple/p/c0tuRJGgrRLQ.y";

// Opciones para fireworks-js: tonos rosas (#D15366 / #CC6B7F ≈ hue 345–355)
const FIREWORKS_OPTIONS = {
  hue: { min: 345, max: 355 },
  delay: { min: 60, max: 100 },
  rocketsPoint: { min: 60, max: 70 },
  opacity: 1,
  particles: 80,
  traceLength: 4,
  acceleration: 1,
  explosion: 10,
  autoresize: true,
  sound: { enabled: false },
  mouse: { click: false, move: false },
};

const STORAGE_KEY = "hesed_invitado";

/** Formato visual teléfono: "XXX XXX XXXX" (solo dígitos, máx 10). */
function formatPhoneDisplay(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

type InvitadoRSVP = {
  nombre: string;
  numero: string;
  pases: number;
  confirmado: boolean;
  pasesConfirmados: number;
};

function saveInvitadoToStorage(inv: InvitadoRSVP) {
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(inv));
    } catch {}
  }
}

export default function Invitation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);
  const fireworksRefHero = useRef<FireworksHandlers | null>(null);
  const fireworksRefGracias = useRef<FireworksHandlers | null>(null);
  const [countdown, setCountdown] = useState({ days: "00", hours: "00", minutes: "00", seconds: "00" });

  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);
  const [invitadoData, setInvitadoData] = useState<InvitadoRSVP | null>(null);
  const [numeroInput, setNumeroInput] = useState("");
  const [numeroLoading, setNumeroLoading] = useState(false);
  const [numeroError, setNumeroError] = useState("");
  const [rsvpPasesElegidos, setRsvpPasesElegidos] = useState(1);
  const [rsvpConfirming, setRsvpConfirming] = useState(false);
  const [modalAsistireOpen, setModalAsistireOpen] = useState(false);
  const [modalNoAsistirOpen, setModalNoAsistirOpen] = useState(false);

  useEffect(() => {
    try {
      const s = window.sessionStorage.getItem(STORAGE_KEY);
      if (s) {
        const data = JSON.parse(s) as InvitadoRSVP;
        setInvitadoData(data);
        setRsvpPasesElegidos(data.pasesConfirmados > 0 ? data.pasesConfirmados : Math.min(1, data.pases));
      }
    } catch {}
    setHasCheckedStorage(true);
  }, []);

  const buscarInvitado = async () => {
    const n = numeroInput.replace(/\D/g, "").trim();
    if (!n.length) {
      setNumeroError("Ingresa un número válido");
      return;
    }
    setNumeroError("");
    setNumeroLoading(true);
    try {
      const res = await fetch(`/api/invitados?numero=${encodeURIComponent(n)}`);
      const data = await res.json();
      if (!res.ok) {
        setNumeroError(data.error || "No encontrado");
        return;
      }
      const inv: InvitadoRSVP = {
        nombre: data.nombre,
        numero: data.numero,
        pases: data.pases,
        confirmado: data.confirmado,
        pasesConfirmados: data.pasesConfirmados,
      };
      setInvitadoData(inv);
      setRsvpPasesElegidos(inv.pasesConfirmados > 0 ? inv.pasesConfirmados : Math.min(1, inv.pases));
      saveInvitadoToStorage(inv);
    } catch {
      setNumeroError("Error de conexión");
    } finally {
      setNumeroLoading(false);
    }
  };

  const confirmarAsistencia = async (asistira: boolean) => {
    if (!invitadoData) return;
    setRsvpConfirming(true);
    try {
      const res = await fetch("/api/invitados/confirmar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numero: invitadoData.numero,
          asistira,
          pasesConfirmados: asistira ? rsvpPasesElegidos : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNumeroError(data.error || "Error al confirmar");
        return;
      }
      const updated: InvitadoRSVP = {
        ...invitadoData,
        confirmado: true,
        pasesConfirmados: asistira ? rsvpPasesElegidos : 0,
      };
      setInvitadoData(updated);
      saveInvitadoToStorage(updated);
    } catch {
      setNumeroError("Error de conexión");
    } finally {
      setRsvpConfirming(false);
    }
  };

  useEffect(() => {
    const target = new Date("2026-03-14T15:00:00");
    const update = () => {
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown({ days: "00", hours: "00", minutes: "00", seconds: "00" });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown({
        days: String(days).padStart(2, "0"),
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0"),
      });
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!invitadoData) return;
    const hero = sectionsRef.current[0];
    if (!hero) return;
    const castle = hero.querySelector("[data-hero-castle]");
    const title = hero.querySelector("[data-hero-title]");
    const subtitle = hero.querySelector("[data-hero-subtitle]");
    if (castle) gsap.fromTo(castle, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power2.out" });
    if (title) gsap.fromTo(title, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, delay: 0.2, ease: "power2.out" });
    if (subtitle) gsap.fromTo(subtitle, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, delay: 0.4, ease: "power2.out" });
  }, [invitadoData]);

  useEffect(() => {
    if (!invitadoData) return;
    const sections = sectionsRef.current.filter((s): s is HTMLElement => s != null);
    if (!sections.length) return;

    sections.forEach((section) => {
      if (!section) return;
      const title = section.querySelector("[data-animate-title]");
      const content = section.querySelector("[data-animate-content]");
      const decor = section.querySelectorAll("[data-animate-decor]");

      gsap.fromTo(
        section,
        {  },
        {
          duration: 0.6,
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            end: "top 30%",
            scrub: 0.8,
          },
        }
      );

      if (title) {
        gsap.fromTo(
          title,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: { trigger: section, start: "top 85%", toggleActions: "play none none reverse" },
          }
        );
      }
      if (content) {
        gsap.fromTo(
          content,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            delay: 0.15,
            ease: "power2.out",
            scrollTrigger: { trigger: section, start: "top 85%", toggleActions: "play none none reverse" },
          }
        );
      }
      decor.forEach((el, j) => {
        gsap.fromTo(
          el,
          { scale: 0, opacity: 0, rotation: -15 },
          {
            scale: 1,
            opacity: 1,
            rotation: 0,
            duration: 0.6,
            delay: j * 0.1,
            ease: "back.out(1.2)",
            scrollTrigger: { trigger: section, start: "top 80%", toggleActions: "play none none reverse" },
          }
        );
      });
    });

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, [invitadoData]);

  // Animaciones infinitas: estrellas (rotar, pulso), reloj (oscilación), algunas al hacer scroll
  useEffect(() => {
    if (!invitadoData) return;
    // Rotación lenta infinita (estrellas)
    gsap.utils.toArray<HTMLElement>("[data-gsap-rotate]").forEach((el) => {
      gsap.to(el, {
        rotation: 360,
        duration: 12 + Math.random() * 4,
        repeat: -1,
        ease: "none",
        transformOrigin: "center center",
      });
    });

    // Pulso: crecer y reducir en bucle (estrellas / lazos)
    // Movimiento suave arriba-abajo infinito (flotar)
    gsap.utils.toArray<HTMLElement>("[data-gsap-pulse]").forEach((el, i) => {
      gsap.to(el, {
        y: -12,
        duration: 2 + (i % 2) * 0.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    });

    // Reloj: oscilar de un lado a otro (-18° a 18°)
    gsap.utils.toArray<HTMLElement>("[data-gsap-clock]").forEach((el) => {
      gsap.fromTo(
        el,
        { rotation: -18 },
        {
          rotation: 18,
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          transformOrigin: "center center",
        }
      );
    });

    // Castillo: movimiento suave izquierda-derecha en bucle (vaivén)
    gsap.utils.toArray<HTMLElement>("[data-gsap-sway]").forEach((el) => {
      gsap.fromTo(
        el,
        { x: -10 },
        {
          x: 10,
          duration: 3,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        }
      );
    });

    // Rotación ligada al scroll (estrella que gira al hacer scroll)
    gsap.utils.toArray<HTMLElement>("[data-gsap-scroll-rotate]").forEach((el) => {
      gsap.to(el, {
        rotation: 360,
        ease: "none",
        scrollTrigger: {
          trigger: el.closest("section") || el,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.5,
        },
        transformOrigin: "center center",
      });
    });

    return () => {
      gsap.killTweensOf("[data-gsap-rotate], [data-gsap-pulse], [data-gsap-clock], [data-gsap-scroll-rotate], [data-gsap-sway]");
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [invitadoData]);

  const setSectionRef = (el: HTMLElement | null, index: number) => {
    if (el) sectionsRef.current[index] = el;
  };

  // Bucle infinito: lanzar 4 fuegos en Hero y en "Gracias" cada ~3.2s
  const fireworksIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!invitadoData) return;
    const startTimeout = setTimeout(() => {
      fireworksRefHero.current?.start();
      fireworksRefGracias.current?.start();
      fireworksRefHero.current?.launch(4);
      fireworksRefGracias.current?.launch(4);
      fireworksIntervalRef.current = setInterval(() => {
        fireworksRefHero.current?.launch(4);
        fireworksRefGracias.current?.launch(4);
      }, 3200);
    }, 800);
    return () => {
      clearTimeout(startTimeout);
      if (fireworksIntervalRef.current) clearInterval(fireworksIntervalRef.current);
    };
  }, [invitadoData]);

  if (!hasCheckedStorage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8e8eb]">
        <p className="text-[#D15366] font-medium">Cargando...</p>
      </div>
    );
  }

  if (invitadoData === null) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f8e8eb] p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-[#D15366] border-2 border-[#D15366]/30">
          <h3 className="text-lg font-bold uppercase tracking-wider mb-2 text-center">Bienvenido</h3>
          <p className="text-sm text-gray-600 mb-4 text-center">Ingresa el número de teléfono con el que fuiste invitado para continuar.</p>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="961 238 5401"
            value={formatPhoneDisplay(numeroInput)}
            onChange={(e) => setNumeroInput(e.target.value.replace(/\D/g, "").slice(0, 10))}
            className="w-full rounded-xl border-2 border-[#D15366]/50 px-4 py-2 text-[#D15366] placeholder:text-gray-400 mb-2"
            maxLength={12}
          />
          {numeroError && <p className="text-sm text-red-600 mb-2">{numeroError}</p>}
          <button type="button" onClick={buscarInvitado} disabled={numeroLoading} className="w-full rounded-xl bg-[#D15366] py-2 text-sm font-bold uppercase text-white disabled:opacity-60">
            {numeroLoading ? "Buscando..." : "Entrar"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="snap-sections relative min-h-screen md:w-1/3 mx-auto">
      {/* Modal: elegir cantidad de pases al pulsar Asistiré */}
      {modalAsistireOpen && invitadoData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setModalAsistireOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-[#D15366]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold uppercase tracking-wider mb-2 text-center">Asistiré</h3>
            <p className="text-sm text-gray-600 mb-4 text-center">Pases asignados: {invitadoData.pases}. Elige cuántos confirmas:</p>
            <select
              value={rsvpPasesElegidos}
              onChange={(e) => setRsvpPasesElegidos(Number(e.target.value))}
              className="w-full rounded-xl border-2 border-[#D15366]/50 px-4 py-2 text-[#D15366] mb-4 bg-white"
            >
              {Array.from({ length: invitadoData.pases }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n} {n === 1 ? "pase" : "pases"}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button type="button" onClick={() => setModalAsistireOpen(false)} className="flex-1 rounded-xl border-2 border-[#D15366] py-2 text-sm font-bold uppercase text-[#D15366]">Cancelar</button>
              <button
                type="button"
                onClick={async () => {
                  await confirmarAsistencia(true);
                  setModalAsistireOpen(false);
                }}
                disabled={rsvpConfirming}
                className="flex-1 rounded-xl bg-[#D15366] py-2 text-sm font-bold uppercase text-white disabled:opacity-60"
              >
                {rsvpConfirming ? "Enviando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal: confirmar "No asistiré" */}
      {modalNoAsistirOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setModalNoAsistirOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-[#D15366]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold uppercase tracking-wider mb-2 text-center">No asistiré</h3>
            <p className="text-sm text-gray-600 mb-6 text-center">¿Confirmas que no asistirás?</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setModalNoAsistirOpen(false)} className="flex-1 rounded-xl border-2 border-[#D15366] py-2 text-sm font-bold uppercase text-[#D15366]">Cancelar</button>
              <button
                type="button"
                onClick={async () => {
                  await confirmarAsistencia(false);
                  setModalNoAsistirOpen(false);
                }}
                disabled={rsvpConfirming}
                className="flex-1 rounded-xl bg-[#D15366] py-2 text-sm font-bold uppercase text-white disabled:opacity-60"
              >
                {rsvpConfirming ? "Enviando..." : "Aceptar"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Fondo de la invitación (FONDO.png) en toda la página */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url(${asset(ASSETS.recursos, "FONDO.png")})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "scroll",
        }}
        aria-hidden
      />

      {/* Contenido por encima del fondo para que los bg de las secciones se vean */}
      <div className="relative z-10">
      {/* Hero */}
      <section
        ref={(el) => setSectionRef(el, 0)}
        className="snap-section relative flex  flex-col items-center justify-center overflow-hidden px-6 pt-12 pb-8"
      >
        <Fireworks
          ref={fireworksRefHero}
          options={FIREWORKS_OPTIONS}
          autostart={false}
          className="absolute inset-0 z-[-1] pointer-events-none opacity-50"
          style={{ width: "100%", height: "100%" }}
        />
        <div className="absolute inset-0 overflow-hidden">
          <div data-animate-decor data-gsap-rotate className="absolute left-[5%] top-[5%] h-14 w-14">
            <Image src={asset(ASSETS.recursos, "ESTRELLA.png")} alt="" width={100} height={100} className="h-full w-full object-contain" />
          </div>
          <div data-animate-decor data-gsap-clock className="absolute right-[5%] top-[5%] h-14 w-14">
            <Image src={asset(ASSETS.recursos, "MONO.png")} alt="" width={100} height={100} className="h-full w-full object-contain" />
          </div>
          <div data-animate-decor data-gsap-scroll-rotate className="absolute bottom-[25%] left-[5%] h-8 w-8">
            <Image src={asset(ASSETS.recursos, "ESTRELLAA DORADAA.png")} alt="" width={40} height={40} className="h-full w-full object-contain" />
          </div>
          <div data-animate-decor data-gsap-scroll-rotate className="absolute bottom-[30%] right-[1%] h-18 w-18">
            <Image src={asset(ASSETS.recursos, "ESTRELLAA DORADAA.png")} alt="" width={100} height={100} className="h-full w-full object-contain" />
          </div>
        </div>
        <div data-hero-castle data-animate-decor data-gsap-sway className="relative mb-4 w-full -top-[5%] max-w-[320px]">
          <Image src={asset(ASSETS.recursos, "CASTILLO.png")} alt="" width={520} height={432} className="w-full h-auto object-contain mt-20" priority />
        </div>
        <div data-hero-title data-animate-title className="absolute w-full translate-y-[-50%] top-110 max-w-[280px] md:top-2/3">
          <Image src={asset(ASSETS.textos, "nombre hesed.png")} alt="Hesed" width={280} height={80} className="w-full h-auto object-contain" />
        </div>
        <p data-hero-subtitle data-animate-content className="mt-14 ml-10 text-sm font-semibold uppercase tracking-[0.2em] text-[#D15366] sm:text-base">
          Mi 1er cumpleaños
        </p>
      </section>

      {/* Mensaje - globo + texto intro como imagen */}
      <section
        ref={(el) => setSectionRef(el, 1)}
        className="snap-section relative flex flex-col items-center justify-center px-6 bg-gradient-to-t from-[#CC6B7F]/50 from-[10%] to-transparent "
      >
        {/* <div data-animate-decor className="absolute left-[8%] top-[20%] h-6 w-6 opacity-60">
          <Image src={asset(ASSETS.recursos, "ESTRELLA.png")} alt="" width={24} height={24} className="h-full w-full object-contain" />
        </div> */}
        {/* <div data-animate-decor className="absolute right-[10%] bottom-[15%] h-5 w-5 opacity-60">
          <Image src={asset(ASSETS.recursos, "ESTRELLAA DORADAA.png")} alt="" width={20} height={20} className="h-full w-full object-contain" />
        </div> */}
        <div data-animate-title className="mb-2 w-full max-w-md" />
        <div data-animate-content data-animate-decor data-gsap-pulse className="relative w-full max-w-md">
          <Image
            src={asset(ASSETS.recursos, "GLOBO TTEXTO.png")}
            alt=""
            width={400}
            height={320}
            className="mx-auto w-full h-auto object-contain"
          />
          <div className="absolute inset-0 flex items-center justify-center px-8 py-12 sm:px-12 sm:py-14 -mt-10 w-80 mx-auto">
            <Image
              src={asset(ASSETS.textos, "TEXTO INTRO.png")}
              alt="Hace un año llegué para llenar de amor cada rincón de nuestro hogar. Hoy celebro mi primer vuelta al sol y quiero que seas parte de este momento tan especial."
              width={220}
              height={200}
              className="w-full h-auto object-contain object-center"
            />
          </div>
        </div>
      </section>

      {/* Countdown - relative + z-20 para quedar encima del globo de la sección anterior */}
      <section
        ref={(el) => setSectionRef(el, 2)}
        className="snap-section relative z-20 flex flex-col items-center justify-center bg-[#CC6B7F] py-3 -mt-20"
      >
        <div data-animate-title className="w-full max-w-[100px] ">
          <Image src={asset(ASSETS.textos, "FALTAN.png")} alt="Faltan:" width={100} height={100} className="w-full h-auto object-contain" />
        </div>
        <div data-animate-content className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-6">
          <div className="flex flex-col items-center">
            <span className="text-3xl font-semibold text-white sm:text-5xl md:text-6xl">{countdown.days}</span>
            <span className="text-xs uppercase tracking-wider text-white/90">Días</span>
          </div>
          <span className="text-4xl font-semibold text-white/80">|</span>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-semibold text-white sm:text-5xl md:text-6xl">{countdown.hours}</span>
            <span className="text-xs uppercase tracking-wider text-white/90">Horas</span>
          </div>
          <span className="text-4xl font-semibold text-white/80">|</span>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-semibold text-white sm:text-5xl md:text-6xl">{countdown.minutes}</span>
            <span className="text-xs uppercase tracking-wider text-white/90">Min</span>
          </div>
          <span className="text-4xl font-semibold text-white/80">|</span>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-semibold text-white sm:text-5xl md:text-6xl">{countdown.seconds}</span>
            <span className="text-xs uppercase tracking-wider text-white/90">Seg</span>
          </div>
        </div>
      </section>

      {/* Fecha y Hora */}
      <section
        ref={(el) => setSectionRef(el, 3)}
        className="snap-section relative flex flex-col items-center justify-center gap-10 px-6 py-6 bg-[#D15366]/35"
      >
        {/* <div data-animate-decor className="absolute right-[12%] top-[18%] h-6 w-6 opacity-50">
          <Image src={asset(ASSETS.recursos, "ESTRELLA.png")} alt="" width={24} height={24} className="h-full w-full object-contain" />
        </div> */}
        <div className="absolute inset-0 overflow-hidden">
          <div data-animate-decor data-gsap-scroll-rotate className="absolute left-[5%] top-[5%] h-14 w-14">
            <Image src={asset(ASSETS.recursos, "ESTRELLA.png")} alt="" width={100} height={100} className="h-full w-full object-contain" />
          </div>
          <div data-animate-decor data-gsap-pulse className="absolute right-[5%] top-[5%] h-14 w-14">
            <Image src={asset(ASSETS.recursos, "MONO.png")} alt="" width={100} height={100} className="h-full w-full object-contain" />
          </div>
          <div data-animate-decor data-gsap-rotate className="absolute bottom-[35%] left-[5%] h-8 w-8">
            <Image src={asset(ASSETS.recursos, "ESTRELLAA DORADAA.png")} alt="" width={40} height={40} className="h-full w-full object-contain" />
          </div>
          <div data-animate-decor data-gsap-scroll-rotate className="absolute bottom-[10%] right-[8%] h-18 w-18">
            <Image src={asset(ASSETS.recursos, "ESTRELLAA DORADAA.png")} alt="" width={100} height={100} className="h-full w-full object-contain" />
          </div>
        </div>
        <div data-animate-title className="flex flex-col items-center gap-4">
          <div className="w-full max-w-[100px]">
            <Image src={asset(ASSETS.textos, "FECHA.png")} alt="Fecha:" width={100} height={100} className="w-full h-auto object-contain" />
          </div>
          <div className="flex items-center gap-3">
            <Image src={asset(ASSETS.recursos, "CALENDARIO.png")} alt="" width={80} height={80} className="object-contain" />
            <span className="text-xl font-bold uppercase tracking-wider text-[#D15366] sm:text-xl leading-tight">Sábado <br /> 14 de <br /> marzo</span>
          </div>
        </div>
        <div data-animate-content className="flex flex-col items-center gap-4">
          <div className="w-full max-w-[100px]">
            <Image src={asset(ASSETS.textos, "HORA.png")} alt="Hora:" width={100} height={100} className="w-full h-auto object-contain" />
          </div>
          <div className="flex items-center gap-3">
            <div data-gsap-clock className="inline-flex shrink-0">
              <Image src={asset(ASSETS.recursos, "RELOJ.png")} alt="" width={80} height={80} className="object-contain" />
            </div>
            <span className="text-xl font-bold uppercase tracking-wider text-[#D15366] sm:text-xl leading-tight">03:00 <br /> PM</span>
          </div>
        </div>
      </section>

      {/* Lugar */}
      <section
        ref={(el) => setSectionRef(el, 4)}
        className="snap-section relative flex flex-col items-center justify-center px-6 py-6 bg-[#D15366]/35"
      >
        <div data-animate-title className="mb-4 w-full max-w-[100px]">
          <Image src={asset(ASSETS.textos, "LUGAAR.png")} alt="Lugar:" width={100} height={100} className="w-full h-auto object-contain" />
        </div>
        <p data-animate-content className="max-w-md text-center text-sm font-semibold uppercase leading-relaxed text-[#D15366] sm:text-base leading-tight">
          Salón de los Abuelos<br />Callejón Santo Domingo <br />y Circuito Las Casas Sur
        </p>
        <p data-animate-content className="mt-4 text-xs text-[#D15366]/90 uppercase">Ver ubicación en:</p>
        <div data-animate-content className="mt-3 flex flex-wrap gap-3 justify-center">
          <a
            href={GOOGLE_MAPS_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-[#CC6B7F] px-6 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lg transition hover:bg-[#b84556] active:scale-[0.98]"
          >
            Google Maps
          </a>
          <a
            href={APPLE_MAPS_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border-2 border-[#CC6B7F] bg-transparent px-6 py-3 text-sm font-bold uppercase tracking-wider text-[#D15366] transition hover:bg-[#CC6B7F]/10 active:scale-[0.98]"
          >
            Apple Maps
          </a>
        </div>
        <div className="absolute left-[10%] top-[25%] h-10 w-10 opacity-70">
          <Image src={asset(ASSETS.recursos, "MONO.png")} alt="" width={40} height={40} className="h-full w-full object-contain" />
        </div>
        <div data-hero-castle data-animate-decor data-gsap-sway className="absolute bottom-[10%] right-[8%] h-12 w-12">
          <Image src={asset(ASSETS.recursos, "ESTRELLAA DORADAA.png")} alt="" width={100} height={100} className="h-full w-full object-contain" />
        </div>
      </section>

      {/* Código de vestimenta */}
      <section
        ref={(el) => setSectionRef(el, 5)}
        className="snap-section relative flex flex-col items-center justify-center px-6 py-12 bg-[#D15366]/35"
      >
        <div className="absolute inset-0 overflow-hidden">
          {/* <div data-animate-decor className="absolute left-[5%] top-[5%] h-14 w-14 opacity-70">
            <Image src={asset(ASSETS.recursos, "ESTRELLA.png")} alt="" width={100} height={100} className="h-full w-full object-contain" />
          </div>
          <div data-animate-decor className="absolute right-[5%] top-[5%] h-14 w-14 opacity-80">
            <Image src={asset(ASSETS.recursos, "MONO.png")} alt="" width={100} height={100} className="h-full w-full object-contain" />
          </div> */}

        </div>
        <div data-animate-title className="mb-6 w-full max-w-[150px]">
          <Image src={asset(ASSETS.textos, "CODIGO DE VESTIMENTA.png")} alt="Código de vestimenta:" width={100} height={100} className="w-full h-auto object-contain" />
        </div>
        <div data-animate-content className="flex max-w-sm flex-col items-center gap-4 flex-row sm:gap-6">
          <Image data-animate-decor data-gsap-pulse src={asset(ASSETS.recursos, "VESTIDITO.png")} alt="" width={96} height={96} className="shrink-0 object-contain" />
          <p className="text-left text-sm font-medium text-[#D15366] sm:text-left uppercase leading-tight">
            <span className="font-bold">El color rosa </span> <br /> está reservado <br /> para la cumpleañera <br /> y sus padres.
          </p>
        </div>
      </section>

      {/* RSVP */}
      {/* <section
        ref={(el) => setSectionRef(el, 6)}
        className="snap-section relative flex flex-col items-center justify-center px-6 py-12"
      >
        <div data-animate-decor className="absolute left-[8%] top-[15%] h-5 w-5 opacity-50">
          <Image src={asset(ASSETS.recursos, "ESTRELLA.png")} alt="" width={20} height={20} className="h-full w-full object-contain" />
        </div>
        <div data-animate-title className="w-full max-w-[320px]">
          <Image src={asset(ASSETS.textos, "CONFIRMA AASISTENCIAA.png")} alt="Confirma tu asistencia antes del: 01 de marzo" width={320} height={80} className="w-full h-auto object-contain" />
        </div>
        <div data-animate-content className="mt-4 w-full max-w-[260px]">
          <Image src={asset(ASSETS.nombres, "CINTHYA LILIANA.png")} alt="Cinthya Liliana" width={260} height={70} className="w-full h-auto object-contain" />
        </div>
        <div data-animate-content className="mt-8 flex flex-col gap-4 sm:flex-row">
          <a
            href={`https://wa.me/529618572327?text=${encodeURIComponent("¡Asistiré al cumpleaños de Hesed!")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-[#D15366] px-8 py-3 text-center text-sm font-bold uppercase tracking-wider text-white shadow-lg transition hover:bg-[#b84556] active:scale-[0.98]"
          >
            Asistiré
          </a>
          <a
            href={`https://wa.me/529618572327?text=${encodeURIComponent("Lamento no poder asistir al cumpleaños de Hesed.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border-2 border-[#D15366] bg-transparent px-8 py-3 text-center text-sm font-bold uppercase tracking-wider text-[#D15366] transition hover:bg-[#D15366]/10 active:scale-[0.98]"
          >
            No asistiré
          </a>
        </div>
        <p className="mt-6 max-w-xs text-center text-xs text-[#8b3d4a]/80">
          En caso de que no puedas asistir después de la fecha límite, contacta directamente.
        </p>
      </section> */}

   {/* RSVP */}
      <section
        ref={(el) => setSectionRef(el, 1)}
        className="snap-section relative flex flex-col items-center justify-center  bg-gradient-to-t from-transparent from-[10%] to-[#D15366]/35"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div data-animate-decor data-gsap-scroll-rotate className="absolute bottom-[75%] left-[5%] h-18 w-18">
            <Image src={asset(ASSETS.recursos, "ESTRELLAA DORADAA.png")} alt="" width={100} height={100} className="h-full w-full object-contain" />
          </div>
          <div data-animate-decor data-gsap-rotate className="absolute bottom-[70%] right-[3%] h-15 w-15">
            <Image src={asset(ASSETS.recursos, "ESTRELLA.png")} alt="" width={100} height={100} className="h-full w-full object-contain" />
          </div>
        </div>
        <div data-animate-title className="mb-2 w-full max-w-md" />
        <div data-animate-content className="relative w-full max-w-md">
          <Image
            src={asset(ASSETS.recursos, "GLOBO TTEXTO.png")}
            alt=""
            width={500}
            height={400}
            className="mx-auto w-full h-auto object-contain"
          />
          <div className="absolute inset-0 items-center justify-center px-4 mt-12 sm:px-12  w-80 m-auto">
            <div data-animate-title className="w-full max-w-[220px] mx-auto">
              <Image src={asset(ASSETS.textos, "CONFIRMA AASISTENCIAA.png")} alt="Confirma tu asistencia antes del: 01 de marzo" width={320} height={80} className="w-full h-auto object-contain" />
            </div>
            <div data-animate-content className="mt-4 w-full max-w-[200px] mx-auto text-center">
              <p className="text-lg font-semibold uppercase tracking-wider text-[#D15366]">{invitadoData.nombre}</p>
            </div>
            {invitadoData.confirmado ? (
              <div data-animate-content className="mt-4 text-center">
                {invitadoData.pasesConfirmados > 0 ? (
                  <p className="text-sm font-medium text-[#D15366]">Ya tienes tu pase{invitadoData.pasesConfirmados > 1 ? ` (${invitadoData.pasesConfirmados} personas)` : ""}. Disfruta la invitación.</p>
                ) : (
                  <p className="text-sm font-medium text-[#D15366]">Has indicado que no asistirás. Gracias por avisar.</p>
                )}
              </div>
            ) : (
              <>
                {numeroError && <p className="text-sm text-red-600 mb-2 text-center">{numeroError}</p>}
                <div data-animate-content className="mt-4 flex flex-col gap-1 flex-row justify-around items-center">
                  <button
                    type="button"
                    onClick={() => setModalNoAsistirOpen(true)}
                    disabled={rsvpConfirming}
                    className="rounded-xl border-2 border-[#D15366] bg-transparent px-4 py-2 text-center text-xs font-bold uppercase tracking-wider text-[#D15366] transition hover:bg-[#D15366]/10 active:scale-[0.98] disabled:opacity-60"
                  >
                    No asistiré
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalAsistireOpen(true)}
                    disabled={rsvpConfirming}
                    className="rounded-xl bg-[#D15366] px-6 py-2 text-center text-xs font-bold uppercase tracking-wider text-white shadow-lg transition hover:bg-[#b84556] active:scale-[0.98] disabled:opacity-60"
                  >
                    Asistiré
                  </button>
                </div>
              </>
            )}
            <p className="mt-5 text-center text-xs text-[#D15366] uppercase">
              En caso de que no puedas asistir después de la fecha límite, contacta directamente.
            </p>
          </div>
        </div>
      </section>

      {/* GRACIAS POR ASISTIR */}
      <section
        ref={(el) => setSectionRef(el, 7)}
        className="snap-section relative flex  flex-col items-center justify-center overflow-hidden px-6 pt-12 pb-8"
      >
        <Fireworks
          ref={fireworksRefGracias}
          options={FIREWORKS_OPTIONS}
          autostart={false}
          className="absolute inset-0 z-[-1] pointer-events-none opacity-50"
          style={{ width: "100%", height: "100%" }}
        />
        <div className="absolute inset-0 overflow-hidden">
          <div data-animate-decor data-gsap-scroll-rotate className="absolute left-[5%] top-[5%] h-14 w-14 opacity-70">
            <Image src={asset(ASSETS.recursos, "ESTRELLA.png")} alt="" width={100} height={100} className="h-full w-full object-contain" />
          </div>
          <div data-animate-decor data-gsap-pulse className="absolute right-[5%] top-[5%] h-14 w-14 opacity-80">
            <Image src={asset(ASSETS.recursos, "MONO.png")} alt="" width={100} height={100} className="h-full w-full object-contain" />
          </div>
          <div data-animate-decor data-gsap-rotate className="absolute bottom-[25%] left-[5%] h-8 w-8 opacity-80">
            <Image src={asset(ASSETS.recursos, "ESTRELLAA DORADAA.png")} alt="" width={40} height={40} className="h-full w-full object-contain" />
          </div>
          <div data-animate-decor data-gsap-pulse className="absolute bottom-[30%] right-[8%] h-12 w-12 opacity-70">
            <Image src={asset(ASSETS.recursos, "ESTRELLAA DORADAA.png")} alt="" width={24} height={24} className="h-full w-full object-contain" />
          </div>
        </div>
        <div data-hero-castle data-animate-decor data-gsap-sway className="relative mb-4 w-full -top-[5%] max-w-[320px]">
          <Image src={asset(ASSETS.recursos, "CASTILLO.png")} alt="" width={520} height={432} className="w-full h-auto object-contain mt-20" priority />
        </div>
        <div data-hero-title data-animate-title className="absolute w-full translate-y-[-50%] top-110 max-w-[280px] md:top-2/3">
          <Image src={asset(ASSETS.textos, "nombre hesed.png")} alt="Hesed" width={280} height={80} className="w-full h-auto object-contain" />
        </div>
        <p data-hero-subtitle data-animate-content className="mt-14 ml-10 text-sm font-semibold uppercase tracking-[0.2em] text-[#D15366] sm:text-base">
          Mi 1er cumpleaños
        </p>
      </section>
      </div>
    </div>
  );
}
