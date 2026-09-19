let mode = 'signin';

function getRedirect() {
  const p = new URLSearchParams(location.search).get('redirect');
  // A leading "/" is not enough: "//evil.com" and "/\\evil.com" are read as
  // protocol-relative URLs, so ?redirect= would send a freshly signed-in
  // student to another site. Only a path on this origin is accepted.
  return p && /^\/(?![\/\\])/.test(p) ? p : '/';
}

function toggleMode() {
  mode = mode === 'signin' ? 'signup' : 'signin';
  document.getElementById('title').textContent = mode === 'signin' ? 'تسجيل الدخول' : 'إنشاء حساب';
  document.getElementById('subtitle').textContent = mode === 'signin' ? 'أهلاً بعودتك — أكمل حيث توقفت' : 'أنشئ حسابك للبدء';
  document.querySelector('.btn-label').textContent = mode === 'signin' ? 'دخول' : 'إنشاء حساب';
  document.getElementById('toggleText').textContent = mode === 'signin' ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟';
  document.getElementById('toggleLink').textContent = mode === 'signin' ? 'إنشاء حساب' : 'تسجيل الدخول';
  document.getElementById('errorBox').classList.remove('visible');
}

async function submitForm() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const errorBox = document.getElementById('errorBox');
  const errorText = document.getElementById('errorText');
  const btn = document.getElementById('submitBtn');

  errorBox.classList.remove('visible');
  btn.classList.add('loading');
  btn.disabled = true;

  try {
    if (mode === 'signin') {
      await ExamAPI.signInWithPassword(email, password);
    } else {
      await ExamAPI.signUpWithPassword(email, password);
      alert('تم إنشاء الحساب! يمكنك الآن تسجيل الدخول (قد تحتاج لتأكيد بريدك الإلكتروني أولاً حسب إعدادات المشروع).');
      toggleMode();
      btn.classList.remove('loading');
      btn.disabled = false;
      return;
    }
    window.location.href = getRedirect();
  } catch (e) {
    errorText.textContent = e.message || 'حدث خطأ، حاول مرة أخرى';
    errorBox.classList.add('visible');
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

(async () => {
  const session = await ExamAPI.getSession();
  if (session) window.location.href = getRedirect();
})();

/* Events are bound here rather than with onclick= in the markup, so the
   page's script-src needs no 'unsafe-inline' — an injected <script> or
   onerror= then does not run at all. */
document.getElementById('googleBtn').addEventListener('click', () => ExamAPI.signInWithGoogle(getRedirect()));
document.getElementById('form').addEventListener('submit', e => e.preventDefault());
document.getElementById('submitBtn').addEventListener('click', submitForm);
document.getElementById('toggleLink').addEventListener('click', toggleMode);
