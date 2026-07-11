import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCartStore, selectTotalPrice } from '../store/cartStore';
import { useOrderStore } from '../store/orderStore';
import { useProfileStore } from '../store/profileStore';
import { useSettingsStore } from '../store/settingsStore';
import httpClient from '../api/httpClient';
import { FREE_DELIVERY_THRESHOLD, DELIVERY_FEE, SERVICE_FEE, TIP_OPTIONS } from '../theme';
import useIsMobile from '../hooks/useIsMobile';
import MapboxMap from '../components/MapboxMap';

export default function CheckoutPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { items, clearCart } = useCartStore();
  const subtotal = useCartStore(selectTotalPrice);
  const { placeOrder, loading } = useOrderStore();
  const profile = useProfileStore();
  const isOpenNow = useSettingsStore((s) => s.isOpenNow);
  const open = isOpenNow();
  const districts = useSettingsStore((s) => s.districts);
  const loadDistrictMinimums = useSettingsStore((s) => s.loadDistrictMinimums);
  const districtMinFor = useSettingsStore((s) => s.districtMinFor);

  const [form, setForm] = useState({
    customerName: profile.name || '',
    phone: profile.phone || '',
    address: profile.address || '',
    district: profile.district || '',
    buildingName: profile.buildingName || '',
    floor: profile.floor || '',
    apartment: profile.apartment || '',
    doorCode: profile.doorCode || '',
    notes: profile.notes || '',
  });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [geo, setGeo] = useState(
    profile.latitude != null && profile.longitude != null
      ? { lat: profile.latitude, lng: profile.longitude }
      : null
  ); // { lat, lng } выбранная точка доставки
  const [tip, setTip] = useState(0);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoMsg, setPromoMsg] = useState('');
  const [errors, setErrors] = useState({});

  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = subtotal - promoDiscount + deliveryFee + SERVICE_FEE + tip;

  // Per-district minimum order (food subtotal, matching the server check).
  const districtMin = districtMinFor(form.district);
  const belowMin = districtMin > 0 && subtotal < districtMin;
  const shortAmount = belowMin ? districtMin - subtotal : 0;

  useEffect(() => { loadDistrictMinimums(); }, [loadDistrictMinimums]);

  // Auto-pick the district when its name appears in the typed/geocoded address
  // (only while none is chosen yet, so a manual choice is never overridden).
  useEffect(() => {
    if (form.district || !districts.length || !form.address) return;
    const addr = form.address.toLowerCase();
    const hit = districts.find((d) => addr.includes(d.name.toLowerCase()));
    if (hit) setForm((f) => ({ ...f, district: hit.name }));
  }, [form.address, districts, form.district]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const applyPromo = async () => {
    setPromoMsg('');
    try {
      const res = await httpClient.get('/promotions');
      const promos = res.data?.data?.promotions || [];
      const found = promos.find((p) => p.promoCode?.toUpperCase() === promoCode.toUpperCase() && p.isActive);
      if (found) {
        const disc = (subtotal * found.discountPercent) / 100;
        setPromoDiscount(disc);
        setPromoMsg(t('promo_applied', { percent: found.discountPercent }));
      } else {
        setPromoDiscount(0);
        setPromoMsg(t('invalid_promo'));
      }
    } catch {
      setPromoMsg(t('invalid_promo'));
    }
  };

  const validate = () => {
    const e = {};
    if (!form.customerName.trim()) e.customerName = t('name_required');
    if (!form.phone.trim()) e.phone = t('phone_required');
    if (!form.address.trim()) e.address = t('address_required');
    if (!form.district) e.district = t('district_required');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!open) return; // ресторан закрыт — сервер всё равно отклонит
    if (belowMin) return; // район не набрал минимум — сервер тоже отклонит
    const payload = {
      ...form,
      items: items.map(({ menuItem, quantity }) => ({ menuItemId: menuItem._id, quantity })),
      paymentMethod,
      tip,
      promoCode: promoCode.toUpperCase(),
      ...(geo ? { latitude: geo.lat, longitude: geo.lng } : {}),
      ...(profile.userId ? { user: profile.userId } : {}),
    };
    const order = await placeOrder(payload);
    if (order) {
      // Remember the delivery details so the next order is pre-filled.
      profile.updateProfile({
        name: form.customerName,
        phone: form.phone,
        address: form.address,
        district: form.district,
        buildingName: form.buildingName,
        floor: form.floor,
        apartment: form.apartment,
        doorCode: form.doorCode,
        notes: form.notes,
        ...(geo ? { latitude: geo.lat, longitude: geo.lng } : {}),
      });
      clearCart();
      navigate('/order-success', { state: { order } });
    }
  };

  if (!items.length) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="page-enter" style={styles.page}>
      <div style={styles.container}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>← {t('cart')}</button>
        <h1 style={styles.title}>{t('checkout')}</h1>

        <div style={{ ...styles.layout, ...(isMobile ? styles.layoutMobile : {}) }}>
          <div style={styles.left}>
            {/* Your details */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>{t('your_details')}</div>
              <Field label={t('full_name')} value={form.customerName} onChange={set('customerName')} error={errors.customerName} />
              <Field label={t('phone_number')} value={form.phone} onChange={set('phone')} error={errors.phone} type="tel" placeholder="+90 555 000 0000" />
              <Field label={t('delivery_address')} value={form.address} onChange={set('address')} error={errors.address} />

              {/* District (bölge) — required; drives the per-district minimum */}
              <div style={fStyles.wrap}>
                <label style={fStyles.label}>{t('district')}</label>
                <select
                  style={{ ...fStyles.input, ...(errors.district ? fStyles.inputError : {}) }}
                  value={form.district}
                  onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
                >
                  <option value="">{t('select_district')}</option>
                  {districts.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name}{d.minOrder > 0 ? ` — min ${d.minOrder} ₺` : ''}
                    </option>
                  ))}
                </select>
                {errors.district && <div style={fStyles.error}>{errors.district}</div>}
              </div>

              <div style={fStyles.wrap}>
                <label style={fStyles.label}>{t('delivery_location')}</label>
                <MapboxMap
                  value={geo}
                  onChange={(lat, lng) => setGeo({ lat, lng })}
                  onAddress={(addr) => setForm((f) => ({ ...f, address: addr }))}
                />
              </div>
              <div style={styles.row}>
                <Field label={t('building_name')} value={form.buildingName} onChange={set('buildingName')} />
                <Field label={t('floor')} value={form.floor} onChange={set('floor')} />
              </div>
              <div style={styles.row}>
                <Field label={t('apartment')} value={form.apartment} onChange={set('apartment')} />
                <Field label={t('door_code')} value={form.doorCode} onChange={set('doorCode')} />
              </div>
              <Field label={t('order_notes')} value={form.notes} onChange={set('notes')} multiline />
            </div>

            {/* Payment */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>{t('payment_method')}</div>
              {['cash', 'card'].map((m) => (
                <button
                  key={m}
                  style={{ ...styles.payOption, ...(paymentMethod === m ? styles.payOptionActive : {}) }}
                  onClick={() => setPaymentMethod(m)}
                >
                  <span>{m === 'cash' ? '💵' : '💳'}</span>
                  <span>{t(m)}</span>
                  {paymentMethod === m && <span style={styles.check}>✓</span>}
                </button>
              ))}
            </div>

            {/* Tip */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>{t('tip')}</div>
              <div style={styles.tipDesc}>{t('tip_desc')}</div>
              <div style={styles.tipRow}>
                {TIP_OPTIONS.map((v) => (
                  <button
                    key={v}
                    style={{ ...styles.tipBtn, ...(tip === v ? styles.tipBtnActive : {}) }}
                    onClick={() => setTip(v)}
                  >
                    {v === 0 ? '—' : `${v} ₺`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div style={styles.summary}>
            <div style={styles.summaryTitle}>{t('order_summary')}</div>

            <div style={styles.orderItems}>
              {items.map(({ menuItem, quantity }) => (
                <div key={menuItem._id} style={styles.orderItem}>
                  <span>{menuItem.name} × {quantity}</span>
                  <span>{(menuItem.price * quantity).toFixed(0)} ₺</span>
                </div>
              ))}
            </div>

            {/* Promo */}
            <div style={styles.promoRow}>
              <input
                style={styles.promoInput}
                placeholder={t('promo_code')}
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
              />
              <button style={styles.applyBtn} onClick={applyPromo}>{t('apply')}</button>
            </div>
            {promoMsg && (
              <div style={{ fontSize: 12, color: promoDiscount > 0 ? 'var(--success)' : 'var(--error)', fontWeight: 600 }}>
                {promoMsg}
              </div>
            )}

            <div style={styles.summaryRows}>
              <SummaryRow label={t('subtotal')} value={`${subtotal.toFixed(0)} ₺`} />
              {promoDiscount > 0 && <SummaryRow label={t('discount')} value={`−${promoDiscount.toFixed(0)} ₺`} valueColor="var(--success)" />}
              <SummaryRow label={t('delivery_fee')} value={deliveryFee === 0 ? t('free') : `${deliveryFee} ₺`} valueColor={deliveryFee === 0 ? 'var(--success)' : undefined} />
              <SummaryRow label={t('service_fee')} value={`${SERVICE_FEE} ₺`} />
              {tip > 0 && <SummaryRow label={t('tip')} value={`${tip} ₺`} />}
              <div style={styles.divider} />
              <SummaryRow label={t('total')} value={`${total.toFixed(2)} ₺`} bold />
            </div>

            {!open && (
              <div style={styles.closedBanner}>
                🌙 {t('closed_order_blocked')}
              </div>
            )}

            {open && belowMin && (
              <div style={styles.minBanner}>
                ⚠️ {t('district_min_notice', { district: form.district, min: districtMin, short: shortAmount.toFixed(0) })}
              </div>
            )}

            <button
              style={{ ...styles.placeBtn, opacity: (loading || !open || belowMin) ? 0.55 : 1, cursor: (loading || !open || belowMin) ? 'not-allowed' : 'pointer' }}
              onClick={handleSubmit}
              disabled={loading || !open || belowMin}
            >
              {loading ? '...' : (!open ? t('closed_title') : belowMin ? t('district_min_short', { short: shortAmount.toFixed(0) }) : t('place_order'))}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, error, type = 'text', placeholder, multiline }) {
  const props = { value, onChange, type, placeholder: placeholder || '', style: { ...fStyles.input, ...(error ? fStyles.inputError : {}), ...(multiline ? { height: 80, resize: 'vertical' } : {}) } };
  return (
    <div style={fStyles.wrap}>
      <label style={fStyles.label}>{label}</label>
      {multiline ? <textarea {...props} /> : <input {...props} />}
      {error && <div style={fStyles.error}>{error}</div>}
    </div>
  );
}

function SummaryRow({ label, value, bold, valueColor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: bold ? 17 : 14, fontWeight: bold ? 800 : 400, color: bold ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
      <span>{label}</span>
      <span style={{ color: valueColor || 'inherit', fontWeight: bold ? 800 : 600 }}>{value}</span>
    </div>
  );
}

const fStyles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 },
  label: { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { width: '100%', minWidth: 0, maxWidth: '100%', padding: '10px 14px', border: '1.5px solid var(--divider)', borderRadius: 'var(--radius-md)', fontSize: 15, outline: 'none', background: '#fff', color: 'var(--text-primary)' },
  inputError: { borderColor: 'var(--error)' },
  error: { fontSize: 12, color: 'var(--error)' },
};

const styles = {
  page: { flex: 1, paddingBottom: 80 },
  container: { maxWidth: 1100, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 },
  backBtn: { alignSelf: 'flex-start', fontSize: 14, fontWeight: 600, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 },
  title: { fontSize: 28, fontWeight: 900, color: 'var(--text-primary)' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' },
  layoutMobile: { gridTemplateColumns: 'minmax(0, 1fr)' },
  left: { display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 },
  section: { background: '#fff', borderRadius: 'var(--radius-xl)', padding: '20px', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: 'var(--shadow-sm)', minWidth: 0 },
  sectionTitle: { fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' },
  row: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12 },
  payOption: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
    borderRadius: 'var(--radius-md)', border: '1.5px solid var(--divider)',
    background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600,
  },
  payOptionActive: { border: '1.5px solid var(--primary)', background: 'var(--primary-light)' },
  check: { marginLeft: 'auto', color: 'var(--primary)', fontWeight: 800 },
  tipDesc: { fontSize: 13, color: 'var(--text-secondary)' },
  tipRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  tipBtn: { padding: '8px 16px', borderRadius: 'var(--radius-full)', border: '1.5px solid var(--divider)', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' },
  tipBtnActive: { background: 'var(--primary)', color: '#fff', border: '1.5px solid var(--primary)' },
  summary: { background: '#fff', borderRadius: 'var(--radius-xl)', padding: '24px', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 80, minWidth: 0 },
  summaryTitle: { fontSize: 18, fontWeight: 800 },
  orderItems: { display: 'flex', flexDirection: 'column', gap: 8 },
  orderItem: { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)' },
  promoRow: { display: 'flex', gap: 8 },
  promoInput: { flex: 1, minWidth: 0, width: '100%', padding: '8px 12px', border: '1.5px solid var(--divider)', borderRadius: 'var(--radius-md)', fontSize: 13, outline: 'none' },
  applyBtn: { padding: '8px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  summaryRows: { display: 'flex', flexDirection: 'column', gap: 8 },
  divider: { height: 1, background: 'var(--divider)' },
  placeBtn: { width: '100%', padding: '14px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-full)', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow-glow)' },
  closedBanner: { padding: '10px 14px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 700, textAlign: 'center' },
  minBanner: { padding: '10px 14px', background: '#FFF4E5', color: '#B45309', border: '1px solid #FCD9A8', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 700, textAlign: 'center' },
};
