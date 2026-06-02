"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  Church,
  CircleDollarSign,
  Menu,
  Package,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";

const modules = [
  {
    name: "Miembros",
    description: "Expedientes, roles, asistencia y datos de contacto en orden.",
    icon: Users,
    metric: "248",
    accent: "bg-sky-500",
  },
  {
    name: "Eventos",
    description: "Cultos, reuniones y actividades con responsables claros.",
    icon: CalendarDays,
    metric: "18",
    accent: "bg-emerald-500",
  },
  {
    name: "Finanzas",
    description: "Aportaciones y ofrendas listas para consulta administrativa.",
    icon: CircleDollarSign,
    metric: "$42k",
    accent: "bg-amber-500",
  },
  {
    name: "Inventario",
    description: "Recursos, instrumentos y equipo disponibles por ministerio.",
    icon: Package,
    metric: "76",
    accent: "bg-rose-500",
  },
];

const scrollStories = [
  {
    eyebrow: "Vista general",
    title: "Todo el movimiento de la iglesia en una sola pantalla.",
    copy: "El panel resume miembros, eventos, recursos y aportaciones para que los líderes sepan qué necesita atención sin perseguir hojas de cálculo.",
    stat: "4 modulos",
  },
  {
    eyebrow: "Ministerios",
    title: "Cada equipo mantiene claridad sobre personas, roles y tareas.",
    copy: "Los responsables pueden consultar quién participa, qué viene en calendario y qué recursos están asignados a cada área.",
    stat: "12 equipos",
  },
  {
    eyebrow: "Administracion",
    title: "La informacion sensible se mantiene organizada y accesible.",
    copy: "Un flujo simple para registrar datos, revisar actividad y tomar decisiones con informacion consistente.",
    stat: "99.9%",
  },
];

const benefits = [
  "Diseño responsivo para escritorio, tablet y celular.",
  "Rutas claras para administradores, lideres y miembros.",
  "Informacion centralizada para reducir registros duplicados.",
  "Base lista para crecer con reportes y permisos por iglesia.",
];

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const revealItems = document.querySelectorAll<HTMLElement>(".scroll-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
    );

    revealItems.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5f5f7] text-[#1d1d1f]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-black/5 bg-[#f5f5f7]/80 backdrop-blur-2xl">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <a href="#inicio" className="flex items-center gap-2 text-sm font-semibold">
            <Church className="size-5" />
            Churches Planner
          </a>

          <div className="hidden items-center gap-7 text-xs font-medium text-black/65 md:flex">
            <a className="transition hover:text-black" href="#experiencia">
              Experiencia
            </a>
            <a className="transition hover:text-black" href="#modulos">
              Modulos
            </a>
            <a className="transition hover:text-black" href="#beneficios">
              Beneficios
            </a>
            <a className="transition hover:text-black" href="#contacto">
              Proyecto
            </a>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <a
              href="/register"
              className="rounded-full px-4 py-2 text-xs font-semibold text-black/70 transition hover:bg-black/5"
            >
              Registrarse
            </a>
            <a
              href="/login"
              className="rounded-full bg-[#0071e3] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#0077ed]"
            >
              Iniciar sesion
            </a>
          </div>

          <button
            className="inline-flex size-9 items-center justify-center rounded-full transition hover:bg-black/5 md:hidden"
            onClick={() => setIsMenuOpen((value) => !value)}
            aria-label="Abrir menu"
            type="button"
          >
            {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </nav>

        {isMenuOpen && (
          <div className="border-t border-black/5 bg-[#f5f5f7] px-5 py-5 md:hidden">
            <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm font-medium">
              {[
                ["Experiencia", "#experiencia"],
                ["Modulos", "#modulos"],
                ["Beneficios", "#beneficios"],
                ["Proyecto", "#contacto"],
              ].map(([label, href]) => (
                <a key={label} href={href} onClick={() => setIsMenuOpen(false)}>
                  {label}
                </a>
              ))}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <a
                  href="/register"
                  className="rounded-full border border-black/10 px-4 py-2 text-center text-sm font-semibold"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Registro
                </a>
                <a
                  href="/login"
                  className="rounded-full bg-[#0071e3] px-4 py-2 text-center text-sm font-semibold text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Entrar
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      <section
        id="inicio"
        className="relative flex min-h-screen items-center px-5 pb-14 pt-24"
      >
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[0.86fr_1.14fr]">
          <div className="scroll-reveal">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-black/65 shadow-sm ring-1 ring-black/5">
              <Sparkles className="size-4 text-[#0071e3]" />
              ERP para iglesias y ministerios
            </div>
            <h1 className="mt-7 max-w-3xl text-5xl font-semibold leading-[0.96] tracking-normal sm:text-7xl lg:text-8xl">
              Administracion simple. Claridad total.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-black/62 sm:text-xl">
              Churches Planner concentra miembros, eventos, ministerios,
              inventario y finanzas en una experiencia limpia, rapida y pensada
              para el trabajo diario de la iglesia.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0071e3] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0077ed]"
              >
                Probar panel <ArrowRight className="size-4" />
              </a>
              <a
                href="#experiencia"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0071e3] shadow-sm ring-1 ring-black/5 transition hover:bg-white/70"
              >
                Ver experiencia
              </a>
            </div>
          </div>

          <ProductShowcase />
        </div>
      </section>

      <section id="experiencia" className="bg-black text-white">
        {scrollStories.map((story, index) => (
          <article
            key={story.title}
            className="relative min-h-screen border-b border-white/10 px-5 py-20"
          >
            <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.88fr_1.12fr]">
              <div className="scroll-reveal flex min-h-[50vh] flex-col justify-center lg:sticky lg:top-24 lg:h-[calc(100vh-6rem)]">
                <p className="text-sm font-semibold text-white/46">{story.eyebrow}</p>
                <h2 className="mt-5 text-4xl font-semibold leading-tight sm:text-6xl">
                  {story.title}
                </h2>
                <p className="mt-6 max-w-xl text-lg leading-8 text-white/62">
                  {story.copy}
                </p>
              </div>

              <div className="flex items-center">
                <div className="scroll-reveal w-full">
                  <StoryVisual index={index} stat={story.stat} />
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section id="modulos" className="px-5 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="scroll-reveal max-w-3xl">
            <p className="text-sm font-semibold text-[#0071e3]">Modulos conectados</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight sm:text-6xl">
              Un sistema que crece con la operacion de tu iglesia.
            </h2>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-2">
            {modules.map((module, index) => {
              const Icon = module.icon;

              return (
                <article
                  key={module.name}
                  className="scroll-reveal rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-black/5"
                  style={{ transitionDelay: `${index * 90}ms` }}
                >
                  <div className="flex items-start justify-between gap-5">
                    <div className={`grid size-12 place-items-center rounded-2xl ${module.accent}`}>
                      <Icon className="size-6 text-white" />
                    </div>
                    <span className="rounded-full bg-black/[0.04] px-3 py-1 text-sm font-semibold text-black/55">
                      {module.metric}
                    </span>
                  </div>
                  <h3 className="mt-8 text-2xl font-semibold">{module.name}</h3>
                  <p className="mt-3 max-w-md leading-7 text-black/60">
                    {module.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="beneficios" className="bg-white px-5 py-24 sm:py-32">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="scroll-reveal">
            <p className="text-sm font-semibold text-[#0071e3]">Listo para presentar</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight sm:text-6xl">
              Moderno por fuera. Practico por dentro.
            </h2>
          </div>

          <div className="grid gap-3">
            {benefits.map((benefit, index) => (
              <div
                key={benefit}
                className="scroll-reveal flex items-start gap-4 rounded-2xl bg-[#f5f5f7] p-5"
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
                  <Check className="size-4" />
                </span>
                <p className="text-lg leading-7 text-black/68">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer id="contacto" className="bg-[#1d1d1f] px-5 py-14 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Church className="size-5" />
              Churches Planner
            </div>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/52">
              Trabajo Terminal enfocado en un sistema ChMS / ERP para la
              administracion integral de iglesias.
            </p>
          </div>

          <div className="flex gap-3">
            <a
              href="/register"
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/88"
            >
              Registrarse
            </a>
            <a
              href="/login"
              className="rounded-full border border-white/16 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Iniciar sesion
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function ProductShowcase() {
  return (
    <div className="scroll-reveal relative mx-auto w-full max-w-[720px]">
      <div className="absolute -inset-4 rounded-[44px] bg-white/50 blur-2xl" />
      <div className="relative overflow-hidden rounded-[34px] bg-[#101014] p-3 shadow-2xl ring-1 ring-black/10">
        <div className="rounded-[26px] bg-[#f5f5f7] p-3">
          <div className="grid min-h-[520px] grid-cols-[72px_1fr] overflow-hidden rounded-[20px] bg-white shadow-inner ring-1 ring-black/5">
            <aside className="bg-[#1d1d1f] p-3">
              <div className="mx-auto mb-8 grid size-9 place-items-center rounded-xl bg-white text-black">
                <Church className="size-5" />
              </div>
              <div className="space-y-3">
                {[Users, CalendarDays, Package, ChartNoAxesCombined].map((Icon, index) => (
                  <div
                    key={index}
                    className={`mx-auto grid size-10 place-items-center rounded-xl ${
                      index === 0 ? "bg-white text-black" : "bg-white/8 text-white/58"
                    }`}
                  >
                    <Icon className="size-5" />
                  </div>
                ))}
              </div>
            </aside>

            <div className="p-5 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-black/42">Panel general</p>
                  <h2 className="mt-1 text-2xl font-semibold">Buen dia, administracion</h2>
                </div>
                <div className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:block">
                  Sincronizado
                </div>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {[
                  ["Miembros", "248", "12 nuevos"],
                  ["Eventos", "18", "4 esta semana"],
                  ["Recursos", "76", "9 prestados"],
                ].map(([label, value, helper]) => (
                  <div key={label} className="rounded-2xl bg-[#f5f5f7] p-4">
                    <p className="text-xs font-semibold text-black/42">{label}</p>
                    <p className="mt-3 text-3xl font-semibold">{value}</p>
                    <p className="mt-2 text-xs font-medium text-black/45">{helper}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-2xl bg-[#f5f5f7] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Asistencia mensual</p>
                    <ChartNoAxesCombined className="size-5 text-[#0071e3]" />
                  </div>
                  <div className="mt-8 flex h-40 items-end gap-2">
                    {[42, 64, 55, 78, 68, 90, 84, 96].map((height, index) => (
                      <div
                        key={index}
                        className="flex-1 rounded-t-lg bg-[#0071e3]"
                        style={{ height: `${height}%`, opacity: 0.45 + index * 0.06 }}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    ["Servicio dominical", "Dom 10:00"],
                    ["Ensayo alabanza", "Vie 19:30"],
                    ["Junta lideres", "Mie 20:00"],
                  ].map(([event, time]) => (
                    <div key={event} className="rounded-2xl border border-black/5 p-4">
                      <p className="text-sm font-semibold">{event}</p>
                      <p className="mt-1 text-xs font-medium text-black/44">{time}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StoryVisual({ index, stat }: { index: number; stat: string }) {
  const palettes = [
    "from-sky-500 via-cyan-300 to-emerald-300",
    "from-violet-500 via-fuchsia-400 to-rose-300",
    "from-amber-300 via-orange-400 to-red-400",
  ];

  return (
    <div className="relative min-h-[520px] overflow-hidden rounded-[34px] bg-white/[0.06] p-5 ring-1 ring-white/10">
      <div className={`absolute inset-x-10 top-10 h-72 rounded-full bg-gradient-to-r ${palettes[index]} opacity-70 blur-3xl`} />
      <div className="relative flex h-full min-h-[480px] flex-col justify-between rounded-[26px] bg-black/42 p-6 ring-1 ring-white/10 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <span className="size-3 rounded-full bg-red-400" />
            <span className="size-3 rounded-full bg-yellow-300" />
            <span className="size-3 rounded-full bg-emerald-400" />
          </div>
          <ShieldCheck className="size-5 text-white/60" />
        </div>

        <div>
          <p className="text-sm font-semibold text-white/50">Churches Planner</p>
          <p className="mt-4 text-7xl font-semibold tracking-normal sm:text-8xl">
            {stat}
          </p>
        </div>

        <div className="grid gap-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/10 p-4">
              <span className="grid size-10 place-items-center rounded-xl bg-white text-black">
                {index === 0 ? (
                  <ChartNoAxesCombined className="size-5" />
                ) : index === 1 ? (
                  <Users className="size-5" />
                ) : (
                  <ShieldCheck className="size-5" />
                )}
              </span>
              <span className="h-3 flex-1 rounded-full bg-white/16" />
              <span className="h-3 w-16 rounded-full bg-white/28" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
