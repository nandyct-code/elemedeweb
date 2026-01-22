
/**
 * SECURITY CORE UTILITIES
 * Implementación de criptografía estándar SHA-256 para el frontend.
 * Used for secure local authentication of Internal Admins without exposing plain text passwords.
 */

// Convierte un string a su hash SHA-256 hexadecimal
export async function hashPassword(plainText: string): Promise<string> {
  if (!plainText) return '';
  const msgBuffer = new TextEncoder().encode(plainText);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Verifica si un texto plano coincide con un hash almacenado
export async function verifyPassword(plainText: string, storedHash: string): Promise<boolean> {
  const inputHash = await hashPassword(plainText);
  // Simple check. For high security backend, use timingSafeEqual, but this is client-side mock logic.
  return inputHash === storedHash;
}

// Genera un token de sesión seguro (simulado)
export function generateSessionToken(): string {
  return 'sess_' + Math.random().toString(36).substr(2) + Date.now().toString(36);
}
