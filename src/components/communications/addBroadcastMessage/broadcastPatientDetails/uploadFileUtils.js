import * as XLSX from "xlsx";

export const PHONE_REGEX = /^\+?\d{10,13}$/;
export const NAME_REGEX = /^[A-Za-z][A-Za-z\s'.-]*$/;

export const isPhoneInvalid = (phone) => {
  if (!phone || phone === "-") return true;
  const digits = String(phone).replace(/\D/g, "");
  return digits.length !== 10;
};

export const isEmailInvalid = (email) => {
  if (!email || email === "-") return true;
  return !email.includes("@") || !email.includes(".");
};

export const isNameInvalid = (name) => {
  if (!name || name === "-") return true;
  const trimmed = String(name).trim();
  if (!trimmed) return true;
  return !NAME_REGEX.test(trimmed);
};

export const isBalanceAmountInvalid = (balance) => {
  if (
    balance === null ||
    balance === undefined ||
    balance === "" ||
    balance === "-"
  )
    return false;
  const str = String(balance).trim();
  return !/^\d+(\.\d{1,2})?$/.test(str);
};

export const isDobInvalid = (dob) => {
  if (!dob || dob === "-") return true;
  const str = String(dob).trim();
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(str);
  if (!match) return true;
  const [, mm, dd, yyyy] = match;
  const month = Number(mm);
  const day = Number(dd);
  const year = Number(yyyy);
  if (month < 1 || month > 12) return true;
  if (year < 1900 || year > new Date().getFullYear()) return true;
  const d = new Date(year, month - 1, day);
  return (
    d.getFullYear() !== year ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day
  );
};

export const computeReason = (patient) => {
  const errors = [];
  if (isNameInvalid(patient.firstName)) errors.push("First Name");
  if (isNameInvalid(patient.lastName)) errors.push("Last Name");
  if (isDobInvalid(patient.dob)) errors.push("DOB");
  if (isPhoneInvalid(patient.phone)) errors.push("Phone");
  if (isEmailInvalid(patient.email)) errors.push("Email");
  if (isBalanceAmountInvalid(patient.balanceAmount))
    errors.push("Balance Amount");
  return errors.length > 0 ? `Invalid: ${errors.join(", ")}` : "-";
};

export const isError = (patient) => patient.reason && patient.reason !== "-";

export const formatPhone = (value) => {
  if (value === null || value === undefined || value === "" || value === "-")
    return "";
  const digits = String(value).replace(/\D/g, "").slice(0, 10);
  if (!digits) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
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
