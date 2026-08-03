export const uploadImageToServer = async (file) => {
  if (!file) return null;
  const { IMAGE_BASE_URL, COMMON_HEADERS, getToast } =
    await import("../api/api.jsx");
  const { ENDPOINTS } = await import("../api/endpoints.js");
  const toast = getToast();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("tenantId", "Common");
  formData.append("orgId", "100");

  try {
    const res = await fetch(`${IMAGE_BASE_URL}${ENDPOINTS.images.UPLOAD}`, {
      method: "POST",
      headers: {
        TenantId: COMMON_HEADERS.TenantId,
        OrgId: COMMON_HEADERS.OrgId,
        AppKey: COMMON_HEADERS.Appkey
      },
      body: formData
    });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.success && json?.publicUrl) {
      toast?.success("Success", json?.message || "Image uploaded successfully");
      return json.publicUrl;
    }
    throw new Error(
      json?.error ||
        json?.ErrorMessage ||
        json?.message ||
        `Upload failed: ${res.statusText}`
    );
  } catch (err) {
    console.error("[ImageUpload] Error:", err);
    toast?.error("Upload failed", err.message);
    return null;
  }
};

export const uploadAttachmentToServer = async (file) => {
  if (!file) return null;
  const { IMAGE_BASE_URL, COMMON_HEADERS, getToast } =
    await import("../api/api.jsx");
  const { ENDPOINTS } = await import("../api/endpoints.js");
  const toast = getToast();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("tenantId", "Common");
  formData.append("orgId", "100");

  try {
    const res = await fetch(
      `${IMAGE_BASE_URL}${ENDPOINTS.images.ATTACHMENT_UPLOAD}`,
      {
        method: "POST",
        headers: {
          TenantId: COMMON_HEADERS.TenantId,
          OrgId: COMMON_HEADERS.OrgId,
          AppKey: COMMON_HEADERS.Appkey
        },
        body: formData
      }
    );
    const json = await res.json().catch(() => null);
    if (res.ok && json?.success && json?.publicUrl) {
      toast?.success(
        "Success",
        json?.message || "Attachment uploaded successfully"
      );
      return {
        publicUrl: json.publicUrl,
        fileName: json.fileName,
        contentType: json.contentType,
        fileSize: json.fileSize,
        blobPath: json.blobPath
      };
    }
    throw new Error(
      json?.error ||
        json?.ErrorMessage ||
        json?.message ||
        `Upload failed: ${res.statusText}`
    );
  } catch (err) {
    console.error("[AttachmentUpload] Error:", err);
    toast?.error("Upload failed", err.message);
    return null;
  }
};

export const uploadBase64ToServer = async (
  base64DataUrl,
  filename = "image.jpg"
) => {
  if (!base64DataUrl?.startsWith("data:")) return base64DataUrl;
  try {
    const res = await fetch(base64DataUrl);
    const blob = await res.blob();
    const file = new File([blob], filename, { type: blob.type });
    return await uploadImageToServer(file);
  } catch {
    return null;
  }
};
