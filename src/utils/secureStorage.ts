// Secure localStorage utilities with encryption-like obfuscation
export class SecureStorage {
  private static encode(data: string): string {
    // Simple obfuscation (not true encryption, but better than plain text)
    return btoa(encodeURIComponent(data));
  }

  private static decode(encoded: string): string {
    try {
      return decodeURIComponent(atob(encoded));
    } catch {
      return '';
    }
  }

  static setItem(key: string, value: string): void {
    try {
      const encoded = this.encode(value);
      localStorage.setItem(`eft_${key}`, encoded);
    } catch (error) {
      console.warn('Failed to store secure item:', error);
    }
  }

  static getItem(key: string): string | null {
    try {
      const encoded = localStorage.getItem(`eft_${key}`);
      if (!encoded) return null;
      return this.decode(encoded);
    } catch (error) {
      console.warn('Failed to retrieve secure item:', error);
      return null;
    }
  }

  static removeItem(key: string): void {
    try {
      localStorage.removeItem(`eft_${key}`);
    } catch (error) {
      console.warn('Failed to remove secure item:', error);
    }
  }

  static clear(): void {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('eft_'));
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear secure storage:', error);
    }
  }

  // Auto-cleanup old data (older than 7 days)
  static cleanup(): void {
    try {
      const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
      const keys = Object.keys(localStorage).filter(key => key.startsWith('eft_'));
      
      keys.forEach(key => {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const data = JSON.parse(this.decode(item));
            if (data.timestamp && data.timestamp < cutoff) {
              localStorage.removeItem(key);
            }
          }
        } catch {
          // If we can't parse it, remove it
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to cleanup storage:', error);
    }
  }
}

// Initialize cleanup on first load
SecureStorage.cleanup();