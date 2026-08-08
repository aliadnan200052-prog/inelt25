// ════════════════════════════════════════════════════════════
// ExamAPI — the ONLY place the frontend talks to Supabase/edge
// functions from. Every page (exam, login, upgrade, admin) includes
// this file after config.js.
// ════════════════════════════════════════════════════════════
const ExamAPI = (() => {
  const { SUPABASE_URL, SUPABASE_ANON_KEY, FUNCTIONS_URL } = window.INELT_CONFIG;
  const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  class ApiError extends Error {
    constructor(message, code) {
      super(message);
      this.code = code;
    }
  }

  async function getSession() {
    const { data } = await client.auth.getSession();
    return data.session;
  }

  async function authHeader() {
    const session = await getSession();
    if (!session) throw new ApiError("Not signed in", "unauthorized");
    return { Authorization: `Bearer ${session.access_token}` };
  }

  async function call(fn, { method = "GET", body, isForm = false, raw = false } = {}) {
    const headers = await authHeader();
    if (!isForm) headers["Content-Type"] = "application/json";
    const res = await fetch(`${FUNCTIONS_URL}/${fn}`, {
      method,
      headers,
      body: isForm ? body : body ? JSON.stringify(body) : undefined,
    });
    if (raw) return res;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(data.error || res.statusText, data.error === "attempts_exhausted" ? "attempts_exhausted" : undefined);
    return data;
  }

  return {
    ApiError,
    client,
    getSession,

    // ── Auth ──────────────────────────────────────────────
    async signUpWithPassword(email, password) {
      const { error } = await client.auth.signUp({ email, password });
      if (error) throw error;
    },
    async signInWithPassword(email, password) {
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    async signInWithGoogle(redirectPath = "/index.html") {
      const { error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + redirectPath },
      });
      if (error) throw error;
    },
    async signOut() {
      await client.auth.signOut();
      window.location.href = "/login.html";
    },
    // Redirects to /login.html if not signed in, remembering the current
    // page so login.html can send the user back here afterward.
    // Returns true if the page may proceed.
    async requireSession() {
      const session = await getSession();
      if (!session) {
        window.location.href = "/login.html?redirect=" + encodeURIComponent(location.pathname);
        return false;
      }
      return true;
    },
    async requireAdminSession() {
      const session = await getSession();
      if (!session) {
        window.location.href = "/login.html?redirect=" + encodeURIComponent(location.pathname);
        return false;
      }
      return true; // real admin check happens server-side on every admin_* call
    },

    // ── Student account status ───────────────────────────
    async getStatus() {
      const session = await getSession();
      if (!session) throw new ApiError("Not signed in", "unauthorized");
      const { data, error } = await client
        .from("profiles")
        .select("attempts_used, premium")
        .eq("id", session.user.id)
        .single();
      if (error) throw error;
      return data;
    },

    // ── Exam flow ─────────────────────────────────────────
    // These call SQL functions directly in the database (no Edge
    // Function needed) — see backend/exam-functions-no-edge-required.sql
    async startExam() {
      const { data, error } = await client.rpc("start_exam");
      if (error) throw new ApiError(error.message);
      if (data?.error === "attempts_exhausted") throw new ApiError("attempts_exhausted", "attempts_exhausted");
      if (data?.error === "unauthorized") throw new ApiError("Not signed in", "unauthorized");
      if (data?.error) throw new ApiError(data.error);
      return data;
    },
    async submitExam(attemptId, answers) {
      const { data, error } = await client.rpc("submit_exam", { p_answers: answers });
      if (error) throw new ApiError(error.message);
      if (data?.error) throw new ApiError(data.error);
      return data;
    },

    // ── Premium purchase ──────────────────────────────────
    async startCheckout() {
      const { url } = await call("create-checkout", { method: "POST" });
      window.location.href = url;
    },

    // ── Admin ─────────────────────────────────────────────
    // All admin actions call plain SQL functions via .rpc() — no Edge
    // Functions needed. Each function checks server-side that the caller
    // is the admin email, so calling these as a non-admin just returns
    // {error:"forbidden"}.
    async adminImport(file) {
      const rows = await parseQuestionFile(file); // -> [{section,question,options,correct,passage}]
      let inserted = 0, duplicates = 0, invalid = [];

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const problem = validateRow(r);
        if (problem) { invalid.push({ row: i + 1, reason: problem }); continue; }
        const { data, error } = await client.rpc("admin_add_question", {
          p_section: r.section,
          p_question: r.question,
          p_options: r.options,
          p_correct: r.correct,
          p_passage: r.passage ?? null,
        });
        if (error) { invalid.push({ row: i + 1, reason: error.message }); continue; }
        if (data?.error === "duplicate") { duplicates++; continue; }
        if (data?.error) { invalid.push({ row: i + 1, reason: data.error }); continue; }
        inserted++;
      }
      return { inserted, duplicates, invalid_count: invalid.length, invalid_details: invalid.slice(0, 50) };
    },
    async adminList({ section, page = 1, pageSize = 25 } = {}) {
      const { data, error } = await client.rpc("admin_list_questions", {
        p_section: section || null, p_page: page, p_page_size: pageSize,
      });
      if (error) throw new ApiError(error.message);
      if (data?.error) throw new ApiError(data.error);
      return { rows: data.rows.map(camelizeRow), total: data.total };
    },
    async adminCount() {
      const { data, error } = await client.rpc("admin_count_questions");
      if (error) throw new ApiError(error.message);
      if (data?.error) throw new ApiError(data.error);
      return data;
    },
    async adminUpdate(id, fields) {
      const { data, error } = await client.rpc("admin_update_question", {
        p_id: id,
        p_question: fields.question ?? null,
        p_options: fields.options ?? null,
        p_correct: fields.correct_answer ?? null,
        p_passage: fields.passage ?? null,
        p_active: fields.active ?? null,
      });
      if (error) throw new ApiError(error.message);
      if (data?.error) throw new ApiError(data.error);
      return data;
    },
    async adminDelete(id) {
      const { data, error } = await client.rpc("admin_delete_question", { p_id: id });
      if (error) throw new ApiError(error.message);
      if (data?.error) throw new ApiError(data.error);
      return data;
    },
    async adminExportUrl(format = "json") {
      const { data, error } = await client.rpc("admin_export_questions");
      if (error) throw new ApiError(error.message);
      if (data?.error) throw new ApiError(data.error);

      let blob;
      if (format === "csv") {
        const cols = ["id","section","question","option1","option2","option3","option4","correct","passage"];
        const lines = [cols.join(",")];
        for (const q of data) {
          const o = q.options;
          const vals = [q.id, q.section, q.question, o[0], o[1], o[2], o[3], q.correct_answer + 1, q.passage ?? ""]
            .map(v => `"${String(v).replace(/"/g, '""')}"`);
          lines.push(vals.join(","));
        }
        blob = new Blob([lines.join("\n")], { type: "text/csv" });
      } else {
        blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `questions.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    },
  };
})();

// ── File parsing + validation for admin import (runs in the browser) ──
const VALID_SECTIONS = ["Reading Comprehension", "Grammar", "Functions", "Conversation"];

function camelizeRow(q) {
  return q; // already matches what admin.html expects (section, question, options, correct_answer, passage, id)
}

function validateRow(row) {
  if (!VALID_SECTIONS.includes(row.section)) return `Invalid section: "${row.section}"`;
  if (!row.question) return "Missing question text";
  if (!Array.isArray(row.options) || row.options.length !== 4 || row.options.some(o => !o)) return "Must have exactly 4 non-empty options";
  if (!Number.isInteger(row.correct) || row.correct < 0 || row.correct > 3) return "correct answer must resolve to 0-3 (or 1-4 in spreadsheets)";
  if (row.section === "Reading Comprehension" && !row.passage) return "Reading Comprehension rows require a passage";
  return null;
}

function normalizeRow(raw) {
  const options = Array.isArray(raw.options) ? raw.options : [raw.option1, raw.option2, raw.option3, raw.option4];
  let correct = Number(raw.correct ?? raw.correctAnswer ?? raw.answer);
  if (correct >= 1 && correct <= 4 && !raw.options) correct -= 1; // 1-indexed spreadsheet -> 0-indexed
  return {
    section: String(raw.section ?? "").trim(),
    question: String(raw.question ?? "").trim(),
    options: options.map(o => String(o ?? "").trim()),
    correct,
    passage: raw.passage ? String(raw.passage).trim() : null,
  };
}

async function parseQuestionFile(file) {
  const name = file.name.toLowerCase();
  let rawRows = [];

  if (name.endsWith(".json")) {
    rawRows = JSON.parse(await file.text());
  } else if (name.endsWith(".csv")) {
    const text = await file.text();
    const [headerLine, ...lines] = text.split(/\r?\n/).filter(l => l.trim().length);
    const cols = headerLine.split(",").map(c => c.trim());
    rawRows = lines.map(line => {
      const cells = (line.match(/(".*?"|[^,]+)(?=,|$)/g) || []).map(c => c.replace(/^"|"$/g, "").trim());
      const obj = {};
      cols.forEach((c, i) => (obj[c] = cells[i]));
      return obj;
    });
  } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    if (typeof XLSX === "undefined") throw new Error("XLSX library not loaded — add the SheetJS <script> tag to this page.");
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  } else {
    throw new Error("Unsupported file type — use .xlsx, .csv, or .json");
  }

  return rawRows.map(normalizeRow);
}
