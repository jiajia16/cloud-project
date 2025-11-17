import { BrowserQRCodeReader } from "@zxing/browser";

export async function decodeQrFromFile(file) {
  const url = URL.createObjectURL(file);
  try {
    const reader = new BrowserQRCodeReader();
    // decodeFromImageUrl throws if not found/invalid
    const result = await reader.decodeFromImageUrl(url);
    return result.getText();
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function decodeCheckinTokenClaims(token) {
  if (!token || typeof token !== "string") {
    return null;
  }
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }
  const payloadPart = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  if (typeof atob !== "function") {
    return null;
  }
  try {
    const padded = payloadPart.padEnd(
      payloadPart.length + ((4 - (payloadPart.length % 4)) % 4),
      "="
    );
    const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const jsonString = new TextDecoder("utf-8").decode(bytes);
    return JSON.parse(jsonString);
  } catch (err) {
    console.warn("Unable to decode QR token payload", err);
    return null;
  }
}
