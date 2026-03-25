"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { fetchVotes, fetchUserVote, castVote } from "@/lib/votes";
import { getAllFoodcarts } from "@/lib/foodcarts";
import styles from "./Leaderboard.module.css";
import { ACTIVE_TERM, LOCKED_TERMS } from "@/lib/votes";



function getDrexelTerm(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  let term;
  let academicYear;

  if (month >= 9 && month <= 12) {
    term = "Fall";
    academicYear = `${year.toString().slice(-2)}-${(year + 1)
      .toString()
      .slice(-2)}`;
  } else if (month >= 1 && month <= 3) {
    term = "Winter";
    academicYear = `${(year - 1).toString().slice(-2)}-${year
      .toString()
      .slice(-2)}`;
  } else if (month >= 4 && month <= 6) {
    term = "Spring";
    academicYear = `${(year - 1).toString().slice(-2)}-${year
      .toString()
      .slice(-2)}`;
  } else {
    term = "Summer";
    academicYear = `${(year - 1).toString().slice(-2)}-${year
      .toString()
      .slice(-2)}`;
  }

  return `${term} ${academicYear}`;
}

function generatePreviousPeriods() {
  return ["Fall 2025-26", "Winter 2025-26", "Spring 2025-26"];
}

export default function Leaderboard({ trucks: trucksProp, title, subtitle }) {
  const currentPeriod = ACTIVE_TERM;

  const basePeriods = generatePreviousPeriods();
  const availablePeriods = basePeriods.includes(currentPeriod)
    ? basePeriods
    : [currentPeriod, ...basePeriods];

  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriod);
  const [query, setQuery] = useState("");
  const [baseTrucks, setBaseTrucks] = useState(
    Array.isArray(trucksProp) && trucksProp.length > 0 ? trucksProp : []
  );
  const [trucks, setTrucks] = useState(baseTrucks);
  const [loading, setLoading] = useState(!trucksProp?.length);
  const [userVoteId, setUserVoteId] = useState(null);
  const [uid, setUid] = useState(null);
  const [voting, setVoting] = useState(false);

  const [showReport, setShowReport] = useState(false);
  const [reportText, setReportText] = useState("");


  const isLocked = LOCKED_TERMS.includes(selectedPeriod);
  const isCurrentPeriod = selectedPeriod === currentPeriod && !isLocked;



  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (Array.isArray(trucksProp) && trucksProp.length > 0) {
      setBaseTrucks(trucksProp);
      setLoading(false);
      return;
    }

    let cancelled = false;

    getAllFoodcarts()
      .then((carts) => {
        if (!cancelled) {
          setBaseTrucks(carts);
          setTrucks(carts);
        }
      })
      .catch((error) => {
        console.error("Error loading food carts:", error);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [trucksProp]);

  useEffect(() => {
    setTrucks(baseTrucks);
    setUserVoteId(null);
  }, [selectedPeriod, baseTrucks]);

  useEffect(() => {
    if (baseTrucks.length === 0) return;

    let cancelled = false;

    async function loadVotes() {
      try {
        const [votesMap, userTruck] = await Promise.all([
          fetchVotes(selectedPeriod),
          uid ? fetchUserVote(selectedPeriod, uid) : Promise.resolve(null),
        ]);

        if (cancelled) return;

        setTrucks(
          baseTrucks.map((truck) => ({
            ...truck,
            votes:
              typeof votesMap[truck.id] === "number" ? votesMap[truck.id] : 0,
          }))
        );
        setUserVoteId(userTruck);
      } catch (error) {
        console.error("Error loading votes:", error);
        if (!cancelled) {
          setTrucks(baseTrucks);
          setUserVoteId(null);
        }
      }
    }

    loadVotes();

    return () => {
      cancelled = true;
    };
  }, [selectedPeriod, uid, baseTrucks]);

  async function handleVote(nextId) {
    if (!isCurrentPeriod || !uid || voting) return;
    if (userVoteId === nextId) return;

    const previousVoteId = userVoteId;

    setTrucks((prev) =>
      prev.map((truck) => {
        if (truck.id === nextId) {
          return { ...truck, votes: (truck.votes || 0) + 1 };
        }
        if (previousVoteId && truck.id === previousVoteId) {
          return { ...truck, votes: Math.max(0, (truck.votes || 0) - 1) };
        }
        return truck;
      })
    );

    setUserVoteId(nextId);
    setVoting(true);

    try {
      const updatedVotes = await castVote(selectedPeriod, uid, nextId);

      setTrucks((prev) =>
        prev.map((truck) => ({
          ...truck,
          votes:
            typeof updatedVotes[truck.id] === "number"
              ? updatedVotes[truck.id]
              : truck.votes,
        }))
      );
    } catch (error) {
      console.error("Vote failed:", error);

      setTrucks((prev) =>
        prev.map((truck) => {
          if (truck.id === nextId) {
            return { ...truck, votes: Math.max(0, (truck.votes || 0) - 1) };
          }
          if (previousVoteId && truck.id === previousVoteId) {
            return { ...truck, votes: (truck.votes || 0) + 1 };
          }
          return truck;
        })
      );

      setUserVoteId(previousVoteId);
    } finally {
      setVoting(false);
    }
  }

  async function handleSubmitReport() {
    if (!reportText.trim()) {
      alert("Please describe the issue before submitting.");
      return;
    }

    try {
      await addDoc(collection(db, "reports"), {
        message: reportText.trim(),
        period: selectedPeriod,
        userId: uid || null,
        createdAt: new Date().toISOString(),
      });

      alert("Report submitted. Thank you!");
      setReportText("");
      setShowReport(false);
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Error submitting report. Try again.");
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const list = q
      ? trucks.filter((truck) => {
          const name = (truck.name ?? "").toLowerCase();
          const category = (truck.category ?? "").toLowerCase();
          const location = (truck.location ?? "").toLowerCase();

          return (
            name.includes(q) || category.includes(q) || location.includes(q)
          );
        })
      : trucks;

    return [...list].sort(
      (a, b) => (b.votes || 0) - (a.votes || 0) || a.name.localeCompare(b.name)
    );
  }, [query, trucks]);

  const rankedTrucks = useMemo(() => {
    let previousVotes = null;
    let previousRank = 0;

    return filtered.map((truck, index) => {
      const currentVotes = truck.votes || 0;
      let rank = index + 1;
      let isTie = false;

      if (previousVotes !== null && currentVotes === previousVotes) {
        rank = previousRank;
        isTie = true;
      } else {
        previousRank = rank;
        previousVotes = currentVotes;
      }

      return {
        ...truck,
        rank,
        isTie,
      };
    });
  }, [filtered]);

  const maxVotes = Math.max(1, ...rankedTrucks.map((truck) => truck.votes || 0));

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div>
          <h1 className={styles.h1}>{title ?? "DU Community FoodCart Leaderboard"}</h1>
          <p className={styles.sub}>
            {subtitle ?? `Rankings for ${selectedPeriod}. Resets at end of each term.`}
          </p>
        </div>

        <div className={styles.controls}>
          <select
            className={styles.periodSelect}
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            {availablePeriods.map((period) => (
              <option key={period} value={period}>
                {period === currentPeriod ? `${period} (Current)` : period}
              </option>
            ))}
          </select>

          <input
            className={styles.search}
            placeholder="Search food carts…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.headRow}>
          <span className={styles.headTitle}>
            {isCurrentPeriod ? "Current Rankings" : `${selectedPeriod} Rankings`}
          </span>
          <span className={styles.count}>{rankedTrucks.length} results</span>
        </div>

        <div className={styles.table}>
          {rankedTrucks.map((truck) => {
            const isSelected = userVoteId === truck.id;

            return (
              <div key={truck.id} className={styles.row}>
                <div className={styles.left}>
                  <span className={styles.rank}>
                    #{truck.rank}
                    {truck.isTie ? " (Tie)" : ""}
                  </span>

                  <Link
                    href={`/foodcarts/${truck.id}`}
                    className={styles.nameWrap}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <span className={styles.name}>{truck.name}</span>
                    <span className={styles.tag}>{truck.category}</span>
                    <span className={styles.location}>{truck.location}</span>
                  </Link>
                </div>

                <div className={styles.right}>
                  <div className={styles.barWrap}>
                    <div
                      className={styles.bar}
                      style={{
                        width: `${((truck.votes || 0) / maxVotes) * 100}%`,
                      }}
                    />
                  </div>

                  <span className={styles.votes}>{truck.votes} votes</span>

                  <button
                    className={styles.voteBtn}
                    onClick={() => handleVote(truck.id)}
                    type="button"
                    aria-pressed={isSelected}
                    disabled={!isCurrentPeriod || !uid || voting}
                    title={!uid && isCurrentPeriod ? "Sign in to vote" : undefined}
                    style={
                      !isCurrentPeriod || !uid
                        ? { opacity: 0.5, cursor: "not-allowed" }
                        : isSelected
                          ? { opacity: 0.7 }
                          : undefined
                    }
                  >
                    {isLocked
                      ? "Locked"
                      : !isCurrentPeriod
                        ? "View Only"
                        : !uid
                          ? "Sign in"
                          : isSelected
                            ? "Voted"
                            : "Vote"}
                  </button>
                </div>
              </div>
            );
          })}

          {loading && <div className={styles.empty}>Loading food carts…</div>}

          {!loading && rankedTrucks.length === 0 && (
            <div className={styles.empty}>No matches found.</div>
          )}
        </div>
      </div>

      <button
        className={styles.reportFloatingBtn}
        type="button"
        onClick={() => setShowReport(true)}
      >
        Report Issue
      </button>

      {showReport && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowReport(false)}
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.modalTitle}>Report an Issue</h3>

            <textarea
              className={styles.textArea}
              placeholder="Describe the issue..."
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
            />

            <div className={styles.modalButtons}>
              <button
                className={styles.submitBtn}
                type="button"
                onClick={handleSubmitReport}
              >
                Submit
              </button>

              <button
                className={styles.cancelBtn}
                type="button"
                onClick={() => setShowReport(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}