import { useEffect, useState } from "react";
import { CalendarDays, Leaf, Sprout, X } from "lucide-react";

export const OPENING_DATE = new Date("2026-07-05T00:00:00+05:30");

const POPUP_SESSION_KEY = "samruddhi-grand-opening-closed";

function getTimeRemaining() {
  const distance = OPENING_DATE.getTime() - Date.now();

  if (distance <= 0) {
    return null;
  }

  return {
    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
    hours: Math.floor((distance / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((distance / (1000 * 60)) % 60),
    seconds: Math.floor((distance / 1000) % 60)
  };
}

const pad = (value) => String(value).padStart(2, "0");

export function OpeningCountdown() {
  const [remaining, setRemaining] = useState(() => getTimeRemaining());

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(getTimeRemaining());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!remaining) {
    return null;
  }

  const units = [
    ["Days", remaining.days],
    ["Hours", remaining.hours],
    ["Minutes", remaining.minutes],
    ["Seconds", remaining.seconds]
  ];

  return (
    <div className="border-t border-forest/10 bg-gradient-to-r from-leaf/10 via-oat to-clay/10">
      <div className="container-site flex flex-col items-center justify-center gap-2 py-2 text-center sm:flex-row sm:gap-3">
        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.18em] text-forest">
          <CalendarDays size={15} className="text-clay" />
          Opening in
        </span>
        <div className="flex max-w-full flex-wrap justify-center gap-1.5">
          {units.map(([label, value]) => (
            <span key={label} className="rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-bold text-forest shadow-sm ring-1 ring-forest/10 sm:px-3">
              {pad(value)} <span className="font-semibold text-ink/55">{label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function GrandOpeningPopup() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!getTimeRemaining() || sessionStorage.getItem(POPUP_SESSION_KEY) === "true") {
      return undefined;
    }

    let closeTimer;
    const showTimer = setTimeout(() => {
      setMounted(true);
      window.requestAnimationFrame(() => setVisible(true));
      closeTimer = setTimeout(() => {
        sessionStorage.setItem(POPUP_SESSION_KEY, "true");
        setVisible(false);
        setTimeout(() => setMounted(false), 300);
      }, 10000);
    }, 1000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(closeTimer);
    };
  }, []);

  const closePopup = () => {
    sessionStorage.setItem(POPUP_SESSION_KEY, "true");
    setVisible(false);
    setTimeout(() => setMounted(false), 300);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className={`fixed inset-0 z-[90] flex items-center justify-center bg-forest/45 px-4 py-6 backdrop-blur-sm transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}>
      <section className={`relative w-full max-w-lg overflow-hidden rounded-[1.75rem] border border-white/60 bg-cream shadow-2xl transition duration-500 ${visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-5 scale-95 opacity-0"}`}>
        <button
          type="button"
          onClick={closePopup}
          aria-label="Close grand opening announcement"
          className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/85 text-forest shadow-sm ring-1 ring-forest/10 transition hover:bg-white hover:text-clay"
        >
          <X size={18} />
        </button>

        <div className="absolute -left-12 -top-12 h-36 w-36 rounded-full bg-leaf/20" />
        <div className="absolute -bottom-16 -right-12 h-44 w-44 rounded-full bg-clay/15" />

        <div className="relative p-6 text-center sm:p-9">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-leaf/10 text-leaf ring-8 ring-white/70">
            <Sprout size={30} />
          </div>
          <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[.2em] text-clay ring-1 ring-forest/10">
            <Leaf size={14} />
            Fresh harvest begins
          </p>
          <h2 className="mt-5 text-4xl leading-tight text-forest sm:text-5xl">Grand Opening on July 5</h2>
          <p className="mt-3 text-lg font-bold text-leaf">Samruddhi – From Farm to Kitchen</p>
          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-ink/65 sm:text-base">
            Fresh organic products, millets, dry fruits, cashews, and traditional cookware coming soon.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-2 text-[11px] font-bold uppercase tracking-[.16em] text-forest/70">
            {["Organic staples", "Dry fruits", "Mitti cookware"].map((item) => (
              <span key={item} className="rounded-full bg-white/75 px-3 py-2 ring-1 ring-forest/10">{item}</span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
