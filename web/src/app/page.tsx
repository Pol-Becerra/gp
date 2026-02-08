'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Search, ShieldCheck, Zap, Database, ArrowRight, MapPin, Building2 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-blue-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass py-4 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Building2 size={24} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Guía<span className="text-blue-500">Pymes</span></span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-medium text-gray-400">
          <a href="#features" className="hover:text-white transition-colors">Características</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">Cómo funciona</a>
          <a href="#stats" className="hover:text-white transition-colors">Estadísticas</a>
        </div>
        <button className="bg-white text-black px-5 py-2 rounded-full text-sm font-semibold hover:bg-gray-200 transition-all shadow-xl">
          Portal Admin
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 md:px-12 overflow-hidden">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6">
              <Zap size={14} />
              <span>SISTEMA DE INGELACIÓN INTELIGENTE</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
              El motor de datos para <br />
              <span className="gradient-text">PyMEs Argentinas</span>
            </h1>
            <p className="text-gray-400 text-lg md:text-xl mb-8 leading-relaxed max-w-lg">
              Extracción automatizada, validación con AFIP y gestión inteligente de entidades. Todo lo que necesitas para conectar con el ecosistema pyme.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/30 group">
                Explorar Guía
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="bg-white/5 hover:bg-white/10 px-8 py-4 rounded-2xl font-bold border border-white/10 transition-all flex items-center justify-center">
                Ver Documentación
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-blue-600/20 rounded-full blur-[120px]"></div>
            <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-indigo-600/20 rounded-full blur-[120px]"></div>

            <div className="glass rounded-3xl p-6 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-8">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                </div>
                <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">system_v2.0_monitor</div>
              </div>

              <div className="space-y-4">
                {[
                  { label: 'Scraping Google Maps', value: '84%', color: 'bg-blue-500' },
                  { label: 'Validación CUIT AFIP', value: '100%', color: 'bg-green-500' },
                  { label: 'Detección Duplicados', value: '42%', color: 'bg-indigo-500' },
                  { label: 'Asignación de Tickets', value: '12%', color: 'bg-orange-500' },
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-400">{item.label}</span>
                      <span>{item.value}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: item.value }}
                        transition={{ duration: 1.5, delay: 0.5 + i * 0.1 }}
                        className={`h-full ${item.color}`}
                      ></motion.div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                  <Database size={20} />
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Base de Datos</div>
                  <div className="text-sm font-semibold">PostgreSQL v15 (Online)</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 md:px-12 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Inteligencia en cada paso</h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Nuestra arquitectura monolítica modular permite orquestar flujos complejos con alta precisión.
          </p>
        </div>

        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Search className="text-blue-400" />,
              title: "Extracción Masiva",
              desc: "Scraping ético de Google Maps con Puppeteer para capturar datos en tiempo real de comercios y servicios."
            },
            {
              icon: <ShieldCheck className="text-green-400" />,
              title: "Validación de Entidades",
              desc: "Score de validación basado en CUIT, presencia web y geolocalización para garantizar datos confiables."
            },
            {
              icon: <MapPin className="text-indigo-400" />,
              title: "Geolocalización Precisa",
              desc: "Normalización de direcciones y mapeo de coordenadas para una cobertura federal completa."
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 size={18} />
            </div>
            <span className="font-bold">GuíaPymes</span>
          </div>
          <div className="text-gray-500 text-sm">
            © 2026 Inteligencia Comercial Argentina. Todos los derechos reservados.
          </div>
          <div className="flex gap-6">
            <span className="text-gray-400 text-sm hover:text-white cursor-pointer transition-colors">Twitter</span>
            <span className="text-gray-400 text-sm hover:text-white cursor-pointer transition-colors">LinkedIn</span>
            <span className="text-gray-400 text-sm hover:text-white cursor-pointer transition-colors">GitHub</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
