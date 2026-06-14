import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCartStore, selectTotalItems } from "../../store/cartStore";
import { useProfileStore } from "../../store/profileStore";
import i18n from "../../i18n/index.js";

const LANGS = [
  { code: "en", flag: "🇬🇧" },
  { code: "ru", flag: "🇷🇺" },
  { code: "tr", flag: "🇹🇷" },
];

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return isMobile;
}

export default function Navbar() {
  const { t } = useTranslation();
  const location = useLocation();
  const totalItems = useCartStore(selectTotalItems);
  const { isLoggedIn } = useProfileStore();
  const [langOpen, setLangOpen] = useState(false);
  const currentLang = i18n.language || "en";
  const isMobile = useIsMobile();

  const navLinks = [
    { to: "/", label: t("home") },
    { to: "/menu", label: t("menu") },
    { to: "/orders", label: t("orders") },
  ];

  return (
    <nav style={styles.nav}>
      <div style={{ ...styles.inner, ...(isMobile ? styles.innerMobile : {}) }}>
        {/* Logo */}
        <Link to="/" style={styles.logo}>
          <img
            src="/image.png"
            alt="Sushi Time"
            style={isMobile ? styles.logoImgMobile : styles.logoImg}
          />
        </Link>

        {/* Desktop links — hidden on mobile (BottomNav covers navigation) */}
        {!isMobile && (
          <div style={styles.links}>
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                style={{
                  ...styles.link,
                  ...(location.pathname === l.to ? styles.linkActive : {}),
                }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}

        {/* Right actions */}
        <div style={styles.actions}>
          {/* Language picker */}
          <div style={{ position: "relative" }}>
            <button
              style={styles.iconBtn}
              onClick={() => setLangOpen((v) => !v)}
              title="Language"
            >
              {LANGS.find((l) => l.code === currentLang)?.flag || "🌐"}
            </button>
            {langOpen && (
              <div style={styles.langDropdown}>
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    style={{
                      ...styles.langItem,
                      ...(l.code === currentLang ? styles.langItemActive : {}),
                    }}
                    onClick={() => {
                      i18n.changeLanguage(l.code);
                      setLangOpen(false);
                    }}
                  >
                    {l.flag} {l.code.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart & Profile — hidden on mobile (BottomNav covers them) */}
          {!isMobile && (
            <>
              <Link
                to="/cart"
                style={{ ...styles.iconBtn, position: "relative" }}
              >
                🛒
                {totalItems > 0 && (
                  <span style={styles.badge}>{totalItems}</span>
                )}
              </Link>

              <Link to="/profile" style={styles.profileBtn}>
                {isLoggedIn ? "👤" : "🔑"}
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "#fff",
    borderBottom: "1px solid var(--divider)",
    boxShadow: "var(--shadow-sm)",
    height: "var(--navbar-height)",
  },
  inner: {
    maxWidth: "100%",
    margin: "0 auto",
    padding: "0 clamp(16px, 3vw, 40px)",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 24,
  },
  innerMobile: {
    padding: "0 16px",
    gap: 12,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    textDecoration: "none",
    flexShrink: 0,
  },
  logoImg: {
    height: 170,
    width: "auto",
    objectFit: "contain",
  },
  logoImgMobile: {
    height: 110,
    width: "auto",
    objectFit: "contain",
  },
  logoIcon: { fontSize: 24 },
  logoText: {
    fontSize: 20,
    fontWeight: 800,
    color: "var(--primary)",
    letterSpacing: -0.5,
  },
  links: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  link: {
    padding: "6px 14px",
    borderRadius: "var(--radius-full)",
    fontSize: 14,
    fontWeight: 600,
    color: "var(--text-secondary)",
    textDecoration: "none",
    transition: "all 0.15s",
  },
  linkActive: {
    background: "var(--primary-light)",
    color: "var(--primary)",
  },
  actions: { display: "flex", alignItems: "center", gap: 8 },
  iconBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    borderRadius: "var(--radius-full)",
    background: "var(--background)",
    border: "none",
    fontSize: 18,
    cursor: "pointer",
    position: "relative",
    textDecoration: "none",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    background: "var(--primary)",
    color: "#fff",
    fontSize: 10,
    fontWeight: 800,
    borderRadius: "var(--radius-full)",
    minWidth: 18,
    height: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 4px",
  },
  profileBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    borderRadius: "var(--radius-full)",
    background: "var(--primary-light)",
    fontSize: 18,
    textDecoration: "none",
  },
  langDropdown: {
    position: "absolute",
    top: 44,
    right: 0,
    background: "#fff",
    borderRadius: "var(--radius-md)",
    boxShadow: "var(--shadow-lg)",
    border: "1px solid var(--divider)",
    overflow: "hidden",
    zIndex: 200,
    minWidth: 100,
  },
  langItem: {
    display: "block",
    width: "100%",
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 600,
    textAlign: "left",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "var(--text-primary)",
  },
  langItemActive: {
    background: "var(--primary-light)",
    color: "var(--primary)",
  },
};
