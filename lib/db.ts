import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export type CaseRecord = {
  id: number;
  customerName: string;
  loanRefNo: string;
  address: string;
  fosName: string;
  totalEmiAmountDue: string;
  duesOutstanding: string;
  totalOutstanding: string;
  disbursementDate: string;
};

export type CaseInput = Omit<CaseRecord, "id">;

type SqliteGlobal = typeof globalThis & {
  __ninetyCasesDb?: Database.Database;
};

function getDbPath() {
  if (process.env.CASES_DB_PATH) {
    return path.resolve(process.cwd(), process.env.CASES_DB_PATH);
  }

  if (process.env.VERCEL) {
    return "/tmp/90-cases.sqlite";
  }

  return path.join(process.cwd(), "data", "90-cases.sqlite");
}

function openDb() {
  const dbPath = getDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      loan_ref_no TEXT NOT NULL,
      address TEXT NOT NULL DEFAULT '',
      fos_name TEXT NOT NULL DEFAULT '',
      total_emi_amount_due TEXT NOT NULL DEFAULT '',
      dues_outstanding TEXT NOT NULL DEFAULT '',
      total_outstanding TEXT NOT NULL DEFAULT '',
      disbursement_date TEXT NOT NULL DEFAULT '',
      search_text TEXT NOT NULL DEFAULT ''
    );

    CREATE INDEX IF NOT EXISTS idx_cases_loan_ref ON cases(loan_ref_no);
    CREATE INDEX IF NOT EXISTS idx_cases_customer ON cases(customer_name);
    CREATE INDEX IF NOT EXISTS idx_cases_search ON cases(search_text);

    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  return db;
}

export function getDb() {
  const globalForDb = globalThis as SqliteGlobal;

  if (!globalForDb.__ninetyCasesDb) {
    globalForDb.__ninetyCasesDb = openDb();
  }

  return globalForDb.__ninetyCasesDb;
}

export function replaceCases(records: CaseInput[]) {
  const db = getDb();
  const insert = db.prepare(`
    INSERT INTO cases (
      customer_name,
      loan_ref_no,
      address,
      fos_name,
      total_emi_amount_due,
      dues_outstanding,
      total_outstanding,
      disbursement_date,
      search_text
    )
    VALUES (@customerName, @loanRefNo, @address, @fosName, @totalEmiAmountDue, @duesOutstanding, @totalOutstanding, @disbursementDate, @searchText)
  `);

  const transaction = db.transaction((rows: CaseInput[]) => {
    db.prepare("DELETE FROM cases").run();

    for (const row of rows) {
      insert.run({
        ...row,
        searchText: `${row.loanRefNo} ${row.customerName}`.toLowerCase()
      });
    }

    db.prepare(`
      INSERT INTO app_meta (key, value)
      VALUES ('last_upload_at', @lastUploadAt), ('row_count', @rowCount)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run({
      lastUploadAt: new Date().toISOString(),
      rowCount: String(rows.length)
    });
  });

  transaction(records);
}

export function searchCases(query: string) {
  const trimmed = query.trim().toLowerCase();

  if (!trimmed) {
    return [];
  }

  return getDb()
    .prepare(
      `
      SELECT
        id,
        customer_name AS customerName,
        loan_ref_no AS loanRefNo,
        address,
        fos_name AS fosName,
        total_emi_amount_due AS totalEmiAmountDue,
        dues_outstanding AS duesOutstanding,
        total_outstanding AS totalOutstanding,
        disbursement_date AS disbursementDate
      FROM cases
      WHERE search_text LIKE @needle ESCAPE '\'
      ORDER BY
        CASE
          WHEN lower(loan_ref_no) = @exact THEN 0
          WHEN lower(customer_name) = @exact THEN 1
          WHEN lower(loan_ref_no) LIKE @prefix ESCAPE '\' THEN 2
          WHEN lower(customer_name) LIKE @prefix ESCAPE '\' THEN 3
          ELSE 4
        END,
        customer_name ASC
      LIMIT 50
    `
    )
    .all({
      exact: trimmed,
      prefix: `${escapeLike(trimmed)}%`,
      needle: `%${escapeLike(trimmed)}%`
    }) as CaseRecord[];
}

export function getCaseStats() {
  const db = getDb();
  const countRow = db.prepare("SELECT COUNT(*) AS count FROM cases").get() as {
    count: number;
  };
  const uploadRow = db
    .prepare("SELECT value FROM app_meta WHERE key = 'last_upload_at'")
    .get() as { value: string } | undefined;

  return {
    total: countRow.count,
    lastUploadAt: uploadRow?.value || null
  };
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}
