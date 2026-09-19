/* The dashboard's tabs are views on one page, so which one to open travels
   in sessionStorage. A #hash would do the same job but would show in the
   address bar, and the address stays clean. */
document.querySelectorAll('.pr-tab[data-go]').forEach(a => a.addEventListener('click', () => {
  try { sessionStorage.setItem('dashView', a.dataset.go); } catch (err) { /* private mode */ }
}));
