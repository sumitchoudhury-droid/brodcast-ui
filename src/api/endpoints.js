export const ENDPOINTS = {
  templates: {
    GET_ALL: "/api/v1/templates",
    GET_BY_ID: (id) => `/api/v1/templates/${id}`,
    CREATE: "/api/v1/templates",
    DELETE_BY_ID: (id) => `/api/v1/templates/${id}`
  },
  images: {
    UPLOAD: "/api/v1/Image/ImageUpload"
  }
};
