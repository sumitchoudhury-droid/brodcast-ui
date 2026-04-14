/**
 * Utility to upload files to Cloudinary.
 *
 * To use this, you need a Cloudinary account:
 * 1. Get your "Cloud Name" from the Cloudinary Dashboard.
 * 2. Create an "Unsigned Upload Preset" in Settings > Upload > Upload presets.
 *
 * If Cloudinary is NOT configured, images are stored as compressed Data URLs.
 * Small compressed images can still be sent via EmailJS as long as the total
 * email payload stays under 50 KB.
 */

const CLOUDINARY_CLOUD_NAME = "YOUR_CLOUD_NAME"; // Replace with your cloud name
const CLOUDINARY_UPLOAD_PRESET = "YOUR_UPLOAD_PRESET"; // Replace with your unsigned upload preset

/** True when the user has filled in real Cloudinary credentials. */
export const IS_CLOUDINARY_CONFIGURED =
  CLOUDINARY_CLOUD_NAME !== "YOUR_CLOUD_NAME" &&
  CLOUDINARY_UPLOAD_PRESET !== "YOUR_UPLOAD_PRESET";

/**
 * Compress an image File/Blob to a JPEG Data URL.
 * Images wider than maxWidth are scaled down; quality is reduced to keep
 * the base64 size small enough to embed in an EmailJS payload.
 *
 * @param {File|Blob} file
 * @param {number} [maxWidth=600]   Max pixel width after scaling.
 * @param {number} [quality=0.72]   JPEG quality (0–1).
 * @returns {Promise<string>}       Compressed JPEG Data URL.
 */
const compressImage = (file, maxWidth = 600, quality = 0.72) => {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      // Always encode as JPEG for maximum compression
      resolve(canvas.toDataURL("image/jpeg", quality));
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      // Fallback: read as-is if the canvas approach fails
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    };

    img.src = objectUrl;
  });
};

/**
 * Uploads a File object to Cloudinary and returns the secure URL.
 * When Cloudinary is not configured the image is compressed and returned
 * as a Data URL so it still appears in the editor and — if small enough —
 * can survive EmailJS's 50 KB payload limit.
 *
 * @param {File} file  The File object to upload.
 * @returns {Promise<string>} Cloudinary URL or compressed Data URL.
 */
export const uploadToCloudinary = async (file) => {
  if (!file) return null;

  if (!IS_CLOUDINARY_CONFIGURED) {
    // Compress so the Data URL is as small as possible for email embedding
    return compressImage(file);
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Upload failed");
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("[Cloudinary] Upload error:", error);
    // Compress + fall back to Data URL so the image still appears in the editor
    return compressImage(file);
  }
};

/**
 * Converts a base64 Data URL to a hosted Cloudinary URL.
 * Returns null when Cloudinary is not configured or the upload fails.
 *
 * @param {string} base64DataUrl  A data: URL string (e.g. "data:image/png;base64,...").
 * @param {string} [filename]     Optional filename hint.
 * @returns {Promise<string|null>} Hosted URL, or null on failure.
 */
export const uploadBase64ToCloudinary = async (
  base64DataUrl,
  filename = "email_image.png"
) => {
  if (!base64DataUrl?.startsWith("data:")) return base64DataUrl;
  if (!IS_CLOUDINARY_CONFIGURED) return null;

  try {
    const res = await fetch(base64DataUrl);
    const blob = await res.blob();
    const file = new File([blob], filename, { type: blob.type });
    const url = await uploadToCloudinary(file);
    return url?.startsWith("http") ? url : null;
  } catch {
    return null;
  }
};
