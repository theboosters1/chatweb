import CryptoJS from "crypto-js";

/**
 * Encrypts a message using a room-specific key.
 * The key is derived from the room password.
 */
export function encryptMessage(message: string, key: string): string {
  try {
    return CryptoJS.AES.encrypt(message, key).toString();
  } catch (error) {
    console.error("Encryption error:", error);
    return "";
  }
}

/**
 * Decrypts a message using a room-specific key.
 */
export function decryptMessage(ciphertext: string, key: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    if (!originalText) throw new Error("Failed to decrypt (possible wrong key)");
    return originalText;
  } catch (error) {
    console.error("Decryption error:", error);
    return "[Encrypted Message - Unreadable]";
  }
}
