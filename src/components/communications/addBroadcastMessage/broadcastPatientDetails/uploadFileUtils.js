import * as XLSX from "xlsx";

export const PHONE_REGEX = /^\+?\d{10,13}$/;

export const isPhoneInvalid = (phone) => {
  if (!phone || phone === "-") return true;
  return !PHONE_REGEX.test(String(phone).trim());
};

export const isEmailInvalid = (email) => {
  if (!email || email === "-") return true;
  return !email.includes("@") || !email.includes(".");
};

export const computeReason = (patient) => {
  const missing = [];
  if (
    !patient.firstName ||
    !String(patient.firstName).trim() ||
    patient.firstName === "-"
  )
    missing.push("First Name");
  if (
    !patient.lastName ||
    !String(patient.lastName).trim() ||
    patient.lastName === "-"
  )
    missing.push("Last Name");
  if (
    !patient.dob ||
    patient.dob === "-" ||
    String(patient.dob).replace(/\D/g, "").length < 8
  )
    missing.push("DOB");
  if (isPhoneInvalid(patient.phone)) missing.push("Phone");
  if (isEmailInvalid(patient.email)) missing.push("Email");
  return missing.length > 0 ? `Missing: ${missing.join(", ")}` : "-";
};

export const isError = (patient) => patient.reason && patient.reason !== "-";

export const formatPhone = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const str = String(value).trim();
  const hasPlus = str.startsWith("+");
  const digits = str.replace(/\D/g, "").slice(0, 13);
  if (!digits) return "";
  return `${hasPlus ? "+" : ""}${digits}`;
};

export const toMmDdYyyy = (value) => {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return "";
    const m = String(parsed.m).padStart(2, "0");
    const d = String(parsed.d).padStart(2, "0");
    const y = String(parsed.y).padStart(4, "0");
    return `${m}/${d}/${y}`;
  }
  const str = String(value).trim();
  const parts = str.split("/");
  if (parts.length === 3) {
    const [mm, dd, yyyy] = parts;
    return `${mm.padStart(2, "0")}/${dd.padStart(2, "0")}/${yyyy.padStart(4, "0")}`;
  }
  return str;
};

export const parseUploadedFileToPatients = (file) =>
  new Promise((resolve, reject) => {
    if (!file) {
      resolve([]);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), {
          type: "array"
        });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
        const patients = rows.map((r, index) => {
          const balanceRaw = r["Balance Amount ($)"];
          const patient = {
            id: `uf${index}`,
            firstName: String(r["Patient First Name"] ?? "").trim(),
            lastName: String(r["Patient Last Name"] ?? "").trim(),
            dob: toMmDdYyyy(r["Date of Birth (MM/DD/YYYY)"]),
            phone: formatPhone(r["Mobile Number"]),
            email: String(r["Email"] ?? "").trim(),
            balanceAmount:
              balanceRaw === "" ||
              balanceRaw === null ||
              balanceRaw === undefined
                ? null
                : Number(balanceRaw)
          };
          patient.reason = computeReason(patient);
          return patient;
        });
        resolve(patients);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
