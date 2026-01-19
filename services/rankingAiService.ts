
import { Business, SubscriptionPack, Rating } from '../types';

// CONFIGURACIÓN DE PESOS DEL ALGORITMO (Debe sumar 1.0)
const WEIGHTS = {
    PROXIMITY: 0.30,  // 30% - La cercanía es clave en comida
    PLAN: 0.25,       // 25% - El nivel de suscripción
    REPUTATION: 0.25, // 25% - Calidad percibida (Stars + Volumen)
    ACTIVITY: 0.20    // 20% - "Vitalidad" (Stories, Live Status, Fotos recientes)
};

// Helpers
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const getPlanScore = (packId: string, packs: SubscriptionPack[]): number => {
    const pack = packs.find(p => p.id === packId);
    // Normalizamos el sortingScore del pack (asumiendo max 100 en constants)
    return pack ? pack.sortingScore : 0;
};

const getReputationScore = (ratings: Rating[] = []): number => {
    if (!ratings || ratings.length === 0) return 0;
    
    const sum = ratings.reduce((acc, r) => acc + r.stars, 0);
    const avg = sum / ratings.length;
    
    // Fórmula Bayesiana simplificada: 
    // Valoramos más un 4.8 con 50 reviews que un 5.0 con 1 review.
    // Score = (Avg / 5) * 80 + (Min(Count, 20) / 20) * 20
    const quantityFactor = Math.min(ratings.length, 50) / 50; // Cap en 50 reviews para el factor cantidad
    
    const qualityScore = (avg / 5) * 100;
    
    // Mix: 70% Calidad, 30% Cantidad (confiabilidad)
    return (qualityScore * 0.7) + (quantityFactor * 100 * 0.3);
};

const getActivityScore = (biz: Business): number => {
    let score = 0;
    
    // 1. Live Status (Muy importante para la sensación de inmediatez)
    if (biz.liveStatus === 'fresh_batch' || biz.liveStatus === 'open') score += 40;
    if (biz.liveStatus === 'last_units') score += 30;
    
    // 2. Active Stories (Contenido fresco)
    const hasActiveStory = biz.stories && biz.stories.some(s => new Date(s.expiresAt) > new Date());
    if (hasActiveStory) score += 40;

    // 3. Recent Update (Created At or similar - Simulated via Images count as proxy for effort)
    if (biz.images && biz.images.length > 5) score += 20;

    return Math.min(score, 100);
};

/**
 * MOTOR DE RANKING "SWEETRANK"
 */
export const calculateRankingScore = (
    business: Business, 
    userLat: number, 
    userLng: number, 
    packs: SubscriptionPack[],
    systemMaxRadius: number // Deprecated logic, kept for signature compat but unused for proximity denominator
): number => {
    // 1. PROXIMITY SCORE (0-100)
    // FIX: Usar el radio de visibilidad ESPECÍFICO del plan contratado en lugar del tope del sistema.
    // Esto evita que los planes "Super Top" (20km) reciban score 0 si están a 6km (cuando el sistema base es 5km).
    const pack = packs.find(p => p.id === business.packId);
    const effectiveRadius = pack ? pack.visibilityRadius : systemMaxRadius;

    const dist = calculateDistance(userLat, userLng, business.lat, business.lng);
    
    // Caída lineal: 100 si estás al lado, 0 si estás en el límite de TU radio.
    const proximityScore = dist > effectiveRadius ? 0 : Math.max(0, 100 * (1 - (dist / effectiveRadius)));

    // 2. PLAN SCORE (0-100)
    const planScore = getPlanScore(business.packId, packs);

    // 3. REPUTATION SCORE (0-100)
    const reputationScore = getReputationScore(business.ratings);

    // 4. ACTIVITY SCORE (0-100)
    const activityScore = getActivityScore(business);

    // CÁLCULO PONDERADO
    let totalScore = 
        (proximityScore * WEIGHTS.PROXIMITY) +
        (planScore * WEIGHTS.PLAN) +
        (reputationScore * WEIGHTS.REPUTATION) +
        (activityScore * WEIGHTS.ACTIVITY);

    // BONUS: AD SPEND (Pay-to-Win Boost)
    // El gasto en publicidad actúa como un multiplicador o boost directo fuera de la ponderación porcentual 0-100
    // Por cada euro gastado, sumamos 0.1 puntos al score final (capped at +50 points)
    const adBoost = Math.min((business.totalAdSpend || 0) * 0.1, 50);
    
    return totalScore + adBoost;
};
