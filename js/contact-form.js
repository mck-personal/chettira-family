const form = document.querySelector('#contact-form');

if (form) {
  const clearForm = () => form.reset();

  window.addEventListener('pageshow', () => {
    clearForm();
  });

  window.addEventListener('pagehide', () => {
    clearForm();
  });
}
