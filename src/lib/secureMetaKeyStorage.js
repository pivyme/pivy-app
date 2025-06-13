// Secure storage utilities for meta keys
// Uses AES-256-GCM encryption with PBKDF2 key derivation from PIN

export class SecureMetaKeyStorage {
  // Generate a key from PIN using PBKDF2
  static async deriveKeyFromPin(pin, salt = null) {
    const pinBytes = new TextEncoder().encode(pin);
    const saltBytes = salt || crypto.getRandomValues(new Uint8Array(16));
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      pinBytes,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBytes,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true, // Make key extractable for session storage
      ['encrypt', 'decrypt']
    );
    
    return { key, salt: saltBytes };
  }

  // Encrypt data with AES-GCM
  static async encrypt(data, key) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(JSON.stringify(data));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    );
    
    return {
      encrypted: Array.from(new Uint8Array(encrypted)),
      iv: Array.from(iv)
    };
  }

  // Decrypt data with AES-GCM
  static async decrypt(encryptedData, key, iv) {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      key,
      new Uint8Array(encryptedData)
    );
    
    const decryptedString = new TextDecoder().decode(decrypted);
    return JSON.parse(decryptedString);
  }

  // Store encrypted meta keys
  static async storeEncryptedMetaKeys(pin, spendPriv, viewPriv) {
    try {
      const { key, salt } = await this.deriveKeyFromPin(pin);
      const metaKeysData = { spendPriv, viewPriv };
      const { encrypted, iv } = await this.encrypt(metaKeysData, key);
      
      const encryptedPayload = {
        encrypted,
        iv,
        salt: Array.from(salt),
        timestamp: Date.now()
      };
      
      localStorage.setItem('pivy-encrypted-meta-keys', JSON.stringify(encryptedPayload));
      
      // Store decryption key in session storage for UX (cleared on browser close)
      const keyBuffer = await crypto.subtle.exportKey('raw', key);
      sessionStorage.setItem('pivy-session-key', JSON.stringify({
        key: Array.from(new Uint8Array(keyBuffer)),
        timestamp: Date.now()
      }));
      
      return true;
    } catch (error) {
      console.error('Failed to store encrypted meta keys:', error);
      return false;
    }
  }

  // Retrieve and decrypt meta keys using PIN
  static async retrieveMetaKeysWithPin(pin) {
    try {
      const encryptedPayload = localStorage.getItem('pivy-encrypted-meta-keys');
      if (!encryptedPayload) return null;
      
      const { encrypted, iv, salt } = JSON.parse(encryptedPayload);
      const { key } = await this.deriveKeyFromPin(pin, new Uint8Array(salt));
      
      const decryptedData = await this.decrypt(encrypted, key, iv);
      
      // Update session key for future use
      const keyBuffer = await crypto.subtle.exportKey('raw', key);
      sessionStorage.setItem('pivy-session-key', JSON.stringify({
        key: Array.from(new Uint8Array(keyBuffer)),
        timestamp: Date.now()
      }));
      
      return decryptedData;
    } catch (error) {
      console.error('Failed to decrypt meta keys with PIN:', error);
      return null;
    }
  }

  // Retrieve meta keys using session key (for UX without re-entering PIN)
  static async retrieveMetaKeysWithSession() {
    try {
      const sessionKeyData = sessionStorage.getItem('pivy-session-key');
      const encryptedPayload = localStorage.getItem('pivy-encrypted-meta-keys');
      
      if (!sessionKeyData || !encryptedPayload) return null;
      
      const { key: keyArray, timestamp } = JSON.parse(sessionKeyData);
      const { encrypted, iv } = JSON.parse(encryptedPayload);
      
      // Check if session key is not too old (24 hours)
      if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
        sessionStorage.removeItem('pivy-session-key');
        return null;
      }
      
      const key = await crypto.subtle.importKey(
        'raw',
        new Uint8Array(keyArray),
        { name: 'AES-GCM' },
        false, // Session keys don't need to be extractable
        ['decrypt']
      );
      
      const decryptedData = await this.decrypt(encrypted, key, iv);
      return decryptedData;
    } catch (error) {
      console.error('Failed to decrypt meta keys with session:', error);
      sessionStorage.removeItem('pivy-session-key');
      return null;
    }
  }

  // Check if encrypted meta keys exist
  static hasEncryptedMetaKeys() {
    return !!localStorage.getItem('pivy-encrypted-meta-keys');
  }

  // Clear all meta key data
  static clearMetaKeys() {
    localStorage.removeItem('pivy-encrypted-meta-keys');
    sessionStorage.removeItem('pivy-session-key');
  }
} 