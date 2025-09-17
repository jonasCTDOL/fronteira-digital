
document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('register-form');
  const message = document.getElementById('message');

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    message.textContent = '';
    message.style.color = 'red';

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao registrar.');
      }

      message.style.color = 'green';
      message.innerHTML = `Usuário criado com sucesso! <a href="/login.html">Faça login agora</a>.`;
      registerForm.reset();

    } catch (error) {
      message.textContent = error.message;
    }
  });
});
