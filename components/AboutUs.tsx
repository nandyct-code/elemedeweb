import React from 'react';

export const AboutUs: React.FC = () => {
  return (
    <section className="bg-white rounded-[3rem] p-10 md:p-20 shadow-xl border border-orange-50 relative overflow-hidden my-12">
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl pointer-events-none"></div>
      
      <div className="max-w-4xl mx-auto space-y-12 relative z-10">
        <div className="space-y-4 text-center md:text-left">
          <h2 className="text-4xl md:text-6xl font-brand font-black text-gray-900 tracking-tighter">
            Elevando el Arte del <br/>
            <span className="text-orange-500">Dulce Artesano.</span>
          </h2>
          <div className="h-2 w-24 bg-orange-500 rounded-full mx-auto md:mx-0"></div>
        </div>
        
        <p className="text-xl text-gray-600 leading-relaxed font-medium">
          ELEMEDE nace con una visión clara: digitalizar y potenciar el sector más dulce de nuestra cultura. No somos solo un directorio, somos un ecosistema de crecimiento.
        </p>

        <div className="grid md:grid-cols-2 gap-10">
            <div className="space-y-6">
                <h4 className="text-2xl font-black text-gray-900 uppercase italic flex items-center gap-2">
                    <span className="text-3xl">🚀</span> Ventajas
                </h4>
                <ul className="space-y-4">
                    {[
                        'Visibilidad Premium: Tu negocio destacado ante miles de clientes potenciales en tu zona.',
                        'Conexión Directa: Sin intermediarios. El cliente te encuentra y te contacta directamente.',
                        'Tecnología Punta: Herramientas de IA y geolocalización al servicio de tu obrador.',
                        'Comunidad Exclusiva: Un entorno cuidado donde la calidad prima sobre la cantidad.'
                    ].map((item, i) => (
                        <li key={i} className="flex gap-3 text-sm text-gray-600 font-bold items-start">
                            <span className="text-orange-500 mt-1">✓</span> {item}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="space-y-6">
                <h4 className="text-2xl font-black text-gray-900 uppercase italic flex items-center gap-2">
                    <span className="text-3xl">🎯</span> Objetivos
                </h4>
                <ul className="space-y-4">
                    {[
                        'Digitalización Real: Llevar a cada pastelería tradicional al siglo XXI sin perder su esencia.',
                        'Cultura del Dulce: Fomentar el consumo de producto artesano local frente al industrial.',
                        'Sostenibilidad: Apoyar el comercio de proximidad y kilómetro cero.',
                        'Excelencia: Crear el estándar de calidad más alto en directorios gastronómicos.'
                    ].map((item, i) => (
                        <li key={i} className="flex gap-3 text-sm text-gray-600 font-bold items-start">
                            <span className="text-indigo-500 mt-1">◈</span> {item}
                        </li>
                    ))}
                </ul>
            </div>
        </div>

        <div className="bg-orange-50/50 p-8 rounded-[2rem] border-2 border-orange-100">
            <h4 className="text-xl font-black text-orange-600 uppercase tracking-widest mb-4">Mejoras para tu Negocio</h4>
            <p className="text-sm font-medium text-gray-700 leading-relaxed">
                Al unirte a ELEMEDE, transformas tu presencia digital. Obtienes un <strong>perfil profesional autogestionable</strong>, acceso a <strong>métricas de visualización</strong>, herramientas de <strong>marketing directo</strong> mediante cupones y banners, y un posicionamiento <strong>SEO optimizado</strong> que te hará visible en los buscadores. Es la inversión definitiva para modernizar tu pastelería sin complicaciones técnicas.
            </p>
        </div>
      </div>
    </section>
  );
};