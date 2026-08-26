// Canonical Alanya delivery districts — mirrors backend_api/src/utils/districts.js.
//
// The checkout requires a district, and the list normally comes from
// /settings/district-minimums (which also carries the per-district minimum
// order amount). That request failing used to leave the picker empty, and an
// empty picker makes the form unsatisfiable — nobody can order at all.
//
// The names themselves are static, so there is no reason for checkout to
// depend on that endpoint being reachable: fall back to this list and treat
// every minimum as 0. The server re-checks the real minimum on submit, so a
// stale fallback can't let an under-minimum order through.
export const ALANYA_DISTRICTS = [
  'Avsallar',
  'Okurcalar',
  'Türkler',
  'Konaklı',
  'Payallar',
  'Merkez',
  'Oba',
  'Tosmur',
  'Cikcilli',
  'Kestel',
  'Mahmutlar',
  'Kargıcak',
  'Demirtaş',
  'Gazipaşa',
];

/** Same shape the API returns: [{ name, minOrder }] with no minimums known. */
export const fallbackDistricts = () =>
  ALANYA_DISTRICTS.map((name) => ({ name, minOrder: 0 }));
