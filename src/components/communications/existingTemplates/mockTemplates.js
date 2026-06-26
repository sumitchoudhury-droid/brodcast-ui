import templateSs1 from "../../../assets/existingTemplate/templateSs1.svg";
import templateSs2 from "../../../assets/existingTemplate/templateSs2.svg";
import templateSs3 from "../../../assets/existingTemplate/templateSs3.svg";
import templateSs4 from "../../../assets/existingTemplate/templateSs4.svg";

export const MOCK_TEMPLATES = [
  {
    id: 1,
    title: "Appointment Rescheduled",
    modes: ["mail", "text", "voice"],
    lastModified: "2 hours ago",
    image: templateSs1
  },
  {
    id: 2,
    title: "Health Camp Invitation",
    modes: ["mail", "text"],
    lastModified: "1 day ago",
    image: templateSs2
  },
  {
    id: 3,
    title: "Treatment Plan Update",
    modes: ["mail", "text", "voice"],
    lastModified: "3 days ago",
    image: templateSs3
  },
  {
    id: 4,
    title: "Seasonal Health Advisory",
    modes: ["text", "voice"],
    lastModified: "5 days ago",
    image: templateSs4
  },
  {
    id: 5,
    title: "Diabetes Screening Alert",
    modes: ["mail"],
    lastModified: "1 week ago"
  },
  {
    id: 6,
    title: "Wellness Program Enrollment",
    modes: ["mail", "text"],
    lastModified: "2 weeks ago"
  },
  {
    id: 7,
    title: "Invoice Generated Notification",
    modes: ["mail", "text", "voice"],
    lastModified: "2 weeks ago"
  },
  {
    id: 8,
    title: "Follow-Up Consultation Reminder",
    modes: ["mail", "voice"],
    lastModified: "3 weeks ago"
  },
  {
    id: 9,
    title: "Consent Form Reminder",
    modes: ["mail"],
    lastModified: "1 month ago"
  }
];
