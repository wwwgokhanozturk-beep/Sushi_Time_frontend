import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProfileStore } from '../store/profileStore';
import httpClient from '../api/httpClient';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAuth } = useProfileStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await httpClient.post('/users/login', { email, password });
      const { user, token, refreshToken } = res.data?.data || {};
      if (user && token) {
        setAuth(user, token, refreshToken);
        navigate('/profile');
      }
    } catch {
      setError(t('login_error'));
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

        <h1 style={styles.title}>{t('sign_in')}</h1>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>{t('email_address')}</label>
            <input style={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>{t('password')}</label>
            <input style={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <button style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? '...' : t('sign_in')}
          </button>
        </form>

        <div style={styles.footer}>
          <span style={styles.footerText}>{t('no_account_yet')}</span>
          {' '}
          <Link to="/register" style={styles.footerLink}>{t('create_account')}</Link>
        </div>

        <button style={styles.guestBtn} onClick={() => navigate('/')}>
          {t('continue_as_guest')}
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, paddingBottom: 80 },
  card: { background: '#fff', borderRadius: 'var(--radius-xl)', padding: '36px 32px', maxWidth: 420, width: '100%', display: 'flex', flexDirection: 'column', gap: 20, boxShadow: 'var(--shadow-lg)' },
  logoRow: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  logoImg: { height: 100, width: 'auto', objectFit: 'contain' },
  title: { fontSize: 22, fontWeight: 800, textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { padding: '11px 14px', border: '1.5px solid var(--divider)', borderRadius: 'var(--radius-md)', fontSize: 15, outline: 'none', color: 'var(--text-primary)' },
  error: { background: '#FFF1F2', color: 'var(--error)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 600 },
  submitBtn: { padding: '13px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-full)', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow-glow)' },
  footer: { textAlign: 'center', fontSize: 14 },
  footerText: { color: 'var(--text-secondary)' },
  footerLink: { color: 'var(--primary)', fontWeight: 700 },
  guestBtn: { fontSize: 13, color: 'var(--text-light)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontWeight: 500 },
};
