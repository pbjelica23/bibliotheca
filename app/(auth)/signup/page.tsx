"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#FAF7F2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "48px 40px",
            border: "1px solid #E8DDD0",
            boxShadow: "0 4px 24px rgba(44, 24, 16, 0.06)",
            maxWidth: "400px",
            width: "100%",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📚</div>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "24px",
              fontWeight: 600,
              color: "#2C1810",
              marginBottom: "12px",
            }}
          >
            Check your email
          </h2>
          <p style={{ fontSize: "14px", color: "#8B7355", lineHeight: 1.7 }}>
            We sent a confirmation link to <strong>{email}</strong>. Click it to
            activate your account and start reading.
          </p>
          <Link
            href="/login"
            style={{
              display: "inline-block",
              marginTop: "24px",
              color: "#C9A84C",
              fontWeight: 500,
              fontSize: "14px",
              textDecoration: "none",
            }}
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FAF7F2",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: "400px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "32px",
              fontWeight: 700,
              color: "#2C1810",
              letterSpacing: "-0.02em",
              marginBottom: "8px",
            }}
          >
            Bibliotheca
          </h1>
          <p style={{ fontSize: "14px", color: "#8B7355" }}>
            Your personal reading companion
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "40px",
            border: "1px solid #E8DDD0",
            boxShadow: "0 4px 24px rgba(44, 24, 16, 0.06)",
          }}
        >
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "24px",
              fontWeight: 600,
              color: "#2C1810",
              marginBottom: "8px",
            }}
          >
            Create account
          </h2>
          <p
            style={{ fontSize: "14px", color: "#8B7355", marginBottom: "32px" }}
          >
            Start tracking your reading journey today
          </p>

          <form onSubmit={handleSignup}>
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#2C1810",
                  marginBottom: "6px",
                }}
              >
                Full name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Elena Kovač"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #E8DDD0",
                  fontSize: "14px",
                  color: "#2C1810",
                  background: "#FAF7F2",
                  outline: "none",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
                onBlur={(e) => (e.target.style.borderColor = "#E8DDD0")}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#2C1810",
                  marginBottom: "6px",
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #E8DDD0",
                  fontSize: "14px",
                  color: "#2C1810",
                  background: "#FAF7F2",
                  outline: "none",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
                onBlur={(e) => (e.target.style.borderColor = "#E8DDD0")}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#2C1810",
                  marginBottom: "6px",
                }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #E8DDD0",
                  fontSize: "14px",
                  color: "#2C1810",
                  background: "#FAF7F2",
                  outline: "none",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
                onBlur={(e) => (e.target.style.borderColor = "#E8DDD0")}
              />
              <p
                style={{ fontSize: "12px", color: "#8B7355", marginTop: "4px" }}
              >
                Minimum 6 characters
              </p>
            </div>

            {error && (
              <div
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  color: "#DC2626",
                  marginBottom: "16px",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                background: loading ? "#E8DDD0" : "#2C1810",
                color: "white",
                fontSize: "14px",
                fontWeight: 600,
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.2s",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>

        <p
          style={{
            textAlign: "center",
            marginTop: "24px",
            fontSize: "14px",
            color: "#8B7355",
          }}
        >
          Already have an account?{" "}
          <Link
            href="/login"
            style={{
              color: "#C9A84C",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
      `}</style>
    </div>
  );
}
