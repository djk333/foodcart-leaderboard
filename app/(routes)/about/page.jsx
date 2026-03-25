"use client";

export default function AboutPage() {
  return (
    <div
      style={{
        width: "min(1000px, 94vw)",
        margin: "28px auto 60px",
        color: "var(--text)",
      }}
    >
      {/* Header */}
      <h1
        style={{
          fontSize: "clamp(2rem, 4vw, 3rem)",
          fontWeight: 900,
          marginBottom: 20,
        }}
      >
        About
      </h1>

      {/* Mission */}
      <section
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: 20,
          marginBottom: 20,
          boxShadow: "var(--shadow)",
        }}
      >
        <h2 style={{ marginTop: 0, fontWeight: 900 }}>
          <strong>Mission</strong>
        </h2>

        <p style={{ lineHeight: 1.6 }}>
            To create a website which invokes a competitive atmosphere between food
          trucks using a leaderboard ranking system so students can rank, vote,
          and review food spots around campus.
        </p>
      </section>

      {/* Product Description */}
      <section
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: 20,
          marginBottom: 20,
          boxShadow: "var(--shadow)",
        }}
      >
        <p style={{ lineHeight: 1.6 }}>
            Drexel's campus is ruled by food carts, but determining the greatest
          bite is a guessing game. Our Website, Food Cart Leaderboard uses
          crowdsourced student ratings to rank carts in real time based on
          taste, pricing, and quickness & quality. Quickly navigate to the top
          voted, browse dishes with images, and view a live map of carts near
          you. Vendors receive feedback and increased foot traffic, while
          students receive faster and better lunches between sessions. We are
          debuting with Drexel favorites, highlights, and special deals. Vote,
          review, and eat smarter.
        </p>
      </section>

      {/* Team */}
      <section
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: 20,
          marginBottom: 20,
          boxShadow: "var(--shadow)",
        }}
      >
        <h2 style={{ marginTop: 0, fontWeight: 900 }}>
          <strong>Team C6</strong>
        </h2>

        <div style={{ lineHeight: 1.8 }}>
          <p>
            <strong>Product Owner:</strong> Dhruvil Jay Kothiya — djk333
          </p>

          <p>
            <strong>Backend Developers:</strong>
            <br />
            Haider Khan — hak59
            <br />
            Sahil Toora — st3458
          </p>

          <p>
            <strong>Designer:</strong> Nabin Bhusal — nb3345
          </p>
        </div>
      </section>

      {/* Course */}
      <section
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: 20,
          boxShadow: "var(--shadow)",
        }}
      >
        <p style={{ margin: 0, fontWeight: 700 }}>
          Computing and Informatics Design 102-103
          <br />
          <br />
          2 Term / 6-month project from Fall 2025 - Winter 2026
        </p>
      </section>
    </div>
  );
}