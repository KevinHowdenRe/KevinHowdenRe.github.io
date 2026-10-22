
  document.querySelectorAll('.portfolio-filter').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.portfolio-filter').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
    });
  });