"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import {
  inMemoryPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { Eye, EyeOff, LoaderCircle } from "lucide-react";

import { firebaseAuth } from "@/lib/firebase/client";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      await setPersistence(firebaseAuth, inMemoryPersistence);

      const credential = await signInWithEmailAndPassword(
        firebaseAuth,
        email.trim(),
        password,
      );

      const idToken = await credential.user.getIdToken(true);

      const response = await fetch("/api/v1/auth/session", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        credentials: "same-origin",

        body: JSON.stringify({
          idToken,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to sign in.");
      }

      await signOut(firebaseAuth);

      router.replace(
        result?.user?.mustChangePassword
          ? "/admin/change-password"
          : "/admin/dashboard",
      );

      router.refresh();
    } catch (loginError) {
      console.error("Login error:", loginError);

      let message = "Unable to sign in. Please check your email and password.";

      if (loginError.code === "auth/invalid-credential") {
        message = "Email or password is incorrect.";
      }

      if (loginError.code === "auth/too-many-requests") {
        message = "Too many login attempts. Please try again later.";
      }

      if (loginError.message && !loginError.message.startsWith("Firebase:")) {
        message = loginError.message;
      }

      setError(message);

      try {
        await signOut(firebaseAuth);
      } catch {
        // Ignore Firebase client sign-out errors.
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-neutral-700"
        >
          Email
        </label>

        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          disabled={loading}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@junsekino.com"
          className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/5 disabled:cursor-not-allowed disabled:bg-neutral-50"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-neutral-700"
        >
          Password
        </label>

        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            disabled={loading}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 pr-12 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/5 disabled:cursor-not-allowed disabled:bg-neutral-50"
          />

          <button
            type="button"
            disabled={loading}
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-neutral-400 transition hover:text-neutral-900"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? <LoaderCircle size={18} className="animate-spin" /> : null}

        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
