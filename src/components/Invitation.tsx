"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { initTextAnimations } from "@/lib/textAnimations";
import Fireworks, { type FireworksHandlers } from "@fireworks-js/react";
import Birds from "@/components/Birds";

gsap.registerPlugin(ScrollTrigger);

// Rutas base de assets (copia tu carpeta Assets dentro de public/ para que quede public/Assets/...)
const ASSETS = {
  textos: "/Assets/TEXTOS",
  recursos: "/Assets/RECURSOS",
  nombres: "/Assets/nombres",
  elementos: "/Assets/ELEMENTOS"
} as const;

/** Genera la ruta de un asset (codifica el nombre por si tiene espacios). */
function asset(path: string, file: string) {
  return `${path}/${encodeURIComponent(file)}`;
}

const GOOGLE_MAPS_LINK = "https://maps.app.goo.gl/QiZ6GNFLGTiuuYDm8";
const APPLE_MAPS_LINK = "https://maps.apple/p/-YkAN-fI9CzBcj";
const ENLACE_ITEM_1 = ""; // pega aquí la URL del primer botón
const ENLACE_ITEM_2 = ""; // pega aquí la URL del segundo botón

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
    const isOpen = modalAsistireOpen || modalNoAsistirOpen;
    if (isOpen) {
      const sbWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${sbWidth}px`;
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [modalAsistireOpen, modalNoAsistirOpen]);

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
    const target = new Date("2026-06-20T15:00:00");
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

    // gsap.context() scopes all tweens to `hero` and handles cleanup on return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // ① papel picado — cae como tela y luego ondea con viento
      const picado = hero.querySelector<HTMLElement>(".absolute.inset-0 > div");
      if (picado) {
        gsap.set(picado, { transformOrigin: "top center" });

        // caída inicial
        tl.fromTo(picado,
          { scaleY: 0, opacity: 0 },
          { scaleY: 1, opacity: 1, duration: 1.4, ease: "elastic.out(1, 0.5)" },
          0
        );

        // viento — skewX: el borde superior queda fijo, el fondo se balancea
        gsap.to(picado, {
          skewX: 5,
          duration: 2.8,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: 1.3,
        });

        // ráfaga complementaria con duración distinta → movimiento no mecánico
        gsap.to(picado, {
          scaleX: 1.025,
          y: -6,
          duration: 3.6,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: 1.9,
        });
      }

      // ② imagen base (BASE_INTRO) — sube desde abajo con fade
      const baseImg = hero.querySelector<HTMLElement>("[data-hero-castle] > img:first-child");
      if (baseImg)
        tl.fromTo(baseImg,
          { y: 60, opacity: 0 },
          { y: 0, opacity: 1, duration: 1.1, ease: "power3.out" },
          0
        );

      // ③ corazón — aparece con rebote y leve rotación
      const heart = hero.querySelector<HTMLElement>("[data-hero-castle] > img:nth-child(2)");
      if (heart)
        tl.fromTo(heart,
          { scale: 0, rotation: -20, opacity: 0 },
          { scale: 1, rotation: 0, opacity: 1, duration: 0.65, ease: "back.out(2.5)" },
          0.4
        );

      // ④ bloques de texto — cascada stagger de arriba a abajo
      const textBlocks = hero.querySelectorAll<HTMLElement>("[data-hero-castle] > div > div");
      if (textBlocks.length)
        tl.fromTo(textBlocks,
          { y: 28, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.55, stagger: 0.14, ease: "power2.out" },
          0.5
        );
    }, hero);

    return () => ctx.revert();
  }, [invitadoData]);

  // Cloth unfurl + wind loop — scroll-triggered, for all [data-picado-wind] elements
  useEffect(() => {
    if (!invitadoData || !containerRef.current) return;
    const kills: Array<() => void> = [];

    containerRef.current.querySelectorAll<HTMLElement>("[data-picado-wind]").forEach(el => {
      gsap.set(el, { transformOrigin: "top center", scaleY: 0, opacity: 0 });

      let windTweens: gsap.core.Tween[] = [];

      const startWind = () => {
        windTweens.forEach(t => t.kill());
        windTweens = [
          gsap.to(el, { skewX: 5, duration: 2.8, ease: "sine.inOut", repeat: -1, yoyo: true }),
          gsap.to(el, { scaleX: 1.025, y: -6, duration: 3.6, ease: "sine.inOut", repeat: -1, yoyo: true }),
        ];
      };

      const stopWind = () => {
        windTweens.forEach(t => t.kill());
        windTweens = [];
      };

      const st = ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        onEnter: () => {
          gsap.to(el, {
            scaleY: 1, opacity: 1, duration: 1.4, ease: "elastic.out(1, 0.5)",
            onComplete: startWind,
          });
        },
        onLeaveBack: () => {
          stopWind();
          gsap.to(el, { scaleY: 0, opacity: 0, duration: 0.5, ease: "power2.in" });
        },
      });

      kills.push(() => { stopWind(); st.kill(); });
    });

    return () => kills.forEach(fn => fn());
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

  // Text animations — must run last so all other GSAP anims are already set up
  useEffect(() => {
    if (!invitadoData || !containerRef.current) return;
    return initTextAnimations(containerRef.current);
  }, [invitadoData]);

  if (!hasCheckedStorage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8e8eb] overflow-hidden">
        <p className="text-[#D15366] font-medium">Cargando...</p>
      </div>
    );
  }

  if (invitadoData === null) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f8e8eb] p-4 overflow-hidden">
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
    <div ref={containerRef} className="snap-sections relative min-h-screen md:w-1/3 mx-auto overflow-hidden">
      
      {/* Modal: elegir cantidad de pases al pulsar Asistiré */}
      {modalAsistireOpen && invitadoData && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4" onClick={() => setModalAsistireOpen(false)}>
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
        </div>,
        document.body
      )}
      {/* Modal: confirmar "No asistiré" */}
      {modalNoAsistirOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4" onClick={() => setModalNoAsistirOpen(false)}>
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
        </div>,
        document.body
      )}
      {/* Fondo de la invitación (FONDO.png) en toda la página */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        // style={{
        //   backgroundImage: `url(${asset(ASSETS.recursos, "FONDO.png")})`,
        //   backgroundSize: "cover",
        //   backgroundPosition: "center",
        //   backgroundRepeat: "no-repeat",
        //   backgroundAttachment: "scroll",
        // }}
        aria-hidden
      />
        <Birds count={6} />
      {/* Contenido por encima del fondo para que los bg de las secciones se vean */}
      <div className="relative z-100 bg-[#FFDdD7] overflow-hidden">
      
      {/* Hero */}
      <section
        ref={(el) => setSectionRef(el, 0)}
        className="snap-section relative flex  flex-col items-center justify-center overflow-hidden px-6 pt-12 pb-8">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 h-auto w-full">
            <Image src={asset(ASSETS.elementos, "papel_picado.png")} alt="" width={500} height={100} className="h-full w-full object-contain scale-101" />
          </div>

        </div>
        <div data-hero-castle data-animate-decor data-gsap-sway className="relative mb-4 w-full -top-[5%]">
          <Image src={asset(ASSETS.elementos, "BASE_INTRO.png")} alt="" width={600} height={500} className="w-full h-auto object-contain mt-20" priority />
          <Image src={asset(ASSETS.elementos, "corazon_final.png")} alt="" width={600} height={500} className="absolute z-5 top-10 left-1/2 -translate-x-1/2 w-20 h-auto object-contain mt-20" priority />

            <div className="absolute z-5 top-60 w-full text-center">
              <div className=" text-white uppercase text-sm">
                <p>con mucha ilusión y amor, <br /> quiero invitarte a compartir <br /> conmigo un día muy especial:</p>
              </div>

              <div className=" text-white uppercase">
                <h2 data-text-anim="wave" data-text-anim-delay="1.2" className="text-5xl">mi bautizo</h2>
                <p className="text-xl">y mi primer año</p>
              </div>

              <div className="text-white uppercase text-sm mt-5">
                <p>Mis papás y yo:</p>
              </div>

              <div className=" text-white">
                <h2 data-text-anim="wave" data-text-anim-delay="1.2" className="text-6xl">Alana <br /> Elizabeth</h2>
              </div>

              <div className=" text-white uppercase text-sm mt-5">
                <p>te esperamos para celebrar <br /> juntos un dia lleno de amor y <br /> bendiciones.</p>
              </div>
            </div>

        </div>
      </section>

      {/* Mensaje - globo + texto intro como imagen */}
      {/* <section
        ref={(el) => setSectionRef(el, 1)}
        className="snap-section relative flex flex-col items-center justify-center px-6 bg-gradient-to-t from-[#CC6B7F]/50 from-[10%] to-transparent "
      >
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
      </section> */}

      {/* Countdown - relative + z-20 para quedar encima del globo de la sección anterior */}
      <section
        ref={(el) => setSectionRef(el, 1)}
        className="snap-section relative z-20 flex flex-col items-center justify-center z-5 "
      >
        <div className=" w-full h-full text-center py-5">
          <h2 data-text-anim="reveal" className="text-4xl uppercase">Faltan:</h2>
        </div>
        <div className="relative flex flex-wrap items-start justify-evenly gap-3 sm:gap-3 w-full h-32">
          {/* capa de fondo — recibe el efecto tela+viento sin afectar los números */}
          <div data-picado-wind className="absolute inset-0"
            style={{
              backgroundImage: `url(${asset(ASSETS.elementos, "papel_picado_CONTADOR.png")})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-3xl font-semibold text-white sm:text-5xl md:text-6xl">{countdown.days}</span>
            <span className="text-xs uppercase tracking-wider text-white/90">Días</span>
          </div>
          <span className="relative z-10 text-4xl font-semibold text-white/80">|</span>
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-3xl font-semibold text-white sm:text-5xl md:text-6xl">{countdown.hours}</span>
            <span className="text-xs uppercase tracking-wider text-white/90">Horas</span>
          </div>
          <span className="relative z-10 text-4xl font-semibold text-white/80">|</span>
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-3xl font-semibold text-white sm:text-5xl md:text-6xl">{countdown.minutes}</span>
            <span className="text-xs uppercase tracking-wider text-white/90">Min</span>
          </div>
          <span className="relative z-10 text-4xl font-semibold text-white/80">|</span>
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-3xl font-semibold text-white sm:text-5xl md:text-6xl">{countdown.seconds}</span>
            <span className="text-xs uppercase tracking-wider text-white/90">Seg</span>
          </div>
        </div>
      </section>

      {/* Padre y padrinos*/}
      <section
        ref={(el) => setSectionRef(el, 2)}
        className="snap-section relative flex flex-col items-center justify-center gap-10 "

      >
        <div className="w-full h-full -mt-25">

          <Image data-picado-wind src={asset(ASSETS.elementos, "papel_picado_padres_padrinos.png")} alt="" width={600} height={500} className="w-full h-auto object-contain" priority />
          <div className="w-full h-full text-center absolute top-5">
            <div className=" text-white uppercase text-sm">
              <p>
                Dios mío, gracias por el regalo de <br /> 
                la vida. Hoy te pido que me tomes <br />
                de tu mano, ilumines mi camino y me <br />
                acompañes siempre con tu amor. <br /> 
                Que nunca me falten tus <br />
                bendiciones.
              </p>
              <img src={asset(ASSETS.elementos, "icono1_Padres_padrinos.png")} alt="" className="absolute w-50 top-26 left-1/2 -translate-x-1/2"/>
            </div>

            <div className=" text-white uppercase mt-8 mb-2">
              <h2 data-text-anim="rise" className="text-3xl">Mis Padres:</h2>
              <p className="text-sm mt-3">Ana Elizabeth Hernández <br />
              y <br />
              Williams Hernández</p>
            </div>

            <img src={asset(ASSETS.elementos, "icono2_padres_padrinos.png")} alt="" className="absolute w-50 top-66 left-1/2 -translate-x-1/2"/>

            <div className=" text-white uppercase mt-10 mb-2">
              <h2 data-text-anim="rise" className="text-3xl">Mis Padrinos:</h2>
              <p className="text-sm mt-3">Ricardo Hernández <br />
              y <br />
              Reyna Cancino</p>
            </div>
          </div>
        </div>
      </section>

      {/* Fecha, Hora y Lugar */}
      <section
        ref={(el) => setSectionRef(el, 3)}
        className="snap-section relative flex flex-col items-center justify-center "
      >

        <div className="w-full flex flex-col items-center gap-6">

          <Image src={asset(ASSETS.elementos, "diseño_información.png")} alt="" width={600} height={500} className="w-full h-auto object-contain" priority />

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            {/* Card 1 - Fecha */}
            <div className="flex flex-col gap-2">
              <div className="text-center text-4xl">
                <h2 data-text-anim="reveal">Fecha:</h2>
              </div>
              <div data-animate-content className="flex items-center gap-3">
                <div className="relative w-20 h-20 shrink-0">
                  <Image data-animate-decor src={asset(ASSETS.elementos, "cuadro_iconos_info.png")} alt="" fill className="object-contain" />
                  <Image data-animate-decor src={asset(ASSETS.elementos, "icono_calendario.png")} alt="" width={70} height={70} className="mx-auto object-contain p-3" />
                </div>
                <div className="flex flex-col">
                  <p className="text-3xl uppercase leading-tight">Sábado</p>
                  <p className="text-xl uppercase">20. junio. 26</p>
                </div>
              </div>
            </div>
            {/* Card 1 - Hora */}
            <div className="flex flex-col gap-2 my-20">
              <div className="text-center text-4xl">
                <h2 data-text-anim="reveal">Hora:</h2>
              </div>
              <div data-animate-content className="flex items-center gap-3">
                <div className="relative w-20 h-20 shrink-0">
                  <Image data-animate-decor src={asset(ASSETS.elementos, "cuadro_iconos_info.png")} alt="" fill className="object-contain" />
                  <Image data-animate-decor src={asset(ASSETS.elementos, "icono_reloj.png")} alt="" width={70} height={70} className="mx-auto object-contain p-3" />
                </div>
                <div className="flex flex-col">
                  <p className="text-3xl uppercase leading-tight">03 pm</p>
                </div>
              </div>
            </div>
            {/* Card 1 - Lugar */}
            <div className="flex flex-col gap-2">
              <div className="text-center text-4xl">
                <h2 data-text-anim="reveal">Lugar:</h2>
              </div>
              <div data-animate-content className="flex items-center gap-3">
                <div className="relative w-20 h-20 shrink-0">
                  <Image data-animate-decor src={asset(ASSETS.elementos, "cuadro_iconos_info.png")} alt="" fill className="object-contain" />
                  <Image data-animate-decor src={asset(ASSETS.elementos, "icono_ubicacion.png")} alt="" width={70} height={70} className="mx-auto object-contain p-3" />
                </div>
                <div className="flex flex-col">
                  <p className="text-sm uppercase leading-tight">salón "quinta <br /> loma bonita" el <br /> carmen, loma <br /> bontia tuxtla gtz.</p>
                </div>
              </div>
                <div data-animate-content className="mt-3 flex gap-3 justify-center">
                  <a
                    href={GOOGLE_MAPS_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-md transition hover:scale-110 active:scale-95"
                    aria-label="Google Maps"
                  >
                    <svg viewBox="0 0 24 24" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </a>
                  <a
                    href={APPLE_MAPS_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-black shadow-md transition hover:scale-110 active:scale-95"
                    aria-label="Apple Maps"
                  >
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                  </a>
                </div>
            </div>
          </div>

        </div>

      </section>

      {/* RSVP */}
      <section
        ref={(el) => setSectionRef(el, 4)}
        className="snap-section relative flex flex-col items-center justify-center z-5 "
      >
        <div className="absolute inset-0 overflow-hidden">
          {/* <div data-animate-decor data-gsap-scroll-rotate className="absolute bottom-[75%] left-[5%] h-18 w-18">
            <Image src={asset(ASSETS.recursos, "ESTRELLAA DORADAA.png")} alt="" width={100} height={100} className="h-full w-full object-contain" />
          </div>
          <div data-animate-decor data-gsap-rotate className="absolute bottom-[70%] right-[3%] h-15 w-15">
            <Image src={asset(ASSETS.recursos, "ESTRELLA.png")} alt="" width={100} height={100} className="h-full w-full object-contain" />
          </div> */}
        </div>
        <div data-animate-title className="mb-2 w-full max-w-md" />
        <div data-animate-content className="relative w-full max-w-md">
          <Image
            src={asset(ASSETS.elementos, "papel_picado_confirmacion.png")}
            alt=""
            width={500}
            height={400}
            className="mx-auto w-full h-auto object-contain"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 sm:px-12 w-80 m-auto">
            <div data-animate-title className="w-full text-center text-white text-5xl">
             
              <h2 data-text-anim="wave" data-text-anim-delay="1.2">{invitadoData.nombre}</h2>
            </div>
            {/* <div data-animate-content className="mt-4 w-full max-w-[200px] mx-auto text-center">
              <h2 className="text-lg font-semibold uppercase tracking-wider text-[#ffddd7]">{invitadoData.nombre}</h2>
            </div> */}
            {invitadoData.confirmado ? (
              <div data-animate-content className="mt-4 text-center">
                {invitadoData.pasesConfirmados > 0 ? (
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-2xl font-bold text-[#ffddd7] uppercase tracking-wide">¡Te esperamos!</p>
                    {invitadoData.pasesConfirmados > 1 && (
                      <p className="text-xs text-[#ffddd7]/80">{invitadoData.pasesConfirmados} pases confirmados</p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-lg font-semibold text-[#ffddd7] uppercase tracking-wide">Gracias por avisar</p>
                    <p className="text-xs text-[#ffddd7]/80">Lamentamos que no puedas acompañarnos.</p>
                  </div>
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
                    className="border-2 border-[#FFDDD7] bg-transparent px-4 py-2 text-center text-xs font-bold uppercase tracking-wider text-[#FFDDD7] transition hover:/10 active:scale-[0.98] disabled:opacity-60"
                  >
                    No asistiré
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalAsistireOpen(true)}
                    disabled={rsvpConfirming}
                    className=" text-[#901f1a] bg-[#ffddd7] px-6 py-2 text-center text-xs font-bold uppercase tracking-wider shadow-lg transition hover:bg-[#b84556] active:scale-[0.98] disabled:opacity-60"
                  >
                    Asistiré
                  </button>
                </div>
              </>
            )}
            {/* <p className="mt-5 text-center text-xs text-[#D15366] uppercase">
              En caso de que no puedas asistir después de la fecha límite, contacta directamente.
            </p> */}
          </div>
        </div>
      </section>

        {/* Mesa de regalos */}
      <section
        ref={(el) => setSectionRef(el, 5)}
        className="snap-section relative flex flex-col items-center justify-center gap-10 "

      >
        <div className="w-full h-full -mt-25">

          <Image src={asset(ASSETS.elementos, "papel_picado_mesa_de_regalo.png")} alt="" width={600} height={500} className="w-full h-auto object-contain" priority />
          
          <div className="w-full h-auto absolute top-5 text-center">
            <div className="w-full h-full ">
              <div className=" text-white uppercase ">
                <h5 className="text-3xl text-[#901F1A]">Mesa de</h5>
                <h2 className="text-5xl text-[#901F1A]">Regalos</h2>
              </div>
            </div>

            <div className="flex justify-evenly">
              <div className="text-white uppercase mt-8 mb-2">
                <img src="" alt="" />
                <p className="text-sm mt-3 text-[#901F1A]">NO. 123456789</p>
                <a
                  href={ENLACE_ITEM_1}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-[#901F1A] text-[#FFDDD7] px-6 py-2 text-center text-xs font-bold uppercase tracking-wider shadow-lg transition hover:bg-[#b84556] active:scale-[0.98]"
                >
                  Abrir
                </a>
              </div>
              <div className="text-white uppercase mt-8 mb-2">
                <img src="" alt="" />
                <p className="text-sm mt-3 text-[#901F1A]">NO. 123456789</p>
                <a
                  href={ENLACE_ITEM_2}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-[#901F1A] text-[#FFDDD7] px-6 py-2 text-center text-xs font-bold uppercase tracking-wider shadow-lg transition hover:bg-[#b84556] active:scale-[0.98]"
                >
                  Abrir
                </a>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* GRACIAS POR ASISTIR */}
      <section
        ref={(el) => setSectionRef(el, 6)}
        className="snap-section relative flex flex-col items-center justify-center "
      >
        {/* <Fireworks
          ref={fireworksRefGracias}
          options={FIREWORKS_OPTIONS}
          autostart={false}
          className="absolute inset-0 z-[-1] pointer-events-none opacity-50"
          style={{ width: "100%", height: "100%" }}
        /> */}
        <div className="w-full flex flex-col items-center gap-6">

          <Image src={asset(ASSETS.elementos, "diseno_final.png")} alt="" width={600} height={500} className="w-full pt-17 px-2 h-auto object-contain" priority />
          <Image src={asset(ASSETS.elementos, "corazon_final.png")} alt="" width={600} height={500} className="absolute z-5 mx-auto mt-3 w-30 h-auto object-contain " priority />

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">

            <div className="text-[#901F1A] text-center">
              <h2 className="text-7xl">Alana <br /> Elizabeth</h2>
            </div>

            <div className="text-[#901F1A] uppercase text-center mt-8">
              <h2 className="text-4xl">mi bautizo</h2>
              <p className="text-xl">y mi primer año</p>
            </div>

          </div>

          <Image src={asset(ASSETS.elementos, "papel_picado_final.png")} alt="" width={600} height={500} className="w-full h-auto object-contain" priority />

        </div>
      </section>


      </div>
    </div>
  );
}
