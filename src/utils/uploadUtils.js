const IMAGE_UPLOAD_APP_KEY = JSON.stringify({
  AuthorizedAccessToken:
    "bearer 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",
  ClientId: "9e3a16cf-1e10-44e5-a16b-7eef8ed4729f",
  TenantId: "V824QA",
  ExpiryTime: "/Date(1785310990525)/"
});

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
        Appkey: IMAGE_UPLOAD_APP_KEY
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
          Appkey: IMAGE_UPLOAD_APP_KEY
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
