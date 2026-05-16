'use client';

import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="fixed w-full bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">CP</span>
            </div>
            <span className="font-bold text-lg text-gray-900">ChurchPlanner</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-gray-700 hover:text-blue-600 transition">
              Características
            </Link>
            <Link href="#pricing" className="text-gray-700 hover:text-blue-600 transition">
              Precios
            </Link>
            <Link href="#about" className="text-gray-700 hover:text-blue-600 transition">
              Acerca de
            </Link>
            <Link href="/api/health" className="text-gray-700 hover:text-blue-600 transition">
              Documentación
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/login"
              className="text-gray-700 hover:text-blue-600 font-medium transition"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/login"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Comenzar gratis
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden text-gray-900"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-gray-200">
            <div className="flex flex-col space-y-3 pt-4">
              <Link href="#features" className="text-gray-700 hover:text-blue-600 transition">
                Características
              </Link>
              <Link href="#pricing" className="text-gray-700 hover:text-blue-600 transition">
                Precios
              </Link>
              <Link href="#about" className="text-gray-700 hover:text-blue-600 transition">
                Acerca de
              </Link>
              <Link href="/api/health" className="text-gray-700 hover:text-blue-600 transition">
                Documentación
              </Link>
              <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                <Link
                  href="/login"
                  className="text-center text-gray-700 hover:text-blue-600 font-medium transition"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/login"
                  className="text-center bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Comenzar gratis
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
