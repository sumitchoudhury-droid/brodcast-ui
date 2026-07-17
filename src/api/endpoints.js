export const ENDPOINTS = {
  templates: {
    GET_ALL: "/templates/list",
    GET_BY_ID: (id) => `/templates/${id}`,
    CREATE: "/templates",
    DELETE_BY_ID: (id) => `/templates/${id}`
  },
  images: {
    UPLOAD: "/Image/ImageUpload",
    ATTACHMENT_UPLOAD: "/Image/AttachmentUpload"
  },
  broadcastSchedule: {
    GET_ALL: "/aggregate/broadcast-schedules",
    CREATE: "/aggregate/broadcast-schedules",
    CANCEL: (id) => `/aggregate/broadcast-schedules/${id}/cancel`
  },
  broadcastConfig: {
    COMMUNICATION_MODES: "/aggregate/broadcast-config/communication-modes",
    PRIORITIES: "/aggregate/broadcast-config/priorities",
    PATIENT_TYPES: "/aggregate/broadcast-config/patient-types",
    CATEGORIES: "/aggregate/broadcast-config/categories/",
    APPOINTMENT_TYPES: "/aggregate/broadcast-config/appointment-types",
    LOCATIONS: "/aggregate/broadcast-config/locations",
    PROVIDERS: "/aggregate/broadcast-config/providers",
    AGE_OPTIONS: "/aggregate/broadcast-config/age-options",
    GENDER_OPTIONS: "/aggregate/broadcast-config/gender-options",
    MODALITIES: "/aggregate/broadcast-config/modalities",
    SCHEDULE_SEND_OPTIONS: "/aggregate/broadcast-config/schedule-send-options"
  }
};
