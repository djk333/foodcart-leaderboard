"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "../lib/firebase";

const DREXEL_BLUE = "#07294D";
const DREXEL_GOLD = "#FFC600";

function DragonIcon({ size = 44 }) {
  return (
    <img
      src="/drexel-dragon.png"
      alt="Drexel Dragon"
      width={size}
      height={size}
      style={{ display: "block", objectFit: "contain" }}
    />
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
    //{ label: "Map", href: "/map" },
    //{ label: "View Reviews", href: "/viewing" },
    { label: "Find People", href: "/profiles" },
    { label: "Profile", href: "/profileEditor" },
    { label: "Customize Truck Profile", href: "/truckpagecust" },
    ...(!loggedIn ? [{ label: "Login", href: "/login" }] : []),
  ];

  return (
    <header style={styles.header}>
      <div style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.heroLeft}>
            <Link href="/" style={styles.logoWrap}>
              <DragonIcon size={50} />
            </Link>

            <div style={styles.titleWrap}>
              <h1 style={styles.title}>Drexel Food Cart Leaderboard</h1>
              <p style={styles.subtitle}>Find • Rate • Rank</p>
              <div style={styles.goldBar} />
            </div>
          </div>

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
    background: DREXEL_BLUE,
    color: "white",
    borderBottom: `5px solid ${DREXEL_GOLD}`,
    display: "flex",
    alignItems: "center",
  },

  heroInner: {
    width: "100%",
    maxWidth: 1100,
    margin: "0 auto",
    padding: "22px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },

  heroLeft: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    minWidth: 0,
  },

  titleWrap: {
    minWidth: 0,
  },

  logoWrap: {
    width: 58,
    height: 58,
    borderRadius: 16,
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.18)",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
  },

  title: {
    margin: 0,
    fontSize: 36,
    fontWeight: 900,
    letterSpacing: 0.2,
    lineHeight: 1.1,
  },

  subtitle: {
    margin: "8px 0 0 0",
    fontSize: 14,
    opacity: 0.9,
  },

  goldBar: {
    marginTop: 12,
    height: 4,
    width: 220,
    maxWidth: "100%",
    borderRadius: 999,
    background: DREXEL_GOLD,
  },

  menuWrap: {
    position: "relative",
    flexShrink: 0,
  },

  hamburgerBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.10)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 6,
    cursor: "pointer",
    padding: 0,
  },

  hamburgerLine: {
    width: 22,
    height: 2,
    background: "white",
    borderRadius: 999,
    margin: "0 auto",
  },

  dropdown: {
    position: "absolute",
    right: 0,
    top: 58,
    width: 230,
    background: "var(--card)",
    color: "var(--text)",
    borderRadius: 14,
    boxShadow: "var(--shadow)",
    overflow: "hidden",
    border: "1px solid var(--border)",
    zIndex: 999,
  },

  dropdownLink: {
    display: "block",
    padding: "12px 14px",
    textDecoration: "none",
    color: "var(--text)",
    fontWeight: 650,
    background: "transparent",
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
    fontSize: "inherit",
  },
};