export const ENDPOINTS = {
  templates: {
    GET_ALL: "/api/v1/templates",
    GET_BY_ID: (id) => `/api/v1/templates/${id}`,
    CREATE: "/api/v1/templates",
    DELETE_BY_ID: (id) => `/api/v1/templates/${id}`
  },
  images: {
    UPLOAD: "/api/v1/Image/ImageUpload"
  },
  broadcastConfig: {
    COMMUNICATION_MODES:
      "/api/v1/aggregate/broadcast-config/communication-modes",
    PRIORITIES: "/api/v1/aggregate/broadcast-config/priorities",
    PATIENT_TYPES: "/api/v1/aggregate/broadcast-config/patient-types",
    CATEGORIES: "/api/v1/aggregate/broadcast-config/categories/",
    APPOINTMENT_TYPES: "/api/v1/aggregate/broadcast-config/appointment-types",
    LOCATIONS: "/api/v1/aggregate/broadcast-config/locations",
    PROVIDERS: "/api/v1/aggregate/broadcast-config/providers"
  }
};
