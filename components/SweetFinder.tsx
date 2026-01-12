
import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Loader2, Star, ExternalLink, Map as MapIcon } from 'lucide-react';
import { findNearbySweetSpots } from '../services/geminiService';
import { PlaceResult, GeoLocation, Business } from '../types';
import { BusinessMap } from './BusinessMap';
import { SearchExperience } from './SearchExperience';
import { MAX_SYSTEM_RADIUS } from '../constants'; // Import global constant

interface SweetFinderProps {
  businesses: Business[];
  onViewBusiness: (id: string) => void;
  userLocation?: { lat: number; lng: number };
}

export const SweetFinder: React.FC<SweetFinderProps> = ({ businesses, onViewBusiness, userLocation }) => {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState | 'unknown'>('prompt');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{ text: string; places: PlaceResult[] } | null>(null);
  const [query, setQuery] = useState('postres');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map');

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName })
        .then((result) => {
          setPermissionState(result.state);
          result.onchange = () => setPermissionState(result.state);
        })
        .catch(() => {
          setPermissionState('unknown');
        });
    }
  }, []);

  // Sync with global location if provided (and different from default Madrid coords check, roughly)
  useEffect(() => {
    if (userLocation && (Math.abs(userLocation.lat - 40.4168) > 0.0001 || Math.abs(userLocation.lng + 3.7038) > 0.0001)) {
        setLocation({
            latitude: userLocation.lat,
            longitude: userLocation.lng
        });
    }
  }, [userLocation]);

  const requestLocation = () => {
    setIsLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setIsLoading(false);
        },
        (error) => {
          console.error(error);
          setIsLoading(false);
          let msg = "Necesitamos tu ubicación para encontrar dulces cercanos.";
          if (error.code === error.PERMISSION_DENIED) {
            msg = "Has denegado el permiso de ubicación. Por favor, actívalo en tu navegador.";
          }
          alert(msg);
        }
      );
    } else {
      setIsLoading(false);
      alert("Geolocalización no soportada en este navegador.");
    }
  };

  const handleSearch = async (term?: string) => {
    const termToUse = typeof term === 'string' ? term : query;
    if (!location) return;
    setIsLoading(true);
    setQuery(termToUse); // Sync state
    try {
      const data = await findNearbySweetSpots(location, termToUse);
      setResults(data);
      if (viewMode === 'map') setViewMode('list'); // Switch to list to see AI results details
    } catch (e) {
      alert("Error buscando lugares cercanos.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!location) {
    return (
      <div className="bg-white rounded-3xl shadow-lg border border-orange-100 p-8 text-center">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin size={32} />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Encuentra Dulces Cercanos</h3>
        <p className="text-gray-500 mb-6">Activa tu ubicación para que nuestra IA encuentre las mejores pastelerías y churrerías a tu alrededor.</p>
        <button 
          onClick={requestLocation}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2 mx-auto"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : <Navigation size={20} />}
          Activar Ubicación
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-orange-100 relative">
      <div className="p-6 bg-blue-50/50 border-b border-blue-100 rounded-t-3xl">
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                        <MapPin size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">Explorador Local</h3>
                        <p className="text-xs text-gray-500">Lat: {location.latitude.toFixed(4)}, Lng: {location.longitude.toFixed(4)}</p>
                    </div>
                </div>
                
                <div className="flex bg-white rounded-full border border-gray-200 p-1 self-center md:self-auto">
                  <button 
                    onClick={() => setViewMode('map')} 
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'map' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    <MapIcon size={14} /> Mapa
                  </button>
                  <button 
                    onClick={() => setViewMode('list')} 
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    <Star size={14} /> Lista IA
                  </button>
                </div>
            </div>

            {/* INTEGRATED SEARCH EXPERIENCE */}
            <div className="pb-2 relative z-20">
               <SearchExperience onSearch={handleSearch} />
               {isLoading && (
                 <div className="absolute top-4 right-4 md:right-6 text-orange-500 animate-spin">
                    <Loader2 size={20} />
                 </div>
               )}
            </div>
        </div>
      </div>

      <div className="p-8 min-h-[400px]">
        {viewMode === 'map' ? (
           <BusinessMap 
             businesses={businesses} 
             center={{ lat: location.latitude, lng: location.longitude }} 
             userLocation={{ lat: location.latitude, lng: location.longitude }}
             radius={MAX_SYSTEM_RADIUS} 
             onViewBusiness={onViewBusiness}
           />
        ) : (
           results ? (
            <div className="space-y-6">
              <div className="prose prose-blue max-w-none text-gray-600">
                <p className="text-lg leading-relaxed">{results.text}</p>
              </div>

              {results.places.length > 0 && (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
                      {results.places.map((place, idx) => (
                          <a 
                              key={idx} 
                              href={place.uri} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="group block bg-white border border-gray-200 p-4 rounded-xl hover:shadow-md hover:border-blue-300 transition-all"
                          >
                              <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{place.title}</h4>
                                  <ExternalLink size={16} className="text-gray-400 group-hover:text-blue-500" />
                              </div>
                              {place.snippet && (
                                  <p className="text-xs text-gray-500 line-clamp-3 italic">"{place.snippet}"</p>
                              )}
                              <div className="mt-3 flex items-center text-xs font-semibold text-blue-600">
                                  <MapPin size={12} className="mr-1" /> Ver en Google Maps
                              </div>
                          </a>
                      ))}
                  </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Star size={48} className="mx-auto mb-4 opacity-20" />
              <p>Dile a la IA qué buscas y encontrará las joyas ocultas de tu zona.</p>
              <p className="text-xs mt-2">O cambia a la vista de Mapa para ver nuestros socios oficiales.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};
