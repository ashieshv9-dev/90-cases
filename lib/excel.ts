import * as XLSX from "xlsx";
import type { CaseInput } from "@/lib/db";

type RawRow = Record<string, unknown>;

const fieldAliases: Record<keyof CaseInput, string[]> = {
  customerName: ["customername", "customer", "name", "custname", "borrowername"],
  loanRefNo: [
    "loanreferencenumber",
    "loanrefno",
    "loanrefnumber",
    "loanreference",
    "loanref",
    "lan",
    "loanaccountnumber",
    "agreementnumber"
  ],
  address: ["address", "customeraddress", "residenceaddress", "mailingaddress"],
  fosName: ["fosname", "fos", "fieldofficer", "fieldofficername", "executivename"],
  totalEmiAmountDue: [
    "totalemiamountdue",
    "emiamountdue",
    "totalemi",
    "emidue",
    "totalemidue"
  ],
  duesOutstanding: [
    "duesoutstanding",
    "outstandingdues",
    "overdueamount",
    "dues",
    "amountdue"
  ],
  totalOutstanding: [
    "totaloutstanding",
    "outstanding",
    "totalamountoutstanding",
    "totalpos",
    "pos"
  ],
  disbursementDate: ["disbursementdate", "disbursaldate", "disbdate", "disbursement"]
};

export function parseCasesWorkbook(buffer: ArrayBuffer) {
  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: true
  });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("The workbook does not contain any sheets.");
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<RawRow>(sheet, {
    defval: "",
    raw: true
  });

  if (!rows.length) {
    throw new Error("The first sheet does not contain data rows.");
  }

  const headerMap = buildHeaderMap(rows[0]);
  const required: Array<keyof CaseInput> = ["customerName", "loanRefNo"];
  const missing = required.filter((field) => !headerMap[field]);

  if (missing.length) {
    throw new Error(
      `Missing required column${missing.length > 1 ? "s" : ""}: ${missing
        .map((field) => labelForField(field))
        .join(", ")}.`
    );
  }

  const parsedRows = rows
    .map((row) => toCaseInput(row, headerMap))
    .filter((row) => row.customerName || row.loanRefNo);

  if (!parsedRows.length) {
    throw new Error("No usable case rows were found in the first sheet.");
  }

  return parsedRows;
}

function buildHeaderMap(sampleRow: RawRow) {
  const normalizedHeaders = Object.keys(sampleRow).map((header) => ({
    original: header,
    normalized: normalizeHeader(header)
  }));

  return Object.fromEntries(
    Object.entries(fieldAliases).map(([field, aliases]) => {
      const match = normalizedHeaders.find((header) => aliases.includes(header.normalized));
      return [field, match?.original];
    })
  ) as Partial<Record<keyof CaseInput, string>>;
}

function toCaseInput(row: RawRow, headerMap: Partial<Record<keyof CaseInput, string>>): CaseInput {
  return {
    customerName: valueFrom(row, headerMap.customerName),
    loanRefNo: valueFrom(row, headerMap.loanRefNo),
    address: valueFrom(row, headerMap.address),
    fosName: valueFrom(row, headerMap.fosName),
    totalEmiAmountDue: valueFrom(row, headerMap.totalEmiAmountDue),
    duesOutstanding: valueFrom(row, headerMap.duesOutstanding),
    totalOutstanding: valueFrom(row, headerMap.totalOutstanding),
    disbursementDate: valueFrom(row, headerMap.disbursementDate, true)
  };
}

function valueFrom(row: RawRow, header?: string, isDate = false) {
  if (!header) {
    return "";
  }

  const value = row[header];

  if (isDate) {
    return formatDate(value);
  }

  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function formatDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d)).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    }
  }

  return value === null || value === undefined ? "" : String(value).trim();
}

function normalizeHeader(header: string) {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function labelForField(field: keyof CaseInput) {
  return field === "customerName" ? "Customer Name" : "Loan Reference Number";
}
