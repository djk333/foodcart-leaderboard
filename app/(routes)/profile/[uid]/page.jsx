"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import styles from "./page.module.css";

export default function PublicProfilePage() {
  const { uid } = useParams();

  const [profile, setProfile] = useState(null);
  const [foods, setFoods] = useState([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [favoriteTruck, setFavoriteTruck] = useState("None yet");
  const [loading, setLoading] = useState(true);

  const [viewerUid, setViewerUid] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [busyLikes, setBusyLikes] = useState({});
  const [busyComments, setBusyComments] = useState({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setViewerUid(user?.uid ?? null);
    });
    return () => unsub();
  }, []);

  async function loadFoodsWithSocial(ownerUid) {
    const foodsRef = collection(db, "users", ownerUid, "foods");
    const foodsQuery = query(foodsRef, orderBy("createdAt", "desc"));
    const foodsSnap = await getDocs(foodsQuery).catch(() => ({ docs: [] }));

    const loadedFoods = await Promise.all(
      (foodsSnap.docs || []).map(async (foodDoc) => {
        const data = foodDoc.data();
        const foodId = foodDoc.id;

        let comments = [];
        let likedByViewer = false;

        try {
          const commentsRef = collection(db, "users", ownerUid, "foods", foodId, "comments");
          const commentsQuery = query(commentsRef, orderBy("createdAt", "asc"));
          const commentsSnap = await getDocs(commentsQuery);

          comments = commentsSnap.docs.map((commentDoc) => {
            const commentData = commentDoc.data();
            return {
              id: commentDoc.id,
              author: commentData.author ?? "Anonymous",
              authorId: commentData.authorId ?? null,
              text: commentData.text ?? "",
              createdAt:
                commentData.createdAt && typeof commentData.createdAt.toDate === "function"
                  ? commentData.createdAt.toDate()
                  : null,
            };
          });
        } catch {
          comments = [];
        }

        if (viewerUid) {
          try {
            const likeDocRef = doc(db, "users", ownerUid, "foods", foodId, "likes", viewerUid);
            const likeSnap = await getDoc(likeDocRef);
            likedByViewer = likeSnap.exists();
          } catch {
            likedByViewer = false;
          }
        }

        return {
          id: foodId,
          imageUrl: data.imageUrl ?? "",
          caption: data.caption ?? "",
          likes: typeof data.likes === "number" ? data.likes : 0,
          comments,
          likedByViewer,
          createdAt:
            data.createdAt && typeof data.createdAt.toDate === "function"
              ? data.createdAt.toDate()
              : null,
        };
      })
    );

    setFoods(loadedFoods);
  }

  useEffect(() => {
    if (!uid) return;

    const loadProfilePage = async () => {
      try {
        const profileSnap = await getDoc(doc(db, "users", uid));

        if (!profileSnap.exists()) {
          setProfile(null);
          setLoading(false);
          return;
        }

        setProfile(profileSnap.data());

        const [leaderboardSnap, foodcartsSnap] = await Promise.all([
          getDocs(collection(db, "leaderboard")).catch(() => ({ docs: [] })),
          getDocs(collection(db, "Foodcarts")).catch(() => ({ docs: [] })),
        ]);

        await loadFoodsWithSocial(uid);

        let totalReviews = 0;
        const foodcartDocs = foodcartsSnap.docs || [];

        await Promise.all(
          foodcartDocs.map(async (foodcartDoc) => {
            try {
              const reviewsRef = collection(db, "Foodcarts", foodcartDoc.id, "reviews");
              const reviewsSnap = await getDocs(reviewsRef);

              reviewsSnap.forEach((reviewDoc) => {
                const reviewData = reviewDoc.data();
                if (reviewData.authorId === uid) {
                  totalReviews += 1;
                }
              });
            } catch {
              // ignore individual review read failures
            }
          })
        );

        setReviewCount(totalReviews);

        let foundFavoriteTruck = "None yet";
        const leaderboardDocs = leaderboardSnap.docs || [];

        for (const leaderboardDoc of leaderboardDocs) {
          const voteSnap = await getDoc(
            doc(db, "leaderboard", leaderboardDoc.id, "userVotes", uid)
          );

          if (voteSnap.exists()) {
            const truckId = voteSnap.data().truckId;
            if (truckId) {
              const truckSnap = await getDoc(doc(db, "Foodcarts", truckId));
              if (truckSnap.exists()) {
                foundFavoriteTruck = truckSnap.data().name ?? truckId;
              } else {
                foundFavoriteTruck = truckId;
              }
              break;
            }
          }
        }

        setFavoriteTruck(foundFavoriteTruck);
      } catch (err) {
        console.error("Failed to load public profile:", err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    loadProfilePage();
  }, [uid, viewerUid]);

  const initials = useMemo(() => {
    if (!profile?.displayName) return "??";
    return profile.displayName
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 3);
  }, [profile]);

  const handleToggleLike = async (foodId, currentlyLiked) => {
    if (!viewerUid || !uid) {
      alert("You must be logged in to like posts.");
      return;
    }

    if (busyLikes[foodId]) return;

    setBusyLikes((prev) => ({ ...prev, [foodId]: true }));

    try {
      const likeRef = doc(db, "users", uid, "foods", foodId, "likes", viewerUid);
      const foodRef = doc(db, "users", uid, "foods", foodId);

      if (currentlyLiked) {
        await deleteDoc(likeRef);
        await setDoc(foodRef, { likes: increment(-1) }, { merge: true });

        setFoods((prev) =>
          prev.map((food) =>
            food.id === foodId
              ? {
                  ...food,
                  likedByViewer: false,
                  likes: Math.max(0, (food.likes || 0) - 1),
                }
              : food
          )
        );
      } else {
        await setDoc(likeRef, {
          userId: viewerUid,
          createdAt: serverTimestamp(),
        });
        await setDoc(foodRef, { likes: increment(1) }, { merge: true });

        setFoods((prev) =>
          prev.map((food) =>
            food.id === foodId
              ? {
                  ...food,
                  likedByViewer: true,
                  likes: (food.likes || 0) + 1,
                }
              : food
          )
        );
      }
    } catch (err) {
      console.error("Failed to toggle like:", err);
      alert("Like action failed.");
    } finally {
      setBusyLikes((prev) => ({ ...prev, [foodId]: false }));
    }
  };

  const handleDeleteComment = async (foodId, commentId) => {
    if (!viewerUid || !uid) return;

    try {
      const commentRef = doc(
        db,
        "users",
        uid,
        "foods",
        foodId,
        "comments",
        commentId
      );

      await deleteDoc(commentRef);

      setFoods((prev) =>
        prev.map((food) =>
          food.id === foodId
            ? {
                ...food,
                comments: food.comments.filter((c) => c.id !== commentId),
              }
            : food
        )
      );
    } catch (err) {
      console.error("Failed to delete comment:", err);
      alert("Failed to delete comment.");
    }
  };

    const handleAddComment = async (foodId) => {
      if (!viewerUid || !uid) return;

      const handleAddComment = async (foodId) => {
        if (!viewerUid || !uid) {
          alert("You must be logged in to comment.");
          return;
        }

        const text = (commentInputs[foodId] || "").trim();
        if (!text) {
          alert("Write a comment first.");
          return;
        }

        if (busyComments[foodId]) return;

        setBusyComments((prev) => ({ ...prev, [foodId]: true }));

        try {
          const viewerSnap = await getDoc(doc(db, "users", viewerUid));
          const viewerName = viewerSnap.exists()
            ? viewerSnap.data().displayName || "Anonymous"
            : auth.currentUser?.email || "Anonymous";

          const commentsRef = collection(db, "users", uid, "foods", foodId, "comments");
          const newCommentRef = await addDoc(commentsRef, {
            author: viewerName,
            authorId: viewerUid,
            text,
            createdAt: serverTimestamp(),
          });

          setFoods((prev) =>
            prev.map((food) =>
              food.id === foodId
                ? {
                    ...food,
                    comments: [
                      ...food.comments,
                      {
                        id: newCommentRef.id,
                        author: viewerName,
                        authorId: viewerUid,
                        text,
                        createdAt: new Date(),
                      },
                    ],
                  }
                : food
            )
          );

          setCommentInputs((prev) => ({ ...prev, [foodId]: "" }));
        } catch (err) {
          console.error("Failed to add comment:", err);
          alert("Comment failed.");
        } finally {
          setBusyComments((prev) => ({ ...prev, [foodId]: false }));
        }
      };

      if (busyComments[foodId]) return;

      setBusyComments((prev) => ({ ...prev, [foodId]: true }));

      try {
        const viewerSnap = await getDoc(doc(db, "users", viewerUid));
        const viewerName = viewerSnap.exists()
          ? viewerSnap.data().displayName || "Anonymous"
          : auth.currentUser?.email || "Anonymous";

        const commentsRef = collection(db, "users", uid, "foods", foodId, "comments");

        const newCommentRef = await addDoc(commentsRef, {
          author: viewerName,
          authorId: viewerUid,
          text,
          createdAt: serverTimestamp(),
        });

        setFoods((prev) =>
          prev.map((food) =>
            food.id === foodId
              ? {
                  ...food,
                  comments: [
                    ...food.comments,
                    {
                      id: newCommentRef.id,
                      author: viewerName,
                      authorId: viewerUid,
                      text,
                      createdAt: new Date(),
                    },
                  ],
                }
              : food
          )
        );

        setCommentInputs((prev) => ({ ...prev, [foodId]: "" }));
      } catch (err) {
        console.error("Failed to add comment:", err);
        alert("Comment failed.");
      } finally {
        setBusyComments((prev) => ({ ...prev, [foodId]: false }));
      }
    };

    if (busyComments[foodId]) return;

    setBusyComments((prev) => ({ ...prev, [foodId]: true }));

    try {
      const viewerSnap = await getDoc(doc(db, "users", viewerUid));
      const viewerName = viewerSnap.exists()
        ? viewerSnap.data().displayName || "Anonymous"
        : auth.currentUser?.email || "Anonymous";

      const commentsRef = collection(db, "users", uid, "foods", foodId, "comments");
      const newCommentRef = await addDoc(commentsRef, {
        author: viewerName,
        authorId: viewerUid,
        text,
        createdAt: serverTimestamp(),
      });

      setFoods((prev) =>
        prev.map((food) =>
          food.id === foodId
            ? {
                ...food,
                comments: [
                  ...food.comments,
                  {
                    id: newCommentRef.id,
                    author: viewerName,
                    authorId: viewerUid,
                    text,
                    createdAt: new Date(),
                  },
                ],
              }
            : food
        )
      );

      setCommentInputs((prev) => ({ ...prev, [foodId]: "" }));
    } catch (err) {
      console.error("Failed to add comment:", err);
      alert("Comment failed.");
    } finally {
      setBusyComments((prev) => ({ ...prev, [foodId]: false }));
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading profile...</div>;
  }

  if (!profile) {
    return <div className={styles.notFound}>User not found.</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <section className={styles.hero}>
          <div
            className={styles.banner}
            style={{ background: profile.backgroundColor || "#3b82f6" }}
          >
            <div className={styles.bannerOverlay} />

            <div className={styles.heroContent}>
              <div className={styles.identity}>
                <div className={styles.avatar}>
                  {profile.profilePicture ? (
                    <img src={profile.profilePicture} alt={`${profile.displayName} profile`} />
                  ) : (
                    initials
                  )}
                </div>

                <div className={styles.identityText}>
                  <h1 className={styles.name}>{profile.displayName || "Anonymous User"}</h1>
                  <p className={styles.grad}>
                    Graduating {profile.gradMonth || "Unknown"} {profile.gradYear || ""}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.bioCard}>
            <p className={styles.bio}>
              {profile.bio?.trim() || "This user has not added a bio yet."}
            </p>
          </div>
        </section>

        <section className={styles.grid}>
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>Foods I’ve Eaten</h2>
            <p className={styles.sectionSubtitle}>
              Personal food uploads and mini captions.
            </p>

            {foods.length === 0 ? (
              <div className={styles.emptyState}>
                No food posts yet. This section will fill up once this user starts uploading meals.
              </div>
            ) : (
              <div className={styles.foodGrid}>
                {foods.map((food) => (
                  <article key={food.id} className={styles.foodCard}>
                    <div className={styles.foodImageWrap}>
                      {food.imageUrl ? (
                        <img
                          src={food.imageUrl}
                          alt={food.caption || "Food post"}
                          className={styles.foodImage}
                        />
                      ) : null}
                    </div>

                    <div className={styles.foodBody}>
                      <p className={styles.foodCaption}>
                        {food.caption?.trim() || "No caption."}
                      </p>

                      <div className={styles.foodMeta}>
                        {food.createdAt ? food.createdAt.toLocaleDateString() : "Just posted"}
                      </div>

                      <div className={styles.socialBar}>
                        <button
                          type="button"
                          className={styles.likeBtn}
                          onClick={() => handleToggleLike(food.id, food.likedByViewer)}
                          disabled={busyLikes[food.id]}
                        >
                          {food.likedByViewer ? "♥ Liked" : "♡ Like"} · {food.likes || 0}
                        </button>
                      </div>

                      <div className={styles.commentSection}>
                        <div className={styles.commentList}>
                          {food.comments.length === 0 ? (
                            <p className={styles.noComments}>No comments yet.</p>
                          ) : (
                            food.comments.map((comment) => (
                              <div key={comment.id} className={styles.commentItem}>
                                <span className={styles.commentAuthor}>{comment.author}</span>
                                <span className={styles.commentText}> {comment.text}</span>

                                {viewerUid === uid && (
                                  <button
                                    onClick={() => handleDeleteComment(food.id, comment.id)}
                                    style={{
                                      marginLeft: 8,
                                      fontSize: 12,
                                      color: "#B00020",
                                      background: "transparent",
                                      border: "none",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>

                        <div className={styles.commentComposer}>
                          <input
                            className={styles.commentInput}
                            type="text"
                            placeholder={
                              viewerUid ? "Write a comment..." : "Log in to comment"
                            }
                            value={commentInputs[food.id] || ""}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({
                                ...prev,
                                [food.id]: e.target.value,
                              }))
                            }
                            disabled={!viewerUid || busyComments[food.id]}
                          />
                          <button
                            type="button"
                            className={styles.commentBtn}
                            onClick={() => handleAddComment(food.id)}
                            disabled={!viewerUid || busyComments[food.id]}
                          >
                            Comment
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>Profile Details</h2>
            <div className={styles.sideList}>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Display Name</span>
                <span className={styles.statValue}>{profile.displayName || "Anonymous"}</span>
              </div>

              <div className={styles.statRow}>
                <span className={styles.statLabel}>Graduation</span>
                <span className={styles.statValue}>
                  {profile.gradMonth || "Unknown"} {profile.gradYear || ""}
                </span>
              </div>

              <div className={styles.statRow}>
                <span className={styles.statLabel}>Total Reviews</span>
                <span className={styles.statValue}>{reviewCount}</span>
              </div>

              <div className={styles.statRow}>
                <span className={styles.statLabel}>Favorite Truck</span>
                <span className={styles.statValue}>{favoriteTruck}</span>
              </div>

              <div className={styles.statRow}>
                <span className={styles.statLabel}>Food Posts</span>
                <span className={styles.statValue}>{foods.length}</span>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}