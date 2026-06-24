import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProfileStore } from '../store/profileStore';
import { useOrderStore } from '../store/orderStore';
import MapboxMap from '../components/MapboxMap';
import i18n from '../i18n/index.js';

const LANGS = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
];

export default function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const profile = useProfileStore();
  const { orders } = useOrderStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: profile.name, phone: profile.phone, address: profile.address,
    buildingName: profile.buildingName, floor: profile.floor,
    apartment: profile.apartment, doorCode: profile.doorCode, notes: profile.notes,
  });
  const [geo, setGeo] = useState(
    profile.latitude != null && profile.longitude != null
      ? { lat: profile.latitude, lng: profile.longitude }
      : null
  );
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    profile.updateProfile({
      ...form,
      ...(geo ? { latitude: geo.lat, longitude: geo.lng } : {}),
    });
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const completedOrders = orders.filter((o) => o.status === 'delivered').length;
  const currentLang = i18n.language || 'en';

  // Composed "building · floor · apartment · door" line for the read-only view.
  const addrDetail = [
    profile.buildingName && `${t('building_name')}: ${profile.buildingName}`,
    profile.floor && `${t('floor')}: ${profile.floor}`,
    profile.apartment && `${t('apartment')}: ${profile.apartment}`,
    profile.doorCode && `${t('door_code')}: ${profile.doorCode}`,
  ].filter(Boolean).join(' · ');

  return (
    <div className="page-enter" style={styles.page}>
      <div style={styles.container}>

        {/* Avatar & Info */}
        <div style={styles.profileCard}>
          <div style={styles.avatar}>👤</div>
          <div style={styles.profileInfo}>
            <div style={styles.profileName}>{profile.isLoggedIn ? (profile.name || profile.email) : t('guest')}</div>
            {profile.isLoggedIn && profile.email && (
              <div style={styles.profileEmail}>✅ {profile.email}</div>
            )}
            {!profile.isLoggedIn && (
              <div style={styles.authBtns}>
                <Link to="/login" style={styles.signInBtn}>{t('sign_in')}</Link>
                <Link to="/register" style={styles.createBtn}>{t('create_account')}</Link>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{orders.length}</div>
            <div style={styles.statLabel}>{t('total_orders')}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{completedOrders}</div>
            <div style={styles.statLabel}>{t('completed')}</div>
          </div>
        </div>

        {/* Personal Info */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionTitle}>{t('personal_info')}</div>
            <button style={styles.editBtn} onClick={() => editing ? handleSave() : setEditing(true)}>
              {editing ? t('save') : t('edit')}
            </button>
          </div>

          {saved && <div style={styles.savedMsg}>✓ Saved!</div>}

          {editing ? (
            <div style={styles.editForm}>
              <FormField label={t('full_name')} value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
              <FormField label={t('phone_number')} value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
              <FormField label={t('delivery_address')} value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={styles.mapLabel}>{t('delivery_location')}</label>
                <MapboxMap
                  value={geo}
                  height={220}
                  onChange={(lat, lng) => setGeo({ lat, lng })}
                  onAddress={(addr) => setForm(f => ({ ...f, address: addr }))}
                />
              </div>
              <div style={styles.fieldRow}>
                <FormField label={t('building_name')} value={form.buildingName} onChange={(e) => setForm(f => ({ ...f, buildingName: e.target.value }))} />
                <FormField label={t('floor')} value={form.floor} onChange={(e) => setForm(f => ({ ...f, floor: e.target.value }))} />
              </div>
              <div style={styles.fieldRow}>
                <FormField label={t('apartment')} value={form.apartment} onChange={(e) => setForm(f => ({ ...f, apartment: e.target.value }))} />
                <FormField label={t('door_code')} value={form.doorCode} onChange={(e) => setForm(f => ({ ...f, doorCode: e.target.value }))} />
              </div>
              <FormField label={t('order_notes')} value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          ) : (
            <div style={styles.infoList}>
              <InfoRow icon="👤" label={t('full_name')} value={profile.name || '—'} />
              <InfoRow icon="📞" label={t('phone_number')} value={profile.phone || '—'} />
              <InfoRow icon="📍" label={t('delivery_address')} value={profile.address || '—'} />
              {addrDetail && <InfoRow icon="🏢" label={t('delivery_location')} value={addrDetail} />}
              {profile.latitude != null && (
                <InfoRow icon="🗺️" label="GPS" value={`${profile.latitude.toFixed(5)}, ${profile.longitude.toFixed(5)}`} />
              )}
            </div>
          )}
        </div>

        {/* Language */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>{t('language')}</div>
          <div style={styles.langList}>
            {LANGS.map((l) => (
              <button
                key={l.code}
                style={{ ...styles.langItem, ...(l.code === currentLang ? styles.langItemActive : {}) }}
                onClick={() => i18n.changeLanguage(l.code)}
              >
                <span>{l.flag}</span>
                <span style={{ flex: 1 }}>{l.label}</span>
                {l.code === currentLang && <span style={{ color: 'var(--primary)' }}>✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div style={styles.section}>
          <QuickLink icon="📋" label={t('orders')} to="/orders" />
          <QuickLink icon="ℹ️" label={t('about')} desc="Sushi Time — fresh sushi delivered 🍣" />
          {profile.isLoggedIn && (
            <button style={styles.logoutBtn} onClick={() => { profile.logout(); navigate('/'); }}>
              🚪 {t('logout')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--divider)' }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
        <div style={{ fontSize: 15, color: 'var(--text-primary)', fontWeight: 500, marginTop: 2 }}>{value}</div>
      </div>
    </div>
  );
}

function FormField({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</label>
      <input style={{ padding: '9px 12px', border: '1.5px solid var(--divider)', borderRadius: 'var(--radius-md)', fontSize: 14, outline: 'none' }} value={value} onChange={onChange} />
    </div>
  );
}

function QuickLink({ icon, label, to, desc }) {
  const content = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--divider)', cursor: to ? 'pointer' : 'default' }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{desc}</div>}
      </div>
      {to && <span style={{ color: 'var(--text-light)' }}>→</span>}
    </div>
  );
  return to ? <Link to={to} style={{ textDecoration: 'none', color: 'inherit' }}>{content}</Link> : content;
}

const styles = {
  page: { flex: 1, paddingBottom: 80 },
  container: { maxWidth: 700, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 },
  profileCard: { background: '#fff', borderRadius: 'var(--radius-xl)', padding: '24px', display: 'flex', alignItems: 'center', gap: 20, boxShadow: 'var(--shadow-sm)' },
  avatar: { width: 72, height: 72, borderRadius: 999, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0 },
  profileInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: 6 },
  profileName: { fontSize: 20, fontWeight: 800 },
  profileEmail: { fontSize: 13, color: 'var(--success)' },
  authBtns: { display: 'flex', gap: 8 },
  signInBtn: { padding: '7px 16px', background: 'var(--primary)', color: '#fff', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 700, textDecoration: 'none' },
  createBtn: { padding: '7px 16px', background: 'var(--background)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 700, textDecoration: 'none' },
  statsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  statCard: { background: '#fff', borderRadius: 'var(--radius-lg)', padding: '16px 20px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' },
  statValue: { fontSize: 28, fontWeight: 900, color: 'var(--primary)' },
  statLabel: { fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 },
  section: { background: '#fff', borderRadius: 'var(--radius-xl)', padding: '20px', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: 'var(--shadow-sm)' },
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 16, fontWeight: 800 },
  editBtn: { fontSize: 13, fontWeight: 700, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' },
  savedMsg: { fontSize: 13, color: 'var(--success)', fontWeight: 600 },
  editForm: { display: 'flex', flexDirection: 'column', gap: 10 },
  fieldRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  mapLabel: { fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoList: { display: 'flex', flexDirection: 'column' },
  langList: { display: 'flex', flexDirection: 'column', gap: 4 },
  langItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 'var(--radius-md)', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500 },
  langItemActive: { background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700 },
  logoutBtn: { margin: '4px 0 0', padding: '10px 16px', background: '#FFF1F2', color: 'var(--error)', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start' },
};
