
/**
 * Secure Storage Utility
 * 
 * Provides a layer of obfuscation/encryption for LocalStorage data.
 * In a real production environment, this should leverage the Web Crypto API
 * with a key derived from user authentication. For this frontend-only architecture,
 * we use Base64 encoding with a salt to prevent casual plain-text reading.
 */

const STORAGE_SALT = "CALORYIA_SECURE_SALT_v1_";

export const secureSave = (key: string, data: any): void => {
  try {
    const jsonString = JSON.stringify(data);
    // Simple obfuscation: Prefix salt + Base64 encode
    const encrypted = btoa(STORAGE_SALT + encodeURIComponent(jsonString));
    localStorage.setItem(key, encrypted);
  } catch (e) {
    console.error("Secure Save Failed:", e);
  }
};

export const secureLoad = <T>(key: string): T | null => {
  try {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;

    // Decode
    const decodedString = decodeURIComponent(atob(encrypted));
    
    // Verify Salt
    if (!decodedString.startsWith(STORAGE_SALT)) {
      console.warn("Storage tampering detected or legacy data format.");
      // Attempt legacy load or fail safe
      return null;
    }

    const jsonString = decodedString.replace(STORAGE_SALT, '');
    return JSON.parse(jsonString) as T;
  } catch (e) {
    console.error("Secure Load Failed:", e);
    // Fallback: try reading as plain text in case of migration
    try {
        const plain = localStorage.getItem(key);
        return plain ? JSON.parse(plain) : null;
    } catch (e2) {
        return null;
    }
  }
};

export const secureClear = (key: string): void => {
  localStorage.removeItem(key);
};
