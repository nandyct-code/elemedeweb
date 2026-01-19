
import React, { useEffect, useRef } from 'react';
import { Business } from '../types';
import L from 'leaflet';

interface BusinessMapProps {
  businesses: Business[];
  center: { lat: number; lng: number };
  userLocation?: { lat: number; lng: number };
  radius: number;
  onViewBusiness?: (id: string) => void;
}

export const BusinessMap: React.FC<BusinessMapProps> = ({ businesses, center, radius, onViewBusiness, userLocation }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);

  // Hook global handler for popup buttons
  useEffect(() => {
    (window as any).handleViewBusiness = (id: string) => {
      if (onViewBusiness) onViewBusiness(id);
    };

    return () => {
      delete (window as any).handleViewBusiness;
    };
  }, [onViewBusiness]);

  const getMarkerClass = (packId: string) => {
    switch (packId) {
      case 'super_top': return 'marker-fire';
      case 'premium': return 'marker-gold';
      case 'medium': return 'marker-silver';
      case 'basic': return 'marker-bronze';
      default: return '';
    }
  };

  const getIcon = (sectorId: string) => {
    switch (sectorId) {
      case 'mesas_dulces': return '🧁';
      case 'pasteleria': return '🍰';
      case 'confiterias': return '🥐';
      case 'churrerias_creperias': return '🥨';
      case 'heladerias': return '🍦';
      case 'reposteria_creativa': return '🎂';
      default: return '🍭';
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  // 1. INITIALIZE MAP (ONCE)
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    // LIMITES NACIONALES (España Peninsular + Islas)
    // Sur-Oeste: 27.0, -19.0 (Canarias)
    // Nor-Este: 44.5, 5.0 (Pirineos/Menorca)
    const SPAIN_BOUNDS: L.LatLngBoundsExpression = [
        [27.0, -19.0], 
        [44.5, 5.0]
    ];

    leafletMap.current = L.map(mapRef.current, {
        minZoom: 5, // Zoom mínimo para ver el país entero, no más lejos (Internacional bloqueado)
        maxZoom: 18,
        maxBounds: SPAIN_BOUNDS, // Restringe la navegación a la zona nacional
        maxBoundsViscosity: 1.0, // Rebote duro al intentar salir
        zoomControl: false // Ocultamos el default para limpieza visual (opcional)
    }).setView([40.4168, -3.7038], 6); // Vista inicial centrada en España (Zoom 6 = Comunidades)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(leafletMap.current);

    markersLayer.current = L.layerGroup().addTo(leafletMap.current);

    // Add Zoom Control manually at bottom right for better UX on mobile
    L.control.zoom({ position: 'bottomright' }).addTo(leafletMap.current);

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  // 2. UPDATE VIEW ONLY WHEN CENTER CHANGES EXPLICITLY (USER CHANGE)
  useEffect(() => {
      if (leafletMap.current) {
          // Si el usuario busca algo específico o se geolocaliza, hacemos zoom in (Nivel Ciudad)
          // Si es la carga inicial genérica, mantenemos un zoom más abierto (Nivel Región/País)
          const zoomLevel = radius < 10000 ? 14 : 10; 
          leafletMap.current.flyTo([center.lat, center.lng], zoomLevel, {
              animate: true,
              duration: 1.5
          });
      }
  }, [center.lat, center.lng]);

  // 3. UPDATE MARKERS (DATA CHANGES)
  useEffect(() => {
    if (!leafletMap.current || !markersLayer.current) return;

    markersLayer.current.clearLayers();

    // Dibujar radio de búsqueda (Visual Reference Only)
    if (radius < 50000) { // Solo dibujar círculo si es una búsqueda local, no nacional
        L.circle([center.lat, center.lng], {
        color: '#ff4d00',
        fillColor: '#ff4d00',
        fillOpacity: 0.05,
        radius: radius
        }).addTo(markersLayer.current);
    }

    // Marcador de usuario
    const userMarkerPos = userLocation || center;
    L.marker([userMarkerPos.lat, userMarkerPos.lng], {
      icon: L.divIcon({
        className: 'user-location-marker',
        html: `<div class="w-5 h-5 bg-orange-600 rounded-full border-2 border-white shadow-xl flex items-center justify-center animate-pulse"><div class="w-2 h-2 bg-white rounded-full"></div></div>`,
        iconSize: [20, 20]
      })
    }).addTo(markersLayer.current).bindPopup("<b>Estás aquí</b>");

    // Añadir marcadores de negocios
    businesses.forEach(biz => {
      // 1. MAIN HQ MARKER
      const mainDist = calculateDistance(center.lat, center.lng, biz.lat, biz.lng);
      
      const isFire = biz.packId === 'super_top';
      const markerSize = isFire ? [50, 50] : [40, 40];
      const imageSrc = biz.mainImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(biz.name)}&background=random`;
      
      const icon = L.divIcon({
        className: `custom-marker ${getMarkerClass(biz.packId)}`,
        html: `<span>${getIcon(biz.sectorId)}</span>`,
        iconSize: markerSize as L.PointExpression,
        iconAnchor: [markerSize[0]/2, markerSize[1]/2] as L.PointExpression
      });

      L.marker([biz.lat, biz.lng], { icon })
        .addTo(markersLayer.current!)
        .bindPopup(`
          <div class="min-w-[220px] font-brand">
            <div class="flex items-start gap-3 mb-3">
                <div class="relative shrink-0">
                  <div class="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-gray-100">
                    <img 
                      src="${imageSrc}" 
                      class="w-full h-full object-cover"
                      alt="${biz.name}"
                      onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(biz.name)}'"
                    />
                  </div>
                  <div class="absolute -bottom-2 -right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-50 text-base cursor-help" title="Plan: ${biz.packId}">
                    ${isFire ? '🔥' : (biz.packId === 'premium' ? '👑' : '✨')}
                  </div>
                </div>
                <div class="min-w-0 flex-1 pt-1">
                  <h4 class="font-black text-sm text-gray-900 leading-tight truncate">${biz.name}</h4>
                  <p class="text-[10px] text-gray-500 font-bold uppercase tracking-wide mt-0.5 truncate">${biz.address}</p>
                  <span class="inline-block mt-1 px-2 py-0.5 bg-orange-50 text-orange-600 text-[8px] font-black rounded-md uppercase tracking-wider border border-orange-100">
                    ${mainDist}m
                  </span>
                </div>
            </div>
            
            <button
                onclick="window.handleViewBusiness('${biz.id}')"
                class="w-full bg-gray-900 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 group"
            >
                <span>Entrar al Perfil</span>
                <span class="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        `);

      // 2. ADDITIONAL SEDES MARKERS & CONNECTIONS
      if(biz.direccionesAdicionales && biz.direccionesAdicionales.length > 0) {
          biz.direccionesAdicionales.forEach((sede, idx) => {
              if (sede.lat && sede.lng) {
                  const sedeDist = calculateDistance(center.lat, center.lng, sede.lat, sede.lng);
                  
                  // Use sector icon for branches too, slightly smaller
                  const sedeIcon = L.divIcon({
                      className: `custom-marker ${getMarkerClass(biz.packId)}`, 
                      html: `<span>${getIcon(biz.sectorId)}</span>`,
                      iconSize: [30, 30],
                      iconAnchor: [15, 15]
                  });

                  L.marker([sede.lat, sede.lng], { icon: sedeIcon })
                    .addTo(markersLayer.current!)
                    .bindPopup(`
                      <div class="min-w-[200px] font-brand p-1">
                        <div class="flex justify-between items-start mb-2">
                            <span class="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded uppercase tracking-widest">
                                Sede Adicional #${idx + 1}
                            </span>
                            <span class="text-[9px] font-bold text-gray-400">${sedeDist}m</span>
                        </div>
                        <h4 class="font-black text-sm text-gray-900 leading-tight mb-1 truncate">${biz.name}</h4>
                        <p class="text-[10px] text-gray-500 font-bold uppercase tracking-wide mb-3 truncate">📍 ${sede.calle}</p>
                        
                        <button
                            onclick="window.handleViewBusiness('${biz.id}')"
                            class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                        >
                            <span>Ver Negocio Principal</span>
                        </button>
                      </div>
                    `);
                  
                  // Draw dashed line connecting HQ to Sede if reasonable distance
                  if (mainDist < 50000) { // Only connect if not super far to avoid clutter
                      L.polyline([[biz.lat, biz.lng], [sede.lat, sede.lng]], {
                          color: '#9ca3af', // gray-400
                          weight: 2,
                          dashArray: '5, 10',
                          opacity: 0.6,
                          lineCap: 'round'
                      }).addTo(markersLayer.current!);
                  }
              }
          });
      }
    });
  }, [businesses, radius, onViewBusiness, userLocation]); // removed 'center' dependency from marker updates to prevent flicker, but radius update needs redraw

  return (
    <div className="relative h-[600px] w-full shadow-2xl overflow-hidden rounded-[3rem] border-8 border-white group">
      <div ref={mapRef} className="h-full w-full bg-gray-100" />
      
      {/* Leyenda Horizontal Superior */}
      <div className="absolute top-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-[1000] bg-white/95 backdrop-blur-md py-3 px-4 sm:px-6 rounded-2xl sm:rounded-full shadow-xl text-[10px] sm:text-xs font-bold border border-orange-50 flex flex-wrap justify-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 marker-fire rounded-full border border-orange-500 flex items-center justify-center text-[8px]">🔥</div> 
          <span className="text-orange-600 font-black">FUEGO</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 marker-gold rounded-full border border-yellow-600"></div> 
          <span className="text-yellow-700 font-bold">GOLD</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 marker-silver rounded-full border border-gray-400"></div> 
          <span className="text-gray-500 font-bold">PLATA</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 marker-bronze rounded-full border border-orange-900"></div> 
          <span className="text-orange-900 font-bold">BRONCE</span>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
        <div className="bg-gray-900/90 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl backdrop-blur-sm">
          Mapa de Antojos
        </div>
      </div>
    </div>
  );
};
