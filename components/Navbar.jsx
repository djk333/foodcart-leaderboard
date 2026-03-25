"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "../lib/firebase";
import ThemeToggle from "./ThemeToggle";

const DU_BLUE = "#07294D";
const DU_GOLD = "#FFC600";

// 🔥 NEW DU LOGO (no dragon)
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
  const menuRef = useRef(null);
  const router = useRouter();

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
    { label: "Find People", href: "/profiles" },
    { label: "Profile", href: "/profileEditor" },
    { label: "About", href: "/about" },
    { label: "Customize Truck Profile", href: "/truckpagecust" },
    ...(!loggedIn ? [{ label: "Login", href: "/login" }] : []),
  ];

  return (
    <header style={styles.header}>
      <div style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.heroLeft}>
            <Link href="/" style={styles.logoWrap}>
              <DULogo />
            </Link>

            <div style={styles.titleWrap}>
              <h1 style={styles.title}>DU Community Food Cart Leaderboard</h1>
              <p style={styles.subtitle}>Find • Rate • Rank</p>
              <div style={styles.goldBar} />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
                <div style={styles.dropdown}>
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
    minHeight: "16vh",
    background: DU_BLUE,
    color: "white",
    borderBottom: `5px solid ${DU_GOLD}`,
    display: "flex",
    alignItems: "center",
  },

  heroInner: {
    width: "100%",
    maxWidth: 1100,
    margin: "0 auto",
    padding: "18px 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    rowGap: 10,
  },

  heroLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },

  titleWrap: {
    minWidth: 0,
  },

  logoWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.18)",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
  },

  title: {
    margin: 0,
    fontSize: 26,
    fontWeight: 900,
    lineHeight: 1.1,
  },

  subtitle: {
    margin: "4px 0 0 0",
    fontSize: 12,
    opacity: 0.9,
  },

  goldBar: {
    marginTop: 8,
    height: 3,
    width: 140,
    maxWidth: "100%",
    borderRadius: 999,
    background: DU_GOLD,
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
    width: 220,
    background: "var(--card)",
    color: "var(--text)",
    borderRadius: 12,
    boxShadow: "var(--shadow)",
    overflow: "hidden",
    border: "1px solid var(--border)",
    zIndex: 999,
  },

  dropdownLink: {
    display: "block",
    padding: "10px 12px",
    textDecoration: "none",
    color: "var(--text)",
    fontWeight: 650,
  },

  logoutButton: {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "10px 12px",
    border: "none",
    borderTop: "1px solid var(--border)",
    background: "transparent",
    color: "#B00020",
    fontWeight: 750,
    cursor: "pointer",
  },
};