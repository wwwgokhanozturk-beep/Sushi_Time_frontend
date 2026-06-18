import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProfileStore } from '../store/profileStore';
import httpClient from '../api/httpClient';

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAuth } = useProfileStore();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (f) => (e) => setForm((v) => ({ ...v, [f]: e.target.value }));

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError(t('passwords_no_match')); return; }
    setLoading(true);
    try {
      const res = await httpClient.post('/users/register', {
        name: form.name, email: form.email, phone: form.phone, password: form.password,
      });
      const { user, token, refreshToken } = res.data?.data || {};
      if (user && token) {
        setAuth(user, token, refreshToken);
        navigate('/profile');
      }
    } catch {
      setError(t('register_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoRow}>
          <img src="/image.png" alt="Sushi Time" style={styles.logoImg} />
        </div>

        <h1 style={styles.title}>{t('create_account')}</h1>

        <form onSubmit={handleRegister} style={styles.form}>
          <Field label={t('register_name')} value={form.name} onChange={set('name')} required />
          <Field label={t('email_address')} value={form.email} onChange={set('email')} type="email" required />
          <Field label={t('phone_number')} value={form.phone} onChange={set('phone')} type="tel" placeholder={t('phone_hint')} required />
          <Field label={t('password')} value={form.password} onChange={set('password')} type="password" required />
          <Field label={t('confirm_password')} value={form.confirmPassword} onChange={set('confirmPassword')} type="password" required />
          {error && <div style={styles.error}>{error}</div>}
          <button style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? '...' : t('create_account')}
          </button>
        </form>

        <div style={styles.footer}>
          <span style={styles.footerText}>{t('already_have_account')}</span>
          {' '}
          <Link to="/login" style={styles.footerLink}>{t('sign_in')}</Link>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder, required }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</label>
      <input
        style={{ padding: '11px 14px', border: '1.5px solid var(--divider)', borderRadius: 'var(--radius-md)', fontSize: 15, outline: 'none', color: 'var(--text-primary)' }}
        type={type} value={value} onChange={onChange} placeholder={placeholder || ''} required={required}
      />
    </div>
  );
}

const styles = {
  page: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, paddingBottom: 80 },
  card: { background: '#fff', borderRadius: 'var(--radius-xl)', padding: '16px 32px 32px', maxWidth: 440, width: '100%', display: 'flex', flexDirection: 'column', gap: 20, boxShadow: 'var(--shadow-lg)' },
  // Лого PNG имеет много прозрачного поля сверху/снизу — поджимаем его отрицательными отступами
  logoRow: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  logoImg: { height: 250, width: 'auto', maxWidth: '100%', objectFit: 'contain', marginTop: -56, marginBottom: -56 },
  title: { fontSize: 22, fontWeight: 800, textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  error: { background: '#FFF1F2', color: 'var(--error)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 600 },
  submitBtn: { padding: '13px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-full)', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow-glow)' },
  footer: { textAlign: 'center', fontSize: 14 },
  footerText: { color: 'var(--text-secondary)' },
  footerLink: { color: 'var(--primary)', fontWeight: 700 },
};
