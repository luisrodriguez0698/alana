import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type AnimType = "wave" | "pulse" | "jump" | "float" | "reveal" | "rise";

/**
 * Splits an element's text into inline <span> units, preserving <br> elements.
 * Sets aria-label on the element so screen readers still get the original text.
 */
function splitEl(el: HTMLElement, by: "chars" | "words"): HTMLElement[] {
  const label = (el.textContent ?? "").trim();
  if (label && !el.getAttribute("aria-label")) el.setAttribute("aria-label", label);

  let html = "";
  el.childNodes.forEach(node => {
    // Preserve <br> tags
    if (node.nodeType === 1 && (node as Element).tagName === "BR") {
      html += "<br>";
      return;
    }
    if (node.nodeType !== 3) return; // skip non-text nodes
    const raw = node.textContent ?? "";

    if (by === "chars") {
      [...raw].forEach(c => {
        if (c === " ") html += `<span class="_ta" style="display:inline-block;width:.3em"> </span>`;
        else if (c.trim()) html += `<span class="_ta" style="display:inline-block">${c}</span>`;
      });
    } else {
      raw.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) html += " ";
        else html += `<span class="_ta" style="display:inline-block">${part}</span>`;
      });
    }
  });

  el.innerHTML = html;
  return Array.from(el.querySelectorAll<HTMLElement>("._ta"));
}

/**
 * Initializes GSAP text animations on all [data-text-anim] elements inside `root`.
 * Returns a cleanup function — call it on component unmount.
 *
 * ─── Animation types ───────────────────────────────────────────────────────────
 *   wave    — chars bounce up in a wave, loops while in viewport
 *   pulse   — chars scale up/down in a wave, loops while in viewport
 *   jump    — chars jump one by one sequentially, loops while in viewport
 *   float   — whole element floats up/down (safe for dynamic/React content)
 *   reveal  — chars slide+fade in one by one on scroll, reverses on exit
 *   rise    — words rise up on scroll, reverses on exit
 *
 * ─── Optional data attributes ──────────────────────────────────────────────────
 *   data-text-split="chars|words"    override default split mode
 *   data-text-anim-delay="1.5"       seconds to wait before the loop starts
 *                                    (loop types only — useful for elements
 *                                    already visible on page load)
 *
 * ─── Usage example ─────────────────────────────────────────────────────────────
 *   <h2 data-text-anim="wave">Hola</h2>
 *   <h2 data-text-anim="wave" data-text-anim-delay="1.2">Hola</h2>
 *   <p  data-text-anim="reveal">Un texto largo</p>
 *   <p  data-text-anim="rise" data-text-split="words">Tres palabras aquí</p>
 *   <div data-text-anim="float">Flotar</div>
 */
export function initTextAnimations(root: HTMLElement): () => void {
  const kills: Array<() => void> = [];

  root.querySelectorAll<HTMLElement>("[data-text-anim]").forEach(el => {
    const type = el.dataset.textAnim as AnimType;
    const by = (el.dataset.textSplit as "chars" | "words") ??
      (type === "rise" ? "words" : "chars");
    const delay = parseFloat(el.dataset.textAnimDelay ?? "0");

    // ── float: no split, whole element ────────────────────────────────────────
    if (type === "float") {
      const tl = gsap.timeline({ repeat: -1, yoyo: true, paused: true });
      if (delay) tl.to({}, { duration: delay });
      tl.to(el, { y: -8, duration: 1.8, ease: "sine.inOut" });

      const st = ScrollTrigger.create({
        trigger: el, start: "top 92%", end: "bottom 8%",
        onEnter:     () => tl.play(),
        onLeave:     () => tl.pause(),
        onEnterBack: () => tl.play(),
        onLeaveBack: () => tl.pause(),
      });
      kills.push(() => { tl.kill(); st.kill(); });
      return;
    }

    const spans = splitEl(el, by);
    if (!spans.length) return;

    // ── loop types: wave · pulse · jump ───────────────────────────────────────
    if (type === "wave" || type === "pulse" || type === "jump") {
      const tl = gsap.timeline({ repeat: -1, paused: true });
      if (delay) tl.to({}, { duration: delay });

      if (type === "wave") {
        tl.to(spans, { y: -8, duration: 0.27, stagger: 0.055, ease: "sine.out" })
          .to(spans, { y:  0, duration: 0.27, stagger: 0.055, ease: "sine.in"  })
          .to({}, { duration: 1.2 });
      } else if (type === "pulse") {
        tl.to(spans, { scale: 1.22, duration: 0.3, stagger: 0.065, ease: "back.out(2.5)" })
          .to(spans, { scale:    1, duration: 0.3, stagger: 0.065, ease: "back.in(1)"    })
          .to({}, { duration: 1.5 });
      } else {
        // jump
        tl.to(spans, {
            y: -10, duration: 0.18, stagger: 0.08,
            ease: "power2.out", yoyo: true, repeat: 1,
          })
          .to({}, { duration: 1.5 });
      }

      const st = ScrollTrigger.create({
        trigger: el, start: "top 92%", end: "bottom 8%",
        onEnter:     () => tl.play(),
        onLeave:     () => tl.pause(),
        onEnterBack: () => tl.play(),
        onLeaveBack: () => tl.pause(),
      });
      kills.push(() => { tl.kill(); st.kill(); });
      return;
    }

    // ── scroll-reveal types: reveal · rise ────────────────────────────────────
    gsap.set(spans, { opacity: 0, y: type === "reveal" ? 14 : 20 });

    const tween = gsap.to(spans, {
      opacity:  1,
      y:        0,
      duration: type === "reveal" ? 0.38 : 0.6,
      stagger:  type === "reveal" ? 0.028 : 0.1,
      ease:     type === "reveal" ? "power2.out" : "power3.out",
      paused: true,
    });

    const st = ScrollTrigger.create({
      trigger: el, start: "top 88%", end: "bottom 12%",
      onEnter:     () => tween.play(),
      onLeave:     () => tween.reverse(),
      onEnterBack: () => tween.play(),
      onLeaveBack: () => tween.reverse(),
    });
    kills.push(() => { tween.kill(); st.kill(); });
  });

  return () => kills.forEach(fn => fn());
}
