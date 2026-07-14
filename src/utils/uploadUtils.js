const IMAGE_UPLOAD_APP_KEY = JSON.stringify({
  AuthorizedAccessToken:
    "bearer 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",
  ClientId: "9e3a16cf-1e10-44e5-a16b-7eef8ed4729f",
  TenantId: "V824QA",
  ExpiryTime: "/Date(1784034946841)/"
});

export const uploadImageToServer = async (file) => {
  if (!file) return null;
  const { BASE_URL, COMMON_HEADERS } = await import("../api/api.jsx");
  const { ENDPOINTS } = await import("../api/endpoints.js");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("tenantId", "Common");
  formData.append("orgId", "100");

  try {
    const res = await fetch(`${BASE_URL}${ENDPOINTS.images.UPLOAD}`, {
      method: "POST",
      headers: {
        TenantId: COMMON_HEADERS.TenantId,
        OrgId: COMMON_HEADERS.OrganizationId,
        Appkey: IMAGE_UPLOAD_APP_KEY
      },
      body: formData
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
    const json = await res.json();
    if (json?.success && json?.publicUrl) return json.publicUrl;
    throw new Error(json?.message || "Upload failed");
  } catch (err) {
    console.error("[ImageUpload] Error:", err);
    return null;
  }
};

export const uploadAttachmentToServer = async (file) => {
  if (!file) return null;
  const { BASE_URL, COMMON_HEADERS } = await import("../api/api.jsx");
  const { ENDPOINTS } = await import("../api/endpoints.js");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("tenantId", "Common");
  formData.append("orgId", "100");

  try {
    const res = await fetch(
      `${BASE_URL}${ENDPOINTS.images.ATTACHMENT_UPLOAD}`,
      {
        method: "POST",
        headers: {
          TenantId: COMMON_HEADERS.TenantId,
          OrgId: COMMON_HEADERS.OrganizationId,
          Appkey: IMAGE_UPLOAD_APP_KEY
        },
        body: formData
      }
    );
    if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
    const json = await res.json();
    if (json?.success && json?.publicUrl) return json.publicUrl;
    throw new Error(json?.message || "Upload failed");
  } catch (err) {
    console.error("[AttachmentUpload] Error:", err);
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
