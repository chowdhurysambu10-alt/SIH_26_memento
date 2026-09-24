// Hybrid E2EE using RSA-OAEP + AES-GCM

export async function generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const publicKeyBuf = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
  const privateKeyBuf = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

  const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuf)));
  const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKeyBuf)));

  return { publicKey: publicKeyBase64, privateKey: privateKeyBase64 };
}

export async function encryptMessage(text: string, recipientPublicKeyBase64: string): Promise<string> {
  try {
    // 1. Import Recipient's RSA Public Key
    const publicDer = Uint8Array.from(atob(recipientPublicKeyBase64), c => c.charCodeAt(0));
    const publicKey = await window.crypto.subtle.importKey(
      "spki",
      publicDer,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["encrypt"]
    );

    // 2. Generate a random AES-GCM 256-bit key for this specific message
    const aesKey = await window.crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );

    // 3. Encrypt the text using the AES key
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(text);
    const aesCiphertextBuf = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      aesKey,
      encoded
    );

    // 4. Export the AES key and encrypt it using the RSA Public Key
    const rawAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
    const encryptedAesKeyBuf = await window.crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      publicKey,
      rawAesKey
    );

    // 5. Encode all parts to base64 and join them
    const aesCiphertextB64 = btoa(String.fromCharCode(...new Uint8Array(aesCiphertextBuf)));
    const ivB64 = btoa(String.fromCharCode(...iv));
    const encryptedAesKeyB64 = btoa(String.fromCharCode(...new Uint8Array(encryptedAesKeyBuf)));

    return `${aesCiphertextB64}.${ivB64}.${encryptedAesKeyB64}`;
  } catch (e) {
    console.error('Encryption failed:', e);
    throw new Error('Encryption failed');
  }
}

export async function decryptMessage(encryptedPayload: string, privateKeyBase64: string): Promise<string> {
  try {
    const parts = encryptedPayload.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted payload format');
    }
    const [aesCiphertextB64, ivB64, encryptedAesKeyB64] = parts;

    // 1. Import user's RSA Private Key
    const privateDer = Uint8Array.from(atob(privateKeyBase64), c => c.charCodeAt(0));
    const privateKey = await window.crypto.subtle.importKey(
      "pkcs8",
      privateDer,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["decrypt"]
    );

    // 2. Decrypt the AES key using the RSA Private Key
    const encryptedAesKeyBuf = Uint8Array.from(atob(encryptedAesKeyB64), c => c.charCodeAt(0));
    const rawAesKey = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      encryptedAesKeyBuf
    );

    // 3. Import the decrypted AES key
    const aesKey = await window.crypto.subtle.importKey(
      "raw",
      rawAesKey,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    // 4. Decrypt the ciphertext
    const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
    const aesCiphertextBuf = Uint8Array.from(atob(aesCiphertextB64), c => c.charCodeAt(0));
    const decryptedBuf = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      aesKey,
      aesCiphertextBuf
    );

    return new TextDecoder().decode(decryptedBuf);
  } catch (e) {
    console.error('Decryption failed:', e);
    return '*(Error: Message could not be decrypted. It may have been sent to a different alias.)*';
  }
}
