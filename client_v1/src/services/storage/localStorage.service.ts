//storage service for localStorage management

class LocalStorageService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set<T>(key: string, value: T): void {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error("Error setting item in localStorage", error);
    }
  }
  get<T = string>(key: string): T | null {
    try {
      const serializedValue = localStorage.getItem(key);
      if (serializedValue === null) {
        return null;
      }
      return JSON.parse(serializedValue);
    } catch (error) {
      console.error("Error getting item from localStorage", error);
      return null;
    }
  }

  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error("Error clearing localStorage", error);
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error("Error removing item from localStorage", error);
    }
  }
  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }
}

export const storageService = new LocalStorageService();
export default storageService;
