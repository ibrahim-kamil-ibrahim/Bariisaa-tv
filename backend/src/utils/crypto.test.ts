import { encrypt, decrypt, generateDeviceKey, generateUserDeviceKey, encryptBuffer, decryptBuffer } from './crypto';

describe('Crypto utils', () => {
  describe('encrypt / decrypt', () => {
    it('round-trips plaintext correctly', () => {
      const { encrypted, iv } = encrypt('my secret data');

      expect(encrypted).not.toBe('my secret data');
      expect(decrypt(encrypted, iv)).toBe('my secret data');
    });

    it('produces a hex IV of the expected length', () => {
      const { iv } = encrypt('hello');
      expect(iv).toMatch(/^[0-9a-f]{32}$/); // 16 bytes = 32 hex chars
    });

    it('produces different ciphertexts for the same plaintext (random IV)', () => {
      const a = encrypt('hello');
      const b = encrypt('hello');

      expect(a.encrypted).not.toBe(b.encrypted);
      expect(a.iv).not.toBe(b.iv);
    });

    it('round-trips unicode text', () => {
      const text = 'Afaan Oromoo — አማርኛ 🎧';
      const { encrypted, iv } = encrypt(text);

      expect(decrypt(encrypted, iv)).toBe(text);
    });
  });

  describe('generateDeviceKey', () => {
    it('returns a 32-byte key deterministic for the same deviceUid', () => {
      const key1 = generateDeviceKey('device-abc');
      const key2 = generateDeviceKey('device-abc');

      expect(key1).toHaveLength(32);
      expect(key1.equals(key2)).toBe(true);
    });

    it('returns a different key for a different deviceUid', () => {
      const key1 = generateDeviceKey('device-abc');
      const key2 = generateDeviceKey('device-xyz');

      expect(key1.equals(key2)).toBe(false);
    });
  });

  describe('generateUserDeviceKey', () => {
    it('is deterministic and depends on both userId and deviceUid', () => {
      const a1 = generateUserDeviceKey('user-1', 'device-1');
      const a2 = generateUserDeviceKey('user-1', 'device-1');
      const b = generateUserDeviceKey('user-2', 'device-1');
      const c = generateUserDeviceKey('user-1', 'device-2');

      expect(a1).toHaveLength(32);
      expect(a1.equals(a2)).toBe(true);
      expect(a1.equals(b)).toBe(false);
      expect(a1.equals(c)).toBe(false);
    });
  });

  describe('encryptBuffer / decryptBuffer', () => {
    it('round-trips binary buffers correctly', () => {
      const key = Buffer.alloc(32, 7);
      const original = Buffer.from([1, 2, 3, 250, 251, 0, 255]);

      const { encrypted, iv } = encryptBuffer(original, key);

      expect(encrypted.equals(original)).toBe(false);
      expect(iv).toHaveLength(16);
      expect(decryptBuffer(encrypted, key, iv).equals(original)).toBe(true);
    });
  });
});
