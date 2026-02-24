import { createCipheriv, createHash, randomBytes } from "node:crypto";

type EncryptExportPayloadInput = {
  payload: Record<string, unknown>;
  secret: string;
  recipientFingerprint: string;
};

export type ExportEnvelope = {
  algorithm: "aes-256-gcm";
  ivB64: string;
  authTagB64: string;
  ciphertextB64: string;
  keyHint: string;
};

function deriveKey(secret: string, recipientFingerprint: string): Buffer {
  return createHash("sha256").update(`${secret}:${recipientFingerprint}`).digest();
}

export function encryptExportPayload(input: EncryptExportPayloadInput): ExportEnvelope {
  const key = deriveKey(input.secret, input.recipientFingerprint);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(input.payload), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    algorithm: "aes-256-gcm",
    ivB64: iv.toString("base64"),
    authTagB64: authTag.toString("base64"),
    ciphertextB64: ciphertext.toString("base64"),
    keyHint: createHash("sha256").update(input.recipientFingerprint).digest("hex").slice(0, 12),
  };
}
