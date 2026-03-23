'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import styles from './page.module.css';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpRole, setSignUpRole] = useState('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isDrexelEmail = (value) =>
    value.trim().toLowerCase().endsWith('@drexel.edu');

  const resetFields = () => {
    setError('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const getErrorMessage = (errorCode, signUpMode) => {
    if (signUpMode) {
      switch (errorCode) {
        case 'auth/email-already-in-use':
          return 'An account with this email already exists.';
        case 'auth/invalid-email':
          return 'Invalid email address.';
        case 'auth/operation-not-allowed':
          return 'Email/password accounts are not enabled.';
        case 'auth/weak-password':
          return 'Password is too weak.';
        case 'auth/network-request-failed':
          return 'Network error. Please check your connection.';
        default:
          return 'Failed to create account.';
      }
    }

    switch (errorCode) {
      case 'auth/user-not-found':
      case 'auth/invalid-credential':
        return 'No account found with these credentials.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      default:
        return 'Failed to sign in.';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();

    if (!isDrexelEmail(cleanEmail)) {
      setError('Only @drexel.edu email addresses are allowed.');
      return;
    }

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);

        await setDoc(doc(db, 'users', cred.user.uid), {
          email: cleanEmail,
          role: signUpRole,
          createdAt: new Date(),
        });

        router.push(signUpRole === 'owner' ? '/truckpagecust' : '/');
      } else {
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const snap = await getDoc(doc(db, 'users', cred.user.uid));
        const role = snap.exists() ? snap.data().role : 'user';

        router.push(role === 'owner' ? '/truckpagecust' : '/');
      }
    } catch (err) {
      setError(getErrorMessage(err.code, isSignUp));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.login}>
      <h1>{isSignUp ? 'Create Account' : 'Food Truck Leaderboard'}</h1>

      <p style={{ marginBottom: 10, fontWeight: 700 }}>
        Drexel students only — use your @drexel.edu email
      </p>

      <form onSubmit={handleSubmit}>
        <label>Email:</label>
        <input
          type="email"
          placeholder="yourname@drexel.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />

        <label>Password:</label>
        <input
          type="password"
          placeholder={isSignUp ? 'Enter your password' : 'Enter your password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />

        {isSignUp && (
          <>
            <label>Confirm Password:</label>
            <input
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
          </>
        )}

        {error && <div className={styles.error}>{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? (isSignUp ? 'Creating account...' : 'Signing in...') : isSignUp ? 'Sign Up' : 'Sign In'}
        </button>

        <div className={styles.link}>
          {isSignUp ? (
            <>
              <p>Already have an account? </p>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setSignUpRole('user');
                  resetFields();
                }}
                className={styles.toggleButton}
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              <p>Don&apos;t have an account? </p>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setSignUpRole('user');
                  resetFields();
                }}
                className={styles.toggleButton}
              >
                Sign up
              </button>

              <p>Want to sign up as a food cart owner? </p>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setSignUpRole('owner');
                  resetFields();
                }}
                className={styles.toggleButton}
              >
                Sign up as a food cart owner
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}