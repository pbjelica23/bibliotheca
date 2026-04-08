"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Profile } from "@/lib/types";

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [readingGoal, setReadingGoal] = useState(12);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data);
        setFullName(data.full_name || "");
        setUsername(data.username || "");
        setReadingGoal(data.reading_goal || 12);
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        username: username || null,
        reading_goal: readingGoal,
      })
      .eq("id", user.id);

    if (error) {
      setError(error.message);
    } else {
      setSuccessMsg("Profile updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚙️</div>
          <p style={{ color: "#8B7355", fontSize: "14px" }}>
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "480px", margin: "0 auto" }}>
      {/* Header */}
      <h1
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "26px",
          fontWeight: 700,
          color: "#2C1810",
          letterSpacing: "-0.02em",
          marginBottom: "28px",
        }}
      >
        Settings
      </h1>

      {/* Profile section */}
      <div
        style={{
          background: "white",
          border: "1px solid #E8DDD0",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "16px",
        }}
      >
        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "16px",
            fontWeight: 600,
            color: "#2C1810",
            marginBottom: "20px",
          }}
        >
          Profile
        </h2>

        {/* Avatar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "#2C1810",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              fontWeight: 700,
              color: "white",
              fontFamily: "'Playfair Display', serif",
              flexShrink: 0,
            }}
          >
            {fullName ? fullName.charAt(0).toUpperCase() : "?"}
          </div>
          <div>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "#2C1810" }}>
              {fullName || "Your name"}
            </p>
            <p style={{ fontSize: "12px", color: "#8B7355" }}>
              {username ? `@${username}` : "No username set"}
            </p>
          </div>
        </div>

        {/* Full name */}
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
            placeholder="Your full name"
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid #E8DDD0",
              fontSize: "14px",
              color: "#2C1810",
              background: "#FAF7F2",
              outline: "none",
              fontFamily: "'Inter', sans-serif",
              boxSizing: "border-box",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
            onBlur={(e) => (e.target.style.borderColor = "#E8DDD0")}
          />
        </div>

        {/* Username */}
        <div style={{ marginBottom: "0" }}>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 500,
              color: "#2C1810",
              marginBottom: "6px",
            }}
          >
            Username
          </label>
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#8B7355",
                fontSize: "14px",
              }}
            >
              @
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(
                  e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                )
              }
              placeholder="yourname"
              style={{
                width: "100%",
                padding: "10px 14px 10px 28px",
                borderRadius: "8px",
                border: "1px solid #E8DDD0",
                fontSize: "14px",
                color: "#2C1810",
                background: "#FAF7F2",
                outline: "none",
                fontFamily: "'Inter', sans-serif",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
              onBlur={(e) => (e.target.style.borderColor = "#E8DDD0")}
            />
          </div>
          <p style={{ fontSize: "11px", color: "#8B7355", marginTop: "4px" }}>
            Only lowercase letters, numbers, and underscores
          </p>
        </div>
      </div>

      {/* Reading goal section */}
      <div
        style={{
          background: "white",
          border: "1px solid #E8DDD0",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "16px",
        }}
      >
        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "16px",
            fontWeight: 600,
            color: "#2C1810",
            marginBottom: "8px",
          }}
        >
          Reading Goal
        </h2>
        <p style={{ fontSize: "13px", color: "#8B7355", marginBottom: "20px" }}>
          How many books do you want to read this year?
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={() => setReadingGoal(Math.max(1, readingGoal - 1))}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "1px solid #E8DDD0",
              background: "white",
              fontSize: "18px",
              color: "#2C1810",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            −
          </button>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "40px",
                fontWeight: 700,
                color: "#2C1810",
                lineHeight: 1,
              }}
            >
              {readingGoal}
            </div>
            <div
              style={{ fontSize: "12px", color: "#8B7355", marginTop: "4px" }}
            >
              books in {new Date().getFullYear()}
            </div>
          </div>
          <button
            onClick={() => setReadingGoal(Math.min(365, readingGoal + 1))}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "1px solid #E8DDD0",
              background: "white",
              fontSize: "18px",
              color: "#2C1810",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            +
          </button>
        </div>

        {/* Quick presets */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "20px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {[6, 12, 24, 52].map((preset) => (
            <button
              key={preset}
              onClick={() => setReadingGoal(preset)}
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                border: "1px solid #E8DDD0",
                background: readingGoal === preset ? "#2C1810" : "white",
                color: readingGoal === preset ? "white" : "#8B7355",
                fontSize: "12px",
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
                transition: "all 0.2s",
              }}
            >
              {preset} books
            </button>
          ))}
        </div>
      </div>

      {/* Error / success messages */}
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

      {successMsg && (
        <div
          style={{
            background: "#F0FDF4",
            border: "1px solid #BBF7D0",
            borderRadius: "8px",
            padding: "10px 14px",
            fontSize: "13px",
            color: "#16A34A",
            marginBottom: "16px",
          }}
        >
          ✓ {successMsg}
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "10px",
          background: saving ? "#E8DDD0" : "#2C1810",
          color: "white",
          fontSize: "14px",
          fontWeight: 600,
          border: "none",
          cursor: saving ? "not-allowed" : "pointer",
          fontFamily: "'Inter', sans-serif",
          marginBottom: "16px",
          transition: "background 0.2s",
        }}
      >
        {saving ? "Saving..." : "Save changes"}
      </button>

      {/* Danger zone */}
      <div
        style={{
          background: "white",
          border: "1px solid #FECACA",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "40px",
        }}
      >
        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "16px",
            fontWeight: 600,
            color: "#DC2626",
            marginBottom: "8px",
          }}
        >
          Account
        </h2>
        <p style={{ fontSize: "13px", color: "#8B7355", marginBottom: "16px" }}>
          Sign out of your account on this device.
        </p>
        <button
          onClick={handleSignOut}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            background: "white",
            color: "#DC2626",
            fontSize: "14px",
            fontWeight: 600,
            border: "1px solid #FECACA",
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "#FEF2F2";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "white";
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
