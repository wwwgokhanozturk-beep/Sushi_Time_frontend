export const Colors = {
  primary:       '#E8181B',
  primaryDark:   '#B50E10',
  primaryLight:  '#FDECEA',
  secondary:     '#FF6B35',
  background:    '#F5F5F7',
  surface:       '#FFFFFF',
  textPrimary:   '#0D0D0D',
  textSecondary: '#6B7280',
  textLight:     '#9CA3AF',
  divider:       '#E5E7EB',
  success:       '#10B981',
  warning:       '#F59E0B',
  error:         '#EF4444',
};

export const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export const Radius = { sm: 8, md: 12, lg: 20, xl: 28, full: 999 };

// Mapbox + restaurant location (Mahmutlar, Kumru Sk. No:7/D, 07400 Alanya/Antalya)
// Токен берётся из env (VITE_MAPBOX_TOKEN) — в Vercel и локальном .env.
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
export const RESTAURANT_LAT = 36.490792;
export const RESTAURANT_LNG = 32.096686;
export const RESTAURANT_ADDRESS = 'Mahmutlar, Kumru Sk. No:7/D, 07400 Alanya/Antalya';

export const FREE_DELIVERY_THRESHOLD = 25;
export const DELIVERY_FEE = 2.99;
export const SERVICE_FEE = 0.99;
export const TIP_OPTIONS = [0, 1, 2, 3, 5];

export const STATUS_COLORS = {
  pending:   { bg: '#FFF7ED', text: '#F59E0B' },
  confirmed: { bg: '#EFF6FF', text: '#3B82F6' },
  preparing: { bg: '#FFF7ED', text: '#F97316' },
  en_route:  { bg: '#F0FDF4', text: '#10B981' },
  delivered: { bg: '#F0FDF4', text: '#059669' },
  cancelled: { bg: '#FFF1F2', text: '#EF4444' },
};
