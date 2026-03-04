const API = 'http://127.0.0.1:8000';

// ── Validators ──────────────────────────────────────────────────────────────
const rules = {
  full_name: v => {
    if (!v.trim()) return 'El nombre es obligatorio';
    if (v.trim().length < 2) return 'Mínimo 2 caracteres';
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(v)) return 'Solo letras y espacios';
    return null;
  },
  email: v => {
    if (!v.trim()) return 'El correo es obligatorio';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Correo inválido';
    return null;
  },
  password: v => {
    if (!v) return 'La contraseña es obligatoria';
    if (v.length < 8) return 'Mínimo 8 caracteres';
    if (!/[A-Z]/.test(v)) return 'Incluye al menos una mayúscula';
    if (!/[0-9]/.test(v)) return 'Incluye al menos un número';
    return null;
  },
  confirm_password: v => {
    const pwd = document.getElementById('password').value;
    if (!v) return 'Confirma tu contraseña';
    if (v !== pwd) return 'Las contraseñas no coinciden';
    return null;
  }
};

// ── Field state ──────────────────────────────────────────────────────────────
function setField(id, state, msg) {
  const field = document.getElementById('f-' + id);
  const msgEl = document.getElementById('msg-' + id);
  field.classList.remove('error', 'success');
  if (state) field.classList.add(state);
  if (msgEl) msgEl.querySelector('span').textContent = msg || '';
}

// ── Password strength ────────────────────────────────────────────────────────
const strengthBar  = document.getElementById('strengthBar');
const strengthFill = document.getElementById('strengthFill');

document.getElementById('password').addEventListener('input', function () {
  const v = this.value;
  strengthBar.classList.toggle('visible', v.length > 0);
  let score = 0;
  if (v.length >= 8)           score++;
  if (/[A-Z]/.test(v))         score++;
  if (/[0-9]/.test(v))         score++;
  if (/[^a-zA-Z0-9]/.test(v))  score++;
  const colors = ['#ff4d6d', '#fbbf24', '#0ea5e9', '#00e5a0'];
  const widths = ['25%', '50%', '75%', '100%'];
  strengthFill.style.width      = v ? widths[score - 1] || '15%' : '0';
  strengthFill.style.background = v ? colors[score - 1] || '#ff4d6d' : '';
});

// ── Real-time validation ─────────────────────────────────────────────────────
['full_name', 'email', 'password', 'confirm_password'].forEach(id => {
  const shortId = id === 'confirm_password' ? 'cpwd'
                : id === 'full_name'        ? 'name'
                : id === 'password'         ? 'pwd'
                : id;
  const el = document.getElementById(id);

  el.addEventListener('blur', () => {
    const err = rules[id](el.value);
    setField(shortId, err ? 'error' : 'success', err || (id === 'confirm_password' ? '¡Coinciden!' : '✓'));
  });

  el.addEventListener('input', () => {
    const field = document.getElementById('f-' + shortId);
    if (field.classList.contains('error')) {
      const err = rules[id](el.value);
      if (!err) setField(shortId, 'success', '✓');
    }
  });
});

// ── Eye toggles ──────────────────────────────────────────────────────────────
function toggleEye(inputId, btnId) {
  const input = document.getElementById(inputId);
  const btn   = document.getElementById(btnId);
  btn.addEventListener('click', () => {
    const show = input.type === 'password';
    input.type       = show ? 'text' : 'password';
    btn.style.color  = show ? 'var(--accent)' : '';
  });
}
toggleEye('password',         'eyeBtn1');
toggleEye('confirm_password', 'eyeBtn2');

// ── Alert ────────────────────────────────────────────────────────────────────
function showAlert(type, msg) {
  const a = document.getElementById('globalAlert');
  const t = document.getElementById('alertText');
  a.className  = 'alert show ' + type;
  t.textContent = msg;
  setTimeout(() => a.classList.remove('show'), 6000);
}

// ── Submit ───────────────────────────────────────────────────────────────────
document.getElementById('registerForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const fields = [
    ['full_name', 'name'],
    ['email',     'email'],
    ['password',  'pwd'],
    ['confirm_password', 'cpwd']
  ];

  let valid = true;
  for (const [id, short] of fields) {
    const el  = document.getElementById(id);
    const err = rules[id](el.value);
    setField(short, err ? 'error' : 'success', err || '✓');
    if (err) valid = false;
  }
  if (!valid) return;

  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.classList.add('loading');

  try {
    const res = await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name:        document.getElementById('full_name').value.trim(),
        email:            document.getElementById('email').value.trim().toLowerCase(),
        password:         document.getElementById('password').value,
        confirm_password: document.getElementById('confirm_password').value
      })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      document.getElementById('registerForm').style.display = 'none';
      document.getElementById('welcomeName').textContent = data.user.full_name;
      document.getElementById('successScreen').classList.add('show');
      document.querySelector('.alert')?.classList.remove('show');

      setTimeout(() => { window.location.href = 'index.html'; }, 3000);
    } else {
      const msg = data.detail || 'Error al registrar. Intenta de nuevo.';
      showAlert('error', msg);
      if (msg.toLowerCase().includes('correo') || msg.toLowerCase().includes('email')) {
        setField('email', 'error', msg);
      }
    }

  } catch (err) {
    showAlert('error', 'No se pudo conectar con el servidor. Verifica que el backend esté activo.');
  } finally {
    btn.disabled = false;
    btn.classList.remove('loading');
  }
});
