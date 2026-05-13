import * as CryptoJS from "crypto-js";

/**
 * Encrypts a message using a room-specific key.
 * The key is derived from the room password.
 */
export function encryptMessage(message: string, key: string): string {
  if (!message || !key) return "";
  try {
    const ciphertext = CryptoJS.AES.encrypt(message, key).toString();
    return ciphertext;
  } catch (error) {
    console.error("Encryption error:", error);
    return "";
  }
}

/**
 * Decrypts a message using a room-specific key.
 */
export function decryptMessage(ciphertext: string, key: string): string {
  if (!ciphertext || !key) return "[Malformed Data]";
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!originalText) {
      return "[Decryption Failed - Check Secret Key]";
    }
    return originalText;
  } catch (error) {
    console.error("Decryption error:", error);
    return "[Decryption Error]";
  }
}
