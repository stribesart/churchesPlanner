'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">CP</span>
              </div>
              <span className="font-bold text-lg text-white">ChurchPlanner</span>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              La plataforma integral para la gestión de iglesias. Organiza eventos, anuncios, ministerios y usuarios en un solo lugar.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-blue-400 transition" aria-label="Facebook">
                <Facebook size={20} />
              </a>
              <a href="#" className="hover:text-blue-400 transition" aria-label="Twitter">
                <Twitter size={20} />
              </a>
              <a href="#" className="hover:text-blue-400 transition" aria-label="LinkedIn">
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-bold mb-6">Producto</h4>
            <ul className="space-y-3">
              <li>
                <Link href="#features" className="text-sm hover:text-blue-400 transition">
                  Características
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="text-sm hover:text-blue-400 transition">
                  Precios
                </Link>
              </li>
              <li>
                <Link href="/api/health" className="text-sm hover:text-blue-400 transition">
                  Documentación
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm hover:text-blue-400 transition">
                  Roadmap
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-bold mb-6">Recursos</h4>
            <ul className="space-y-3">
              <li>
                <Link href="#about" className="text-sm hover:text-blue-400 transition">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm hover:text-blue-400 transition">
                  Centro de ayuda
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm hover:text-blue-400 transition">
                  Comunidad
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm hover:text-blue-400 transition">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-6">Contacto</h4>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <Mail size={18} className="mt-1 text-blue-400 flex-shrink-0" />
                <a href="mailto:info@churchplanner.com" className="text-sm hover:text-blue-400 transition">
                  info@churchplanner.com
                </a>
              </li>
              <li className="flex items-start space-x-3">
                <Phone size={18} className="mt-1 text-blue-400 flex-shrink-0" />
                <span className="text-sm">+1 (555) 123-4567</span>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin size={18} className="mt-1 text-blue-400 flex-shrink-0" />
                <span className="text-sm">123 Church Street<br />City, State 12345</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <p>&copy; {currentYear} ChurchPlanner. Todos los derechos reservados.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="#" className="hover:text-blue-400 transition">
                Privacidad
              </Link>
              <Link href="#" className="hover:text-blue-400 transition">
                Términos de servicio
              </Link>
              <Link href="#" className="hover:text-blue-400 transition">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
