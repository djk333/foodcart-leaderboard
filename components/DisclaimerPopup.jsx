"use client";

import { useEffect, useState } from "react";

export default function DisclaimerPopup() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("du_disclaimer_seen");
    if (!seen) {
      setShow(true);
    }
  }, []);

  function handleClose() {
    localStorage.setItem("du_disclaimer_seen", "true");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div style={overlay}>
      <div style={modal}>
        <h2 style={{ marginTop: 0 }}>Notice</h2>

        <p style={{ lineHeight: 1.6 }}>
          DU Food Cart Leaderboard is an independent student-created project
          developed for educational and community-use purposes. It is not
          affiliated with, endorsed by, sponsored by, or officially created by
          Drexel University.
        </p>

        <button onClick={handleClose} style={button}>
          Continue
        </button>
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  zIndex: 100000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
};

const modal = {
  maxWidth: 420,
  width: "100%",
  background: "var(--card)",
  color: "var(--text)",
  borderRadius: 18,
  padding: 20,
  boxShadow: "var(--shadow)",
  border: "1px solid var(--border)",
  textAlign: "center",
};

const button = {
  marginTop: 16,
  padding: "10px 16px",
  borderRadius: 10,
  border: "none",
  background: "#07294D",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
};