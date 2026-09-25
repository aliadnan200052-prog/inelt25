let page = 1;

async function init() {
  const ok = await ExamAPI.requireAdminSession();
  if (!ok) return;
  try {
    await loadStats();
    document.getElementById('whoami').textContent = '';
    document.getElementById('app').style.display = 'block';
    loadList();
    loadPassages();
  } catch (e) {
    document.getElementById('whoami').textContent = 'Access denied — this account is not an admin.';
  }
}

async function loadStats() {
  const { total, by_section } = await ExamAPI.adminCount();
  const g = document.getElementById('statsGrid');
  g.innerHTML = `<div class="stat"><div class="n">${total}</div><div class="l">Total questions</div></div>` +
    Object.entries(by_section).map(([s, n]) => `<div class="stat"><div class="n">${n}</div><div class="l">${s}</div></div>`).join('');
}

async function doImport() {
  const file = document.getElementById('fileInput').files[0];
  if (!file) return alert('Choose a file first');
  const box = document.getElementById('importResult');
  box.textContent = 'Importing…';
  try {
    const r = await ExamAPI.adminImport(file);
    box.textContent = `✅ Imported: ${r.inserted}   ⏭ Duplicates skipped: ${r.duplicates}   ⚠️ Invalid rows: ${r.invalid_count}` +
      (r.invalid_details?.length ? '\n\n' + r.invalid_details.map(d => `Row ${d.row}: ${d.reason}`).join('\n') : '');
    await loadStats();
    loadList();
  } catch (e) {
    box.textContent = 'Error: ' + e.message;
  }
}

/* ── Reading passages ──────────────────────────────────────────────
   A passage has no row of its own: it is the text shared by several
   questions, keyed by the md5 of that text. Saving a name writes it onto
   every question carrying the passage, which is what makes the name
   belong to the passage rather than to one question. */
async function loadPassages() {
  const box = document.getElementById('passagesBox');
  box.textContent = 'loading…';
  let list;
  try {
    list = await ExamAPI.listPassages();
  } catch (e) {
    box.textContent = 'Error: ' + e.message;
    return;
  }
  if (!list.length) {
    box.innerHTML = '<p class="muted">No reading passages in the bank yet.</p>';
    return;
  }
  box.innerHTML = list.map(p => `
    <div class="pass-row" data-key="${escapeHtml(p.key)}">
      <input class="pass-title" type="text" dir="rtl" lang="ar"
             placeholder="اسم القطعة بالعربية" value="${escapeHtml(p.title || '')}">
      <span class="pass-preview">${escapeHtml(p.preview || '')}</span>
      <span class="muted pass-count">${Number(p.count) || 0} Q</span>
      <button class="secondary" data-save="1">Save</button>
      <button class="danger" data-drop="1">Delete</button>
      <span class="pass-saved"></span>
    </div>`).join('');
}

async function savePassageTitle(row) {
  const input = row.querySelector('.pass-title');
  const note  = row.querySelector('.pass-saved');
  const btn   = row.querySelector('[data-save]');
  btn.disabled = true;
  note.textContent = '';
  try {
    await ExamAPI.adminSetPassageTitle(row.dataset.key, input.value);
    note.textContent = 'Saved';
    setTimeout(() => { note.textContent = ''; }, 2000);
  } catch (e) {
    note.textContent = 'Error: ' + e.message;
  } finally {
    btn.disabled = false;
  }
}

/* Deleting a passage takes every question on it, which is ten rows at a
   stroke rather than the one the table's own Delete removes — so the
   count goes in the question, and the answer says how many actually
   went. There is no undo. */
async function deletePassage(row) {
  const name  = row.querySelector('.pass-title').value.trim();
  const count = row.querySelector('.pass-count').textContent.trim();
  const shown = name || row.querySelector('.pass-preview').textContent.trim().slice(0, 60) + '…';
  if (!confirm(`Delete this passage and every question on it?\n\n${shown}\n\n` +
               `${count} active — plus any disabled ones — will be deleted permanently. This cannot be undone.`)) return;
  const note = row.querySelector('.pass-saved');
  row.querySelectorAll('button').forEach(b => { b.disabled = true; });
  note.textContent = 'deleting…';
  try {
    const r = await ExamAPI.adminDeletePassage(row.dataset.key);
    row.remove();
    await loadStats();
    loadList();
    loadPassages();
    console.info('passage deleted:', r);
  } catch (e) {
    note.textContent = 'Error: ' + e.message;
    row.querySelectorAll('button').forEach(b => { b.disabled = false; });
  }
}

async function loadList() {
  const section = document.getElementById('sectionFilter').value;
  const { rows, total } = await ExamAPI.adminList({ section, page, pageSize: 20 });
  document.getElementById('pageLabel').textContent = `Page ${page} · ${total} total`;
  document.getElementById('tableBody').innerHTML = rows.map(q => `
    <tr>
      <td><span class="pill">${q.section}</span></td>
      <td style="max-width:320px">${escapeHtml(q.question)}</td>
      <td>${q.options.map((o,i)=>`${i===q.correct_answer?'✅':'▫️'} ${escapeHtml(o)}`).join('<br>')}</td>
      <td>${q.correct_answer + 1}</td>
      <td class="row-actions">
        <button class="secondary" data-edit="${q.id}">Edit</button>
        <button class="danger" data-del="${q.id}">Delete</button>
      </td>
    </tr>`).join('');
}

function changePage(delta) {
  page = Math.max(1, page + delta);
  loadList();
}

async function deleteQuestion(id) {
  if (!confirm('Delete this question permanently?')) return;
  await ExamAPI.adminDelete(id);
  loadStats();
  loadList();
}

async function editQuestion(id) {
  const newQuestion = prompt('New question text (leave blank to cancel):');
  if (!newQuestion) return;
  await ExamAPI.adminUpdate(id, { question: newQuestion });
  loadList();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

init();

/* Events are bound here rather than with onclick= in the markup, so the
   page's script-src needs no 'unsafe-inline' — an injected <script> or
   onerror= then does not run at all. Rows and options are redrawn on every
   render, so those use one delegated listener on a container that stays. */
document.getElementById('importBtn').addEventListener('click', doImport);
document.getElementById('sectionFilter').addEventListener('change', loadList);
document.getElementById('exportJsonBtn').addEventListener('click', () => ExamAPI.adminExportUrl('json'));
document.getElementById('exportCsvBtn').addEventListener('click', () => ExamAPI.adminExportUrl('csv'));
document.getElementById('prevPageBtn').addEventListener('click', () => changePage(-1));
document.getElementById('nextPageBtn').addEventListener('click', () => changePage(1));
document.getElementById('passagesBox').addEventListener('click', e => {
  const save = e.target.closest('[data-save]');
  if (save) return savePassageTitle(save.closest('.pass-row'));
  const drop = e.target.closest('[data-drop]');
  if (drop) return deletePassage(drop.closest('.pass-row'));
});
document.getElementById('passagesBox').addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.classList.contains('pass-title'))
    savePassageTitle(e.target.closest('.pass-row'));
});
document.getElementById('tableBody').addEventListener('click', e => {
  const ed = e.target.closest('[data-edit]');
  if (ed) return editQuestion(ed.dataset.edit);
  const del = e.target.closest('[data-del]');
  if (del) return deleteQuestion(del.dataset.del);
});
