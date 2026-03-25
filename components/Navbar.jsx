"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "../lib/firebase";
import ThemeToggle from "./ThemeToggle";

const DU_BLUE = "#07294D";
const DU_GOLD = "#FFC600";

function DULogo() {
  return (
    <div
      style={{
        fontWeight: 900,
        fontSize: 20,
        color: DU_GOLD,
        letterSpacing: 1,
      }}
    >
      DU
    </div>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const menuRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 768);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setLoggedIn(!!user));
    return () => unsub();
  }, []);

  async function handleLogout() {
    try {
      await signOut(auth);
      setOpen(false);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  const navLinks = [
    { label: "Leaderboard", href: "/" },
    { label: "Find People", href: "/profiles" },
    { label: "About", href: "/about" },
    { label: "Profile", href: "/profileEditor" },
    { label: "Customize Truck Profile", href: "/truckpagecust" },
    ...(!loggedIn ? [{ label: "Login", href: "/login" }] : []),
  ];

  return (
    <header style={styles.header}>
      <div style={styles.hero}>
        <div
          style={{
            ...styles.heroInner,
            ...(isMobile ? styles.heroInnerMobile : {}),
          }}
        >
          <div
            style={{
              ...styles.heroLeft,
              ...(isMobile ? styles.heroLeftMobile : {}),
            }}
          >
            <Link href="/" style={styles.logoWrap}>
              <DULogo />
            </Link>

            <div style={styles.titleWrap}>
              <h1
                style={{
                  ...styles.title,
                  ...(isMobile ? styles.titleMobile : {}),
                }}
              >
                DU Community Food Cart Leaderboard
              </h1>
              <p style={styles.subtitle}>Find • Rate • Rank</p>
              <div
                style={{
                  ...styles.goldBar,
                  ...(isMobile ? styles.goldBarMobile : {}),
                }}
              />
            </div>
          </div>

          <div
            style={{
              ...styles.actionsWrap,
              ...(isMobile ? styles.actionsWrapMobile : {}),
            }}
          >
            <ThemeToggle />

            <div ref={menuRef} style={styles.menuWrap}>
              <button
                type="button"
                aria-label="Open menu"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                style={styles.hamburgerBtn}
              >
                <span style={styles.hamburgerLine} />
                <span style={styles.hamburgerLine} />
                <span style={styles.hamburgerLine} />
              </button>

              {open && (
                <div
                  style={{
                    ...styles.dropdown,
                    ...(isMobile ? styles.dropdownMobile : {}),
                  }}
                >
                  {navLinks.map((link) => (
                    <Link
                      key={link.href + link.label}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      style={styles.dropdownLink}
                    >
                      {link.label}
                    </Link>
                  ))}

                  {loggedIn && (
                    <button
                      type="button"
                      onClick={handleLogout}
                      style={styles.logoutButton}
                    >
                      Logout
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

const styles = {
  header: {
    width: "100%",
    position: "relative",
    zIndex: 50,
  },

  hero: {
    background: DU_BLUE,
    color: "white",
    borderBottom: `5px solid ${DU_GOLD}`,
  },

  heroInner: {
    width: "100%",
    maxWidth: 1100,
    margin: "0 auto",
    padding: "18px 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },

  heroInnerMobile: {
    alignItems: "flex-start",
    gap: 14,
  },

  heroLeft: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    minWidth: 0,
    flex: 1,
  },

  heroLeftMobile: {
    alignItems: "flex-start",
  },

  actionsWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
  },

  actionsWrapMobile: {
    alignSelf: "flex-start",
    marginTop: 2,
  },

  titleWrap: {
    minWidth: 0,
    flex: 1,
  },

  logoWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.18)",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    textDecoration: "none",
  },

  title: {
    margin: 0,
    fontSize: 26,
    fontWeight: 900,
    lineHeight: 1.08,
    maxWidth: 620,
  },

  titleMobile: {
    fontSize: 16,
    lineHeight: 1.12,
    maxWidth: "100%",
  },

  subtitle: {
    margin: "6px 0 0 0",
    fontSize: 12,
    opacity: 0.9,
  },

  goldBar: {
    marginTop: 10,
    height: 4,
    width: 180,
    maxWidth: "100%",
    borderRadius: 999,
    background: DU_GOLD,
  },

  goldBarMobile: {
    width: 110,
    marginTop: 8,
  },

  menuWrap: {
    position: "relative",
  },

  hamburgerBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.10)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 5,
    cursor: "pointer",
    padding: 0,
  },

  hamburgerLine: {
    width: 20,
    height: 2,
    background: "white",
    borderRadius: 999,
    margin: "0 auto",
  },

  dropdown: {
    position: "absolute",
    right: 0,
    top: 52,
    width: 240,
    background: "var(--card)",
    color: "var(--text)",
    borderRadius: 14,
    boxShadow: "var(--shadow)",
    overflow: "hidden",
    border: "1px solid var(--border)",
    zIndex: 999,
  },

  dropdownMobile: {
    width: 220,
    right: 0,
    top: 50,
  },

  dropdownLink: {
    display: "block",
    padding: "12px 14px",
    textDecoration: "none",
    color: "var(--text)",
    fontWeight: 650,
  },

  logoutButton: {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "12px 14px",
    border: "none",
    borderTop: "1px solid var(--border)",
    background: "transparent",
    color: "#B00020",
    fontWeight: 750,
    cursor: "pointer",
  },
};