import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n/index.js";
import useScrolledPastTop from "../../hooks/useScrolledPastTop";

// Real flag images (flagcdn) — emoji flags render as plain letters ("GB") on
// Windows/Chrome, so we use proper flag artwork for a consistent premium look.
const LANGS = [
  { code: "en", cc: "gb", label: "EN" },
  { code: "ru", cc: "ru", label: "RU" },
  { code: "tr", cc: "tr", label: "TR" },
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
  const currentLang = i18n.language || "en";
  const isMobile = useIsMobile();
  // On a phone the bar shows only at the very top of the page: scrolled down,
  // it slides away and leaves the screen to the menu.
  const hidden = useScrolledPastTop() && isMobile;

  const navLinks = [
    { to: "/", label: t("home") },
    { to: "/menu", label: t("menu") },
    { to: "/orders", label: t("orders") },
    { to: "/profile", label: t("account") },
  ];

  const flags = (
    <div style={styles.flags}>
      {LANGS.map((l) => {
        const active = l.code === currentLang;
        return (
          <button
            key={l.code}
            onClick={() => i18n.changeLanguage(l.code)}
            title={l.label}
            aria-label={l.label}
            style={{
              ...styles.flagBtn,
              ...(active ? styles.flagBtnActive : {}),
            }}
          >
            <img
              src={`https://flagcdn.com/w40/${l.cc}.png`}
              srcSet={`https://flagcdn.com/w80/${l.cc}.png 2x`}
              width={28}
              height={20}
              alt={l.label}
              style={styles.flagImg}
            />
          </button>
        );
      })}
    </div>
  );

  return (
    <nav style={{ ...styles.nav, ...(hidden ? styles.navHidden : {}) }} aria-hidden={hidden || undefined}>
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

        {/* Right actions — language flags only */}
        <div style={styles.actions}>{flags}</div>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "rgba(255,255,255,0.92)",
    backdropFilter: "saturate(180%) blur(12px)",
    WebkitBackdropFilter: "saturate(180%) blur(12px)",
    borderBottom: "1px solid var(--divider)",
    boxShadow: "var(--shadow-sm)",
    height: "var(--navbar-height)",
    transition: "transform 0.25s ease",
  },
  navHidden: { transform: "translateY(-100%)", boxShadow: "none", pointerEvents: "none" },
  inner: {
    // Match the page containers exactly (maxWidth 100% + same clamp padding)
    // so the navbar's left/right edges line up with the main content.
    maxWidth: "100%",
    width: "100%",
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
    height: 130,
    width: "auto",
    objectFit: "contain",
  },
  logoImgMobile: {
    height: 110,
    width: "auto",
    objectFit: "contain",
  },
  links: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    flex: 1,
    justifyContent: "center",
  },
  link: {
    padding: "8px 18px",
    borderRadius: "var(--radius-full)",
    fontSize: 15,
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
  flags: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "var(--background)",
    padding: 4,
    borderRadius: "var(--radius-full)",
  },
  flagBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
    borderRadius: "var(--radius-full)",
    background: "transparent",
    border: "2px solid transparent",
    cursor: "pointer",
    transition: "transform 0.12s, border-color 0.15s",
    lineHeight: 0,
  },
  flagBtnActive: {
    border: "2px solid var(--primary)",
    background: "#fff",
    transform: "scale(1.05)",
  },
  flagImg: {
    width: 28,
    height: 20,
    objectFit: "cover",
    borderRadius: 4,
    display: "block",
  },
};
