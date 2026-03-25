import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import ThemeInit from "../components/ThemeInit";
import DisclaimerPopup from "../components/DisclaimerPopup";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "DU Community Food Cart Leaderboard",
  description: "Find, rate, and rank food carts across the DU student community",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeInit />
        <DisclaimerPopup />
        <Navbar />
        <main>{children}</main>

        {/* Footer Disclaimer */}
        <footer
          style={{
            marginTop: "60px",
            padding: "20px",
            textAlign: "center",
            fontSize: "13px",
            opacity: 0.7,
            borderTop: "1px solid var(--border)",
          }}
        >
          DU Food Cart Leaderboard is an independent student-created project developed for educational and community-use purposes. It is not affiliated with, endorsed by, sponsored by, or officially created by Drexel University.
        </footer>
      </body>
    </html>
  );
}