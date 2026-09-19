async function buy() {
  const btn = document.getElementById('buyBtn');
  btn.disabled = true;
  btn.classList.add('loading');
  btn.querySelector('.btn-label').textContent = 'جارٍ التحويل...';
  try {
    await ExamAPI.startCheckout(); // redirects to Stripe Checkout
  } catch (e) {
    alert('تعذّر بدء عملية الدفع: ' + (e.message || ''));
    btn.disabled = false;
    btn.classList.remove('loading');
    btn.querySelector('.btn-label').textContent = 'الترقية الآن';
  }
}

(async () => {
  const ok = await ExamAPI.requireSession();
  if (!ok) return;
  try {
    const status = await ExamAPI.getStatus();
    if (status.premium) window.location.href = '/';
  } catch {}
})();

/* Events are bound here rather than with onclick= in the markup, so the
   page's script-src needs no 'unsafe-inline' — an injected <script> or
   onerror= then does not run at all. */
document.getElementById('buyBtn').addEventListener('click', buy);
