
const STORAGE_SALT = "CALORYIA_SECURE_SALT_v1_";

export const secureSave = (key: string, data: any): void => {
  try {
    const jsonString = JSON.stringify(data);
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

    const decodedString = decodeURIComponent(atob(encrypted));
    
    if (!decodedString.startsWith(STORAGE_SALT)) {
      console.warn("Storage tampering detected or legacy data format.");
      return null;
    }

    const jsonString = decodedString.replace(STORAGE_SALT, '');
    return JSON.parse(jsonString) as T;
  } catch (e) {
    console.error("Secure Load Failed:", e);
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
