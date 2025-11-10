// Minimal QR decoder for image files using ZXing
// Works with object URLs; revokes URL after decode.

import { BrowserQRCodeReader } from "@zxing/browser";

/**
 * Decode a QR code text from an image File (PNG/JPG).
 * @param {File} file
 * @returns {Promise<string>} decoded text
 */
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
