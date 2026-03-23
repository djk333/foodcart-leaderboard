"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import Link from "next/link";

export default function ProfilesPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function fetchUsers() {
      const snap = await getDocs(collection(db, "users"));
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(data);
    }

    fetchUsers();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Find People</h1>

      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {users.map((user) => (
            <Link
              key={user.id}
              href={`/profile/${user.id}`}
              style={{
                padding: 12,
                border: "1px solid var(--border)",
                borderRadius: 12,
                background: "var(--card)",
                color: "var(--text)",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              {user.email}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}