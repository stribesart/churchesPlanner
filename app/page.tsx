// app/page.tsx
'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 text-slate-900">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold text-blue-700">
            Churches Planner
          </h1>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#inicio" className="text-sm font-medium hover:text-blue-700">
              Inicio
            </a>
            <a href="#modulos" className="text-sm font-medium hover:text-blue-700">
              Módulos
            </a>
            <a href="#beneficios" className="text-sm font-medium hover:text-blue-700">
              Beneficios
            </a>
            <a href="#contacto" className="text-sm font-medium hover:text-blue-700">
              Contacto
            </a>
          </div>

          <a href="/login" className="hidden rounded-full bg-blue-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 md:block">
            Iniciar sesión
          </a>

          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="rounded-lg border px-3 py-2 text-sm md:hidden"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="border-t bg-white md:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-4">
              <a 
                href="#inicio" 
                className="text-sm font-medium hover:text-blue-700"
                onClick={() => setIsMenuOpen(false)}
              >
                Inicio
              </a>
              <a 
                href="#modulos" 
                className="text-sm font-medium hover:text-blue-700"
                onClick={() => setIsMenuOpen(false)}
              >
                Módulos
              </a>
              <a 
                href="#beneficios" 
                className="text-sm font-medium hover:text-blue-700"
                onClick={() => setIsMenuOpen(false)}
              >
                Beneficios
              </a>
              <a 
                href="#contacto" 
                className="text-sm font-medium hover:text-blue-700"
                onClick={() => setIsMenuOpen(false)}
              >
                Contacto
              </a>
              <a 
                href="/login" 
                className="rounded-full bg-blue-700 px-5 py-2 text-center text-sm font-semibold text-white transition hover:bg-blue-800"
                onClick={() => setIsMenuOpen(false)}
              >
                Iniciar sesión
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section
        id="inicio"
        className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-12 pt-24 sm:pb-20 sm:pt-32 lg:grid-cols-2"
      >
        <div>
          <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
            Sistema web tipo ChMS / ERP
          </span>

          <h2 className="mt-6 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Organiza tu iglesia desde una sola plataforma
          </h2>

          <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            Churches Planner centraliza la administración de miembros,
            ministerios, eventos, inventario, aportaciones y reportes para
            mejorar la organización interna de la iglesia.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <a href="/login" className="text-center rounded-full bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800">
              Conocer módulos
            </a>
            <a href="/login" className="text-center rounded-full border bg-white px-6 py-3 font-semibold transition hover:bg-slate-50">
              Ver beneficios
            </a>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-xl">
          <div className="rounded-2xl bg-slate-50 p-5">
            <h3 className="mb-4 text-lg font-bold">Panel administrativo</h3>

            <div className="space-y-4">
              {["Miembros registrados", "Eventos próximos", "Recursos activos"].map(
                (item, index) => (
                  <div
                    key={item}
                    className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm"
                  >
                    <span className="font-medium">{item}</span>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
                      {index === 0 ? "120" : index === 1 ? "8" : "34"}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Módulos */}
      <section id="modulos" className="bg-white px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h3 className="text-3xl font-bold sm:text-4xl">
              Módulos principales
            </h3>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600">
              Diseñado para cubrir las necesidades administrativas y
              organizacionales de una iglesia.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Miembros", "Registro y administración de miembros."],
              ["Ministerios", "Control de líderes, equipos y colaboradores."],
              ["Eventos", "Planeación de cultos, reuniones y actividades."],
              ["Inventario", "Gestión de recursos materiales e instrumentos."],
              ["Finanzas", "Registro de ingresos, egresos y aportaciones."],
              ["Reportes", "Información clara para tomar decisiones."],
            ].map(([title, description]) => (
              <article
                key={title}
                className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mb-4 h-12 w-12 rounded-xl bg-blue-100" />
                <h4 className="text-xl font-bold">{title}</h4>
                <p className="mt-3 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section id="beneficios" className="px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
          <div>
            <h3 className="text-3xl font-bold sm:text-4xl">
              Una mejor experiencia para líderes y administradores
            </h3>

            <p className="mt-5 text-slate-600">
              El diseño está pensado para ser claro, rápido y fácil de usar,
              reduciendo la pérdida de información y mejorando la comunicación.
            </p>
          </div>

          <div className="grid gap-4">
            {[
              "Interfaz clara y ordenada",
              "Compatible con celular, tablet y escritorio",
              "Acceso rápido a los módulos principales",
              "Diseño visual moderno y profesional",
            ].map((benefit) => (
              <div
                key={benefit}
                className="rounded-2xl bg-white p-5 shadow-sm"
              >
                ✓ {benefit}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contacto" className="bg-slate-900 px-6 py-12 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <h4 className="text-xl font-bold">Churches Planner</h4>
            <p className="mt-3 text-slate-300">
              Sistema web para la administración de iglesias.
            </p>
          </div>

          <div>
            <h5 className="font-semibold">Módulos</h5>
            <p className="mt-3 text-slate-300">
              Miembros, ministerios, eventos, inventario y finanzas.
            </p>
          </div>

          <div>
            <h5 className="font-semibold">Proyecto</h5>
            <p className="mt-3 text-slate-300">
              Trabajo Terminal enfocado en un sistema ChMS / ERP.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}