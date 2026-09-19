let page = 1;

async function init() {
  const ok = await ExamAPI.requireAdminSession();
  if (!ok) return;
  try {
    await loadStats();
    document.getElementById('whoami').textContent = '';
    document.getElementById('app').style.display = 'block';
    loadList();
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
document.getElementById('tableBody').addEventListener('click', e => {
  const ed = e.target.closest('[data-edit]');
  if (ed) return editQuestion(ed.dataset.edit);
  const del = e.target.closest('[data-del]');
  if (del) return deleteQuestion(del.dataset.del);
});
