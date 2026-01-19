
import React, { useMemo } from 'react';
import { PushCampaign, Business } from '../types';
import { MAX_SYSTEM_RADIUS } from '../constants'; // Using standard radius or could be smaller for push

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  campaigns: PushCampaign[];
  userLocation?: { lat: number; lng: number } | null;
  businesses?: Business[];
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  isOpen, onClose, campaigns, userLocation, businesses = [] 
}) => {
  
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; 
  };

  const visibleCampaigns = useMemo(() => {
      // 1. Filter by Expiry
      const now = new Date();
      let active = campaigns.filter(c => new Date(c.expiresAt) > now);

      // 2. Filter by Geofence (if user location is available)
      if (userLocation && businesses.length > 0) {
          active = active.filter(camp => {
              const biz = businesses.find(b => b.id === camp.businessId);
              if (!biz) return false;
              
              const distKm = calculateDistance(userLocation.lat, userLocation.lng, biz.lat, biz.lng);
              // Push radius is strict: 3km
              return distKm <= 3.0;
          });
      }

      return active;
  }, [campaigns, userLocation, businesses]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-20 right-4 z-[5000] w-80 md:w-96 animate-fade-in-up">
        <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden relative">
            <div className="bg-gray-900 p-4 flex justify-between items-center text-white">
                <h4 className="font-brand font-black text-sm uppercase tracking-widest flex items-center gap-2">
                    <span className="text-lg">🔔</span> Alertas Flash Cercanas
                </h4>
                <button onClick={onClose} className="text-white/50 hover:text-white">✕</button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto scrollbar-hide p-2 bg-gray-50">
                {visibleCampaigns.length === 0 ? (
                    <div className="text-center py-10 opacity-50">
                        <p className="text-4xl mb-2">🔕</p>
                        <p className="text-[10px] font-bold uppercase">
                            {userLocation ? "Sin alertas activas en tu zona (3km)" : "Sin alertas activas"}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {visibleCampaigns.map(camp => (
                            <div key={camp.id} className="bg-white p-4 rounded-xl border-l-4 border-l-orange-500 shadow-sm animate-pulse-slow">
                                <div className="flex justify-between items-start mb-1">
                                    <h5 className="font-black text-xs text-gray-900">{camp.businessName}</h5>
                                    <span className="bg-red-100 text-red-600 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Flash</span>
                                </div>
                                <p className="text-xs text-gray-600 font-medium leading-relaxed">{camp.message}</p>
                                <p className="text-[8px] text-gray-400 font-bold mt-2 text-right">Hace {Math.floor((new Date().getTime() - new Date(camp.sentAt).getTime()) / 60000)} min</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
