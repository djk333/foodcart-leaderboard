"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getFoodcartBySlug } from "@/lib/foodcarts";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";

export default function FoodcartPage() {
  const { slug } = useParams();
  const [truck, setTruck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        const userSnap = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userSnap.exists()) {
          setDisplayName(userSnap.data().displayName ?? "Anonymous");
        } else {
          setDisplayName(firebaseUser.email ?? "Anonymous");
        }
      } else {
        setDisplayName("");
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!slug) return;

    const decoded = decodeURIComponent(slug).toLowerCase();

    getFoodcartBySlug(decoded)
      .then((data) => setTruck(data))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!slug) return;

    const decoded = decodeURIComponent(slug).toLowerCase();

    const loadReviews = async () => {
      setReviewsLoading(true);
      try {
        const reviewsRef = collection(db, "Foodcarts", decoded, "reviews");
        const q = query(reviewsRef, orderBy("createdAt", "desc"));
        const snap = await getDocs(q);

        setReviews(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              author: data.author ?? "Anonymous",
              authorId: data.authorId ?? null,
              rating: data.rating ?? 0,
              comment: data.comment ?? "",
              createdAt:
                data.createdAt && typeof data.createdAt.toDate === "function"
                  ? data.createdAt.toDate()
                  : null,
            };
          })
        );
      } catch (err) {
        console.error("Failed to load reviews:", err);
      } finally {
        setReviewsLoading(false);
      }
    };

    loadReviews();
  }, [slug]);

  async function handleSubmitReview(e) {
    e.preventDefault();

    if (!user) return;
    if (rating === 0) {
      alert("Please select a star rating.");
      return;
    }
    if (!comment.trim()) {
      alert("Please write a comment.");
      return;
    }

    setSubmitting(true);

    try {
      const decoded = decodeURIComponent(slug).toLowerCase();

      await addDoc(collection(db, "Foodcarts", decoded, "reviews"), {
        author: displayName || "Anonymous",
        authorId: user.uid,
        rating,
        comment: comment.trim(),
        createdAt: serverTimestamp(),
      });

      setReviews((prev) => [
        {
          id: Date.now().toString(),
          author: displayName || "Anonymous",
          authorId: user.uid,
          rating,
          comment: comment.trim(),
          createdAt: new Date(),
        },
        ...prev,
      ]);

      setRating(0);
      setComment("");
    } catch (err) {
      console.error("Failed to submit review:", err);
      alert("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
        <p>Loading…</p>
      </main>
    );
  }

  if (!truck) {
    return (
      <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          ← Back to Leaderboard
        </Link>
        <h1 style={{ marginTop: 16 }}>Food cart not found</h1>
      </main>
    );
  }

  return (
    <main
      style={{
        padding: "40px 20px",
        maxWidth: "800px",
        margin: "0 auto",
        minHeight: "100vh",
        backgroundColor: "var(--bg)",
        color: "var(--text)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <Link
        href="/"
        style={{
          color: "#07294D",
          textDecoration: "none",
          fontWeight: "600",
        }}
      >
        ← Back to Leaderboard
      </Link>

      <header style={{ textAlign: "center", margin: "40px 0" }}>
        <h1
          style={{
            fontSize: "clamp(2rem, 5vw, 3rem)",
            color: "#07294D",
            margin: "0 0 10px 0",
            letterSpacing: "0.5px",
          }}
        >
          {truck.name}
        </h1>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              background: "#07294D",
              color: "white",
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "0.9rem",
            }}
          >
            {truck.category}
          </span>
          <span style={{ color: "#666" }}>•</span>
          <span style={{ color: "#666", fontWeight: "500" }}>{truck.location}</span>
        </div>
      </header>

      <section
        style={{
          background: "var(--card)",
          padding: "32px",
          borderRadius: "16px",
          boxShadow: "var(--shadow)",
          border: "1px solid var(--border)",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            borderBottom: "2px solid #07294D",
            paddingBottom: "10px",
            marginBottom: "16px",
            color: "#07294D",
            letterSpacing: "1px",
          }}
        >
          MENU
        </h2>

        <p
          style={{
            fontSize: "0.9rem",
            color: "#777",
            textAlign: "center",
            marginBottom: "24px",
            lineHeight: "1.5",
          }}
        >
          Menus are based on commonly available items for each vendor type and
          student-observed offerings, since many campus food carts do not publish
          official menus.
        </p>

        <div style={{ display: "grid", gap: "8px" }}>
          {truck.menu && truck.menu.length > 0 ? (
            truck.menu.map((item, index) => (
              <div
                key={index}
                style={{
                  padding: "14px 0",
                  borderBottom: "1px solid #f0f0f0",
                  fontWeight: "600",
                  fontSize: "1rem",
                  lineHeight: "1.5",
                  wordBreak: "break-word",
                }}
              >
                {item}
              </div>
            ))
          ) : (
            <p style={{ textAlign: "center", opacity: 0.5 }}>
              No menu items listed yet.
            </p>
          )}
        </div>
      </section>

      <section
        style={{
          background: "var(--card)",
          padding: "32px",
          borderRadius: "16px",
          boxShadow: "var(--shadow)",
          border: "1px solid var(--border)",
          marginTop: "30px",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            borderBottom: "2px solid #07294D",
            paddingBottom: "10px",
            marginBottom: "30px",
            color: "#07294D",
            letterSpacing: "1px",
          }}
        >
          REVIEWS
        </h2>

        {user ? (
          <form
            onSubmit={handleSubmitReview}
            style={{
              marginBottom: "30px",
              paddingBottom: "20px",
              borderBottom: "1px solid #eee",
            }}
          >
            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  fontWeight: "600",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Your Rating
              </label>

              <div style={{ display: "flex", gap: "4px" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    onClick={() => setRating(star)}
                    style={{
                      cursor: "pointer",
                      fontSize: "1.5rem",
                      color: star <= rating ? "#facc15" : "#e5e7eb",
                    }}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>

            <textarea
              placeholder="Write your review..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                resize: "vertical",
                minHeight: "80px",
                fontFamily: "inherit",
                boxSizing: "border-box",
                background: "var(--card)",
                color: "var(--text)",
              }}
            />

            <button
              type="submit"
              disabled={submitting}
              style={{
                marginTop: "10px",
                background: "#07294D",
                color: "white",
                padding: "10px 24px",
                border: "none",
                borderRadius: "8px",
                cursor: submitting ? "not-allowed" : "pointer",
                fontWeight: "600",
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        ) : (
          <p style={{ textAlign: "center", color: "#999", marginBottom: "20px" }}>
            <Link href="/login" style={{ color: "#07294D", fontWeight: "600" }}>
              Sign in
            </Link>{" "}
            to leave a review.
          </p>
        )}

        {reviewsLoading ? (
          <p style={{ textAlign: "center", color: "#999" }}>Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p style={{ textAlign: "center", color: "#999" }}>
            No reviews yet. Be the first!
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {reviews.map((r) => (
              <div
                key={r.id}
                style={{ padding: "16px 0", borderBottom: "1px solid #f0f0f0" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "6px",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  {r.authorId ? (
                    <Link
                      href={`/profile/${r.authorId}`}
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: "700",
                        color: "#07294D",
                        textDecoration: "none",
                      }}
                    >
                      {r.author}
                    </Link>
                  ) : (
                    <strong style={{ fontSize: "0.95rem" }}>{r.author}</strong>
                  )}

                  {r.createdAt && (
                    <span style={{ fontSize: "0.8rem", color: "#999" }}>
                      {r.createdAt.toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", gap: "2px", marginBottom: "8px" }}>
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      style={{
                        color: i < r.rating ? "#facc15" : "#e5e7eb",
                        fontSize: "0.9rem",
                      }}
                    >
                      ★
                    </span>
                  ))}
                </div>

                <p
                  style={{
                    margin: 0,
                    color: "#555",
                    fontSize: "0.95rem",
                    lineHeight: "1.5",
                    wordBreak: "break-word",
                  }}
                >
                  {r.comment}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer
        style={{
          marginTop: "60px",
          textAlign: "center",
          color: "#888",
          fontSize: "0.85rem",
          lineHeight: "1.5",
        }}
      >
        Menu items are community-informed and may vary by day.
      </footer>
    </main>
  );
}
