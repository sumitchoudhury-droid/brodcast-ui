const formatDate = (date) => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${month}/${day}/${year} ${hours}:${minutes}:${seconds} ${ampm}`;
};

const getScheduledDate = (index) => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);

  const targetDay = new Date(startOfWeek);
  targetDay.setDate(startOfWeek.getDate() + (index % 7));

  const hour = ((index * 2 + 8) % 10) + 8; // 8 to 17 (8 AM to 5 PM)
  const minute = (index * 5) % 60;
  targetDay.setHours(hour, minute, 0, 0);
  return formatDate(targetDay);
};

const generateMockData = () => {
  const initialData = [
    {
      id: "1",
      mode: "Text, Mail",
      hasError: false,
      template: "Account Statement",
      appointmentType: "VAC-A Vaccination Appointment",
      appointmentCount: 49,
      location: "Riverbend Urgent Care",
      locationCount: 12,
      provider: "Barbara Phillips",
      providerCount: 12,
      scheduledDateTime: getScheduledDate(1),
      messageStatus: {
        total: "2,587",
        delivered: "-",
        failed: "-",
        pending: "-"
      },
      broadcastStatus: "Scheduled Daily",
      isDisabled: false
    },
    {
      id: "2",
      mode: "Text, Mail, Voice",
      hasError: false,
      template: "Account Statement",
      appointmentType: "VAC-A Vaccination Appointment",
      appointmentCount: 49,
      location: "Riverbend Urgent Care",
      locationCount: 12,
      provider: "Barbara Phillips",
      providerCount: 12,
      scheduledDateTime: getScheduledDate(2),
      messageStatus: {
        total: "2,587",
        delivered: "-",
        failed: "-",
        pending: "-"
      },
      broadcastStatus: "Completed",
      isDisabled: false
    },
    {
      id: "3",
      mode: "Mail",
      hasError: false,
      template: "Account Statement",
      appointmentType: "VAC-A Vaccination Appointment",
      appointmentCount: 49,
      location: "Riverbend Urgent Care",
      locationCount: 12,
      provider: "Barbara Phillips",
      providerCount: 12,
      scheduledDateTime: getScheduledDate(3),
      messageStatus: {
        total: "2,587",
        delivered: "-",
        failed: "-",
        pending: "-"
      },
      broadcastStatus: "Scheduled Weekly",
      isDisabled: false
    },
    {
      id: "4",
      mode: "Text, Mail, Voice",
      hasError: false,
      template: "Camp Schedule",
      appointmentType: "VAC-A Vaccination Appointment",
      appointmentCount: 49,
      location: "Riverbend Urgent Care",
      locationCount: 12,
      provider: "Barbara Phillips",
      providerCount: 12,
      scheduledDateTime: getScheduledDate(4),
      messageStatus: {
        total: "428",
        delivered: "120",
        failed: "-",
        pending: "308"
      },
      broadcastStatus: "Running Monthly",
      isDisabled: false
    },
    {
      id: "5",
      mode: "Text, Mail, Voice",
      hasError: false,
      template: "Account Statement",
      appointmentType: "VAC-A Vaccination Appointment",
      appointmentCount: 49,
      location: "Riverbend Urgent Care",
      locationCount: 12,
      provider: "Barbara Phillips",
      providerCount: 12,
      scheduledDateTime: getScheduledDate(5),
      messageStatus: {
        total: "2,587",
        delivered: "-",
        failed: "-",
        pending: "-"
      },
      broadcastStatus: "Completed",
      isDisabled: false
    },
    {
      id: "6",
      mode: "Text, Mail,...",
      hasError: true,
      template: "Account Statement",
      appointmentType: "VAC-A Vaccination Appointment",
      appointmentCount: 49,
      location: "Riverbend Urgent Care",
      locationCount: 12,
      provider: "Barbara Phillips",
      providerCount: 12,
      scheduledDateTime: getScheduledDate(6),
      messageStatus: {
        total: "1,643",
        delivered: "-",
        failed: "1,643",
        pending: "-"
      },
      broadcastStatus: "Failed",
      isDisabled: false
    },
    {
      id: "7",
      mode: "Mail",
      hasError: false,
      template: "Account Statement",
      appointmentType: "VAC-A Vaccination Appointment",
      appointmentCount: 49,
      location: "Riverbend Urgent Care",
      locationCount: 12,
      provider: "Barbara Phillips",
      providerCount: 12,
      scheduledDateTime: getScheduledDate(7),
      messageStatus: {
        total: "2,587",
        delivered: "-",
        failed: "-",
        pending: "-"
      },
      broadcastStatus: "Running Monthly",
      isDisabled: false
    },
    {
      id: "8",
      mode: "Mail",
      hasError: false,
      template: "Account Statement",
      appointmentType: "VAC-A Vaccination Appointment",
      appointmentCount: 49,
      location: "Riverbend Urgent Care",
      locationCount: 12,
      provider: "Barbara Phillips",
      providerCount: 12,
      scheduledDateTime: getScheduledDate(8),
      messageStatus: {
        total: "2,587",
        delivered: "-",
        failed: "-",
        pending: "-"
      },
      broadcastStatus: "Cancelled",
      isDisabled: true
    },
    {
      id: "9",
      mode: "Mail",
      hasError: false,
      template: "Account Statement",
      appointmentType: "VAC-A Vaccination Appointment",
      appointmentCount: 49,
      location: "Riverbend Urgent Care",
      locationCount: 12,
      provider: "Barbara Phillips",
      providerCount: 12,
      scheduledDateTime: getScheduledDate(9),
      messageStatus: {
        total: "2,587",
        delivered: "-",
        failed: "-",
        pending: "-"
      },
      broadcastStatus: "Running Daily",
      isDisabled: false
    },
    {
      id: "10",
      mode: "Text, Mail,...",
      hasError: true,
      template: "Account Statement",
      appointmentType: "VAC-A Vaccination Appointment",
      appointmentCount: 49,
      location: "Riverbend Urgent Care",
      locationCount: 12,
      provider: "Barbara Phillips",
      providerCount: 12,
      scheduledDateTime: getScheduledDate(10),
      messageStatus: {
        total: "1,643",
        delivered: "-",
        failed: "1,643",
        pending: "-"
      },
      broadcastStatus: "Failed",
      isDisabled: false
    },
    {
      id: "11",
      mode: "Mail",
      hasError: false,
      template: "Account Statement",
      appointmentType: "VAC-A Vaccination Appointment",
      appointmentCount: 49,
      location: "Riverbend Urgent Care",
      locationCount: 12,
      provider: "Barbara Phillips",
      providerCount: 12,
      scheduledDateTime: getScheduledDate(11),
      messageStatus: {
        total: "2,587",
        delivered: "-",
        failed: "-",
        pending: "-"
      },
      broadcastStatus: "Cancelled",
      isDisabled: true
    },
    {
      id: "12",
      mode: "Mail",
      hasError: false,
      template: "Account Statement",
      appointmentType: "VAC-A Vaccination Appointment",
      appointmentCount: 49,
      location: "Riverbend Urgent Care",
      locationCount: 12,
      provider: "Barbara Phillips",
      providerCount: 12,
      scheduledDateTime: getScheduledDate(12),
      messageStatus: {
        total: "2,587",
        delivered: "-",
        failed: "-",
        pending: "-"
      },
      broadcastStatus: "Completed",
      isDisabled: false
    }
  ];

  const modes = ["Text, Mail", "Text, Mail, Voice", "Mail", "Text", "Voice"];
  const templates = [
    "Account Statement",
    "Camp Schedule",
    "Appointment Reminder",
    "Follow-up Care",
    "Payment Due Alert"
  ];
  const appointmentTypes = [
    "VAC-A Vaccination Appointment",
    "GHC-A General Health Check",
    "ECG-A ECG Screening",
    "FUP-A Follow-Up Consultation",
    "BPC-A Blood Pressure Check",
    "DER-A Dermatology Consultation",
    "DBC-A Diabetes Check"
  ];
  const locations = [
    "Riverbend Urgent Care",
    "Sunnyvale Medical Center",
    "Eastside Urgent Care",
    "Greenwood Health Clinic",
    "Maplewood Family Practice"
  ];
  const providers = [
    "Barbara Phillips",
    "Olivia Smith",
    "Ethan Brown",
    "Sophia Green",
    "Liam Carter",
    "Olivia White",
    "Noah Harris"
  ];
  const statuses = [
    "Scheduled Daily",
    "Completed",
    "Running Monthly",
    "Failed",
    "Cancelled",
    "Scheduled Weekly",
    "Running Daily",
    "In-progress"
  ];

  for (let i = 13; i <= 115; i++) {
    const status = statuses[i % statuses.length];
    const totalVal = ((i * 137) % 3000) + 100;
    const total = totalVal.toLocaleString("en-US");
    let delivered = "-";
    let failed = "-";
    let pending = "-";

    if (status === "Completed") {
      delivered = total;
    } else if (status === "Failed") {
      failed = total;
    } else if (status.includes("Running")) {
      const delVal = Math.floor(totalVal * 0.4);
      delivered = delVal.toLocaleString("en-US");
      pending = (totalVal - delVal).toLocaleString("en-US");
    }

    initialData.push({
      id: String(i),
      mode: modes[i % modes.length],
      hasError: i % 17 === 0,
      template: templates[i % templates.length],
      appointmentType: appointmentTypes[i % appointmentTypes.length],
      appointmentCount: ((i * 7 + 13) % 140) + 10,
      location: locations[i % locations.length],
      locationCount: ((i * 3 + 2) % 15) + 1,
      provider: providers[i % providers.length],
      providerCount: ((i * 4 + 3) % 15) + 1,
      scheduledDateTime: getScheduledDate(i),
      messageStatus: {
        total,
        delivered,
        failed,
        pending
      },
      broadcastStatus: status,
      isDisabled: status === "Cancelled"
    });
  }

  return initialData;
};

export const mockData = generateMockData();
