'use client';

import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import {
  Users,
  Calendar,
  Megaphone,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Star,
} from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Gestión de Miembros',
    description:
      'Administra todos los miembros de tu iglesia en un único lugar. Mantén un registro de asistencia, roles y participación.',
  },
  {
    icon: Calendar,
    title: 'Programación de Eventos',
    description:
      'Planifica y coordina eventos de la iglesia con facilidad. Comparte detalles, fechas y ubicaciones con tu comunidad.',
  },
  {
    icon: Megaphone,
    title: 'Anuncios',
    description:
      'Publica anuncios importantes para mantener a tu comunidad informada. Llega a todos con un solo clic.',
  },
  {
    icon: Users,
    title: 'Ministerios',
    description:
      'Organiza y coordina los diferentes ministerios de tu iglesia. Asigna líderes y miembros a cada ministerio.',
  },
  {
    icon: BarChart3,
    title: 'Análisis y Reportes',
    description:
      'Obtén información valiosa sobre el crecimiento y participación de tu iglesia con reportes detallados.',
  },
  {
    icon: CheckCircle,
    title: 'Fácil de Usar',
    description:
      'Interfaz intuitiva que requiere mínima capacitación. Diseñado para cualquier persona de tu equipo.',
  },
];

const plans = [
  {
    name: 'Básico',
    price: '$29',
    period: '/mes',
    description: 'Perfecto para iglesias pequeñas',
    features: [
      'Hasta 100 miembros',
      'Gestión básica de eventos',
      'Anuncios ilimitados',
      'Soporte por email',
      'Almacenamiento de 5GB',
    ],
    cta: 'Comenzar',
    highlight: false,
  },
  {
    name: 'Profesional',
    price: '$79',
    period: '/mes',
    description: 'Para iglesias en crecimiento',
    features: [
      'Hasta 500 miembros',
      'Gestión avanzada de eventos',
      'Anuncios ilimitados',
      'Ministerios ilimitados',
      'Soporte prioritario por email',
      'Almacenamiento de 50GB',
      'Reportes personalizados',
    ],
    cta: 'Comenzar',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Personalizado',
    period: '',
    description: 'Para iglesias grandes',
    features: [
      'Miembros ilimitados',
      'Todas las características',
      'Soporte 24/7',
      'Capacitación personalizada',
      'Almacenamiento ilimitado',
      'API personalizada',
      'Consultoría dedicada',
    ],
    cta: 'Contactar',
    highlight: false,
  },
];

const testimonials = [
  {
    name: 'Pastor Juan Rodríguez',
    role: 'Pastor Principal - Iglesia Emanuel',
    content:
      'ChurchPlanner ha revolucionado la forma en que manejamos nuestra iglesia. Ahora todo es más organizado y nuestros miembros están más conectados.',
    avatar: 'JR',
  },
  {
    name: 'María González',
    role: 'Coordinadora de Ministerios - Iglesia Santa Fe',
    content:
      'La facilidad de uso es increíble. En una semana, todo nuestro equipo estaba usando la plataforma sin problemas.',
    avatar: 'MG',
  },
  {
    name: 'Carlos López',
    role: 'Administrador - Iglesia Vida Eterna',
    content:
      'Los reportes y análisis nos han ayudado a entender mejor el crecimiento de nuestra congregación y tomar mejores decisiones.',
    avatar: 'CL',
  },
];

export default function Home() {
  return (
    <>
      <Navbar />
      <section className="pt-24 pb-12 sm:pt-32 sm:pb-20 bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
                Gestión Completa de tu Iglesia
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8">
                ChurchPlanner es la plataforma integral para gestionar miembros, eventos, anuncios y ministerios de tu iglesia. Todo en un solo lugar.
              </p>
              <div className="flex flex-col gap-3 sm:gap-4 w-full sm:w-auto">
                <Link
                  href="/dashboard"
                  className="bg-blue-600 text-white px-6 sm:px-8 py-3 sm:py-3 rounded-lg hover:bg-blue-700 transition font-semibold flex items-center justify-center space-x-2 w-full sm:w-auto text-sm sm:text-base"
                >
                  <span>Comenzar Gratis</span>
                  <ArrowRight size={18} className="sm:w-5 sm:h-5" />
                </Link>
                <Link
                  href="#features"
                  className="border-2 border-blue-600 text-blue-600 px-6 sm:px-8 py-3 sm:py-3 rounded-lg hover:bg-blue-50 transition font-semibold text-center w-full sm:w-auto text-sm sm:text-base"
                >
                  Conocer más
                </Link>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-5 sm:mt-6">
                ✓ No se requiere tarjeta • ✓ Prueba gratis 14 días • ✓ Cancelar cuando quieras
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl p-6 sm:p-8 md:p-12 hidden sm:block">
              <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="h-2 sm:h-3 bg-blue-200 rounded w-3/4"></div>
                  <div className="h-2 sm:h-3 bg-blue-100 rounded w-full"></div>
                  <div className="h-2 sm:h-3 bg-blue-100 rounded w-5/6"></div>
                </div>
                <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-8">
                  <div className="bg-blue-50 rounded p-3 sm:p-4">
                    <div className="h-6 sm:h-8 bg-blue-300 rounded mb-2"></div>
                    <div className="h-1 sm:h-2 bg-blue-100 rounded"></div>
                  </div>
                  <div className="bg-blue-50 rounded p-3 sm:p-4">
                    <div className="h-6 sm:h-8 bg-blue-300 rounded mb-2"></div>
                    <div className="h-1 sm:h-2 bg-blue-100 rounded"></div>
                  </div>
                  <div className="bg-blue-50 rounded p-3 sm:p-4">
                    <div className="h-6 sm:h-8 bg-blue-300 rounded mb-2"></div>
                    <div className="h-1 sm:h-2 bg-blue-100 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-6">
              Características Poderosas
            </h2>
            <p className="text-sm sm:text-base md:text-xl text-gray-600 max-w-3xl mx-auto px-2">
              Todo lo que necesitas para administrar tu iglesia de manera eficiente
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="p-6 sm:p-8 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon size={24} className="text-blue-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-6">
              Planes Simples y Transparentes
            </h2>
            <p className="text-sm sm:text-base md:text-xl text-gray-600 max-w-3xl mx-auto px-2">
              Elige el plan perfecto para tu iglesia
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`rounded-xl overflow-hidden transition-transform hover:scale-105 ${
                  plan.highlight
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-2xl'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <div className="p-6 sm:p-8">
                  <h3 className={`text-xl sm:text-2xl font-bold mb-2 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-xs sm:text-sm mb-6 ${plan.highlight ? 'text-blue-100' : 'text-gray-600'}`}>
                    {plan.description}
                  </p>

                  <div className="mb-6 sm:mb-8">
                    <span className={`text-3xl sm:text-4xl font-bold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                      {plan.price}
                    </span>
                    <span className={`text-xs sm:text-sm ${plan.highlight ? 'text-blue-100' : 'text-gray-600'}`}>
                      {plan.period}
                    </span>
                  </div>

                  <button
                    className={`w-full py-2 sm:py-3 px-4 rounded-lg font-semibold transition mb-6 sm:mb-8 text-sm sm:text-base ${
                      plan.highlight
                        ? 'bg-white text-blue-600 hover:bg-blue-50'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {plan.cta}
                  </button>

                  <ul className="space-y-3 sm:space-y-4">
                    {plan.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className={`flex items-start space-x-2 sm:space-x-3 ${plan.highlight ? 'text-blue-100' : 'text-gray-600'}`}
                      >
                        <CheckCircle size={18} className="flex-shrink-0 mt-0.5 sm:mt-1 w-4 sm:w-5 h-4 sm:h-5" />
                        <span className="text-xs sm:text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-6">
              Lo que dicen nuestros usuarios
            </h2>
            <p className="text-sm sm:text-base md:text-xl text-gray-600 max-w-3xl mx-auto px-2">
              Iglesias de todo el país confían en ChurchPlanner
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 sm:p-8 border border-gray-200">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className="sm:w-[18px] sm:h-[18px] fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic text-sm sm:text-base">"{testimonial.content}"</p>
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                    {testimonial.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-sm sm:text-base truncate">{testimonial.name}</p>
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
            ¿Listo para transformar tu iglesia?
          </h2>
          <p className="text-sm sm:text-base md:text-xl text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
            Únete a cientos de iglesias que ya están utilizando ChurchPlanner para administrar su comunidad
          </p>
          <Link
            href="/dashboard"
            className="inline-flex flex-col sm:flex-row items-center justify-center gap-2 bg-white text-blue-600 px-6 sm:px-8 py-3 sm:py-4 rounded-lg hover:bg-blue-50 transition font-bold w-full sm:w-auto text-sm sm:text-base"
          >
            <span>Comenzar Prueba Gratis</span>
            <ArrowRight size={18} className="sm:w-5 sm:h-5" />
          </Link>
          <p className="text-blue-100 text-xs sm:text-sm mt-4">
            No se requiere tarjeta de crédito. Acceso completo por 14 días.
          </p>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
                Acerca de ChurchPlanner
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-4 sm:mb-6">
                Fundada en 2024, ChurchPlanner nace de la necesidad de iglesias que buscan modernizar su administración sin perder la esencia de su comunidad.
              </p>
              <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-6 sm:mb-8">
                Nuestro objetivo es proporcionar herramientas simples pero poderosas que permitan a los líderes de iglesias enfocarse en lo que realmente importa: el crecimiento espiritual de su comunidad.
              </p>
              <div className="flex gap-6 sm:gap-8">
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600">500+</p>
                  <p className="text-xs sm:text-sm md:text-base text-gray-600">Iglesias activas</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600">50K+</p>
                  <p className="text-xs sm:text-sm md:text-base text-gray-600">Miembros</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600">95%</p>
                  <p className="text-xs sm:text-sm md:text-base text-gray-600">Satisfacción</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl p-6 sm:p-8">
              <div className="space-y-3 sm:space-y-4">
                <div className="bg-white rounded-lg p-5 sm:p-6 shadow-md">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <CheckCircle size={20} className="sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2 text-sm sm:text-base">Misión</h4>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Empodera a las iglesias con tecnología moderna para conectar y servir mejor a sus comunidades.
                  </p>
                </div>

                <div className="bg-white rounded-lg p-5 sm:p-6 shadow-md">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <CheckCircle size={20} className="sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2 text-sm sm:text-base">Visión</h4>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Ser la plataforma de gestión de iglesias más usada en Latinoamérica.
                  </p>
                </div>

                <div className="bg-white rounded-lg p-5 sm:p-6 shadow-md">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <CheckCircle size={20} className="sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2 text-sm sm:text-base">Valores</h4>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Integridad, servicio, innovación y comunidad.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
