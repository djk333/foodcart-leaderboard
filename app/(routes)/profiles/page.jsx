"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ProfilesPage() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      try {
        const snap = await getDocs(collection(db, "users"));

        const data = snap.docs.map((docSnap) => ({
          uid: docSnap.id,
          ...docSnap.data(),
        }));

        setUsers(data);
      } catch (error) {
        console.error("Failed to load users:", error);
        setUsers([]);
      }
    }

    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();

    const sorted = [...users].sort((a, b) => {
      const aName = (a.displayName || a.email || "").toLowerCase();
      const bName = (b.displayName || b.email || "").toLowerCase();
      return aName.localeCompare(bName);
    });

    if (!q) return sorted;

    return sorted.filter((user) => {
      const displayName = (user.displayName || "").toLowerCase();
      const email = (user.email || "").toLowerCase();
      return displayName.includes(q) || email.includes(q);
    });
  }, [users, query]);

  return (
    <div
      style={{
        width: "min(1000px, 94vw)",
        margin: "28px auto 60px",
        color: "var(--text)",
      }}
    >
      <div
        style={{
          marginBottom: 20,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 900,
          }}
        >
          Find People
        </h1>

        <p
          style={{
            margin: "8px 0 0 0",
            opacity: 0.75,
            fontWeight: 500,
          }}
        >
          Browse Drexel users and view their profiles.
        </p>
      </div>

      <input
        type="text"
        placeholder="Search by name or email..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: "100%",
          padding: "12px 14px",
          marginBottom: 16,
          borderRadius: 14,
          border: "1px solid var(--border)",
          background: "var(--card)",
          color: "var(--text)",
          outline: "none",
        }}
      />

      {filteredUsers.length === 0 ? (
        <div
          style={{
            padding: 18,
            border: "1px solid var(--border)",
            borderRadius: 16,
            background: "var(--card)",
          }}
        >
          No users found.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {filteredUsers.map((user) => {
            const displayName =
              user.displayName?.trim() ||
              user.email?.split("@")[0] ||
              "Unknown User";

            const email = user.email || "";
            const grad =
              user.gradMonth || user.gradYear
                ? `${user.gradMonth || ""} ${user.gradYear || ""}`.trim()
                : "";

            return (
              <Link
                key={user.uid}
                href={`/profile/${user.uid}`}
                style={{
                  display: "block",
                  padding: 16,
                  border: "1px solid var(--border)",
                  borderRadius: 16,
                  background: "var(--card)",
                  color: "var(--text)",
                  textDecoration: "none",
                  boxShadow: "var(--shadow)",
                }}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    marginBottom: 4,
                  }}
                >
                  {displayName}
                </div>

                {email && (
                  <div
                    style={{
                      fontSize: 14,
                      opacity: 0.8,
                      marginBottom: grad ? 4 : 0,
                    }}
                  >
                    {email}
                  </div>
                )}

                {grad && (
                  <div
                    style={{
                      fontSize: 13,
                      opacity: 0.7,
                      fontWeight: 600,
                    }}
                  >
                    Graduating {grad}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}