"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Club } from "@/lib/types";

export default function ClubsPage() {
  const [myClubs, setMyClubs] = useState<Club[]>([]);
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [clubName, setClubName] = useState("");
  const [clubDesc, setClubDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchClubs = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    // Get clubs user is a member of
    const { data: memberships } = await supabase
      .from("club_members")
      .select("club_id")
      .eq("user_id", user.id);

    const memberClubIds = memberships?.map((m) => m.club_id) || [];

    if (memberClubIds.length > 0) {
      const { data: clubs } = await supabase
        .from("clubs")
        .select("*")
        .in("id", memberClubIds)
        .order("created_at", { ascending: false });
      if (clubs) setMyClubs(clubs);
    }

    // Get all clubs not member of
    const { data: all } = await supabase
      .from("clubs")
      .select("*")
      .order("created_at", { ascending: false });

    if (all) {
      setAllClubs(all.filter((c) => !memberClubIds.includes(c.id)));
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  const createClub = async () => {
    if (!clubName.trim()) return;
    setCreating(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: club, error } = await supabase
      .from("clubs")
      .insert({
        name: clubName,
        description: clubDesc || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (club && !error) {
      // Auto join as admin
      await supabase.from("club_members").insert({
        club_id: club.id,
        user_id: user.id,
        role: "admin",
      });
      setSuccessMsg(`"${clubName}" created!`);
      setTimeout(() => setSuccessMsg(""), 3000);
      setClubName("");
      setClubDesc("");
      setShowCreate(false);
      fetchClubs();
    }
    setCreating(false);
  };

  const joinClub = async (clubId: string) => {
    setJoiningId(clubId);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("club_members").insert({
      club_id: clubId,
      user_id: user.id,
      role: "member",
    });

    setSuccessMsg("Joined club successfully!");
    setTimeout(() => setSuccessMsg(""), 3000);
    fetchClubs();
    setJoiningId(null);
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
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>👥</div>
          <p style={{ color: "#8B7355", fontSize: "14px" }}>Loading clubs...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "480px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "26px",
            fontWeight: 700,
            color: "#2C1810",
            letterSpacing: "-0.02em",
          }}
        >
          Book Clubs
        </h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            background: showCreate ? "#8B7355" : "#2C1810",
            color: "white",
            border: "none",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
            transition: "background 0.2s",
          }}
        >
          {showCreate ? "Cancel" : "+ Create"}
        </button>
      </div>

      {/* Create club form */}
      {showCreate && (
        <div
          style={{
            background: "white",
            border: "1px solid #E8DDD0",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "16px",
              fontWeight: 600,
              color: "#2C1810",
              marginBottom: "16px",
            }}
          >
            Create a new club
          </h2>
          <div style={{ marginBottom: "12px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 500,
                color: "#2C1810",
                marginBottom: "5px",
              }}
            >
              Club name
            </label>
            <input
              type="text"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              placeholder="e.g. Midsummer Classics Club"
              autoFocus
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
              }}
              onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
              onBlur={(e) => (e.target.style.borderColor = "#E8DDD0")}
            />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 500,
                color: "#2C1810",
                marginBottom: "5px",
              }}
            >
              Description (optional)
            </label>
            <textarea
              value={clubDesc}
              onChange={(e) => setClubDesc(e.target.value)}
              placeholder="What kind of books will you read?"
              rows={2}
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
                resize: "vertical",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
              onBlur={(e) => (e.target.style.borderColor = "#E8DDD0")}
            />
          </div>
          <button
            onClick={createClub}
            disabled={creating || !clubName.trim()}
            style={{
              width: "100%",
              padding: "11px",
              borderRadius: "8px",
              background: !clubName.trim() ? "#E8DDD0" : "#2C1810",
              color: "white",
              border: "none",
              fontSize: "13px",
              fontWeight: 600,
              cursor: !clubName.trim() ? "not-allowed" : "pointer",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {creating ? "Creating..." : "Create club"}
          </button>
        </div>
      )}

      {/* Success message */}
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

      {/* My clubs */}
      {myClubs.length > 0 && (
        <div style={{ marginBottom: "28px" }}>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "16px",
              fontWeight: 600,
              color: "#2C1810",
              marginBottom: "12px",
            }}
          >
            My clubs
          </h2>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {myClubs.map((club) => (
              <Link
                key={club.id}
                href={`/dashboard/clubs/${club.id}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    background: "white",
                    border: "1px solid #E8DDD0",
                    borderRadius: "12px",
                    padding: "18px",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    transition: "border-color 0.2s",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.borderColor =
                      "#C9A84C")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.borderColor =
                      "#E8DDD0")
                  }
                >
                  {/* Club avatar */}
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "10px",
                      background: "#2C1810",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontFamily: "'Playfair Display', serif",
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "#C9A84C",
                    }}
                  >
                    {club.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: "15px",
                        fontWeight: 600,
                        color: "#2C1810",
                        marginBottom: "3px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {club.name}
                    </h3>
                    {club.description && (
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#8B7355",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {club.description}
                      </p>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#8B7355",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      {club.member_count} members
                    </span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#D4C4B5"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Discover clubs */}
      <div>
        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "16px",
            fontWeight: 600,
            color: "#2C1810",
            marginBottom: "12px",
          }}
        >
          {allClubs.length > 0
            ? "Discover clubs"
            : myClubs.length === 0
              ? "No clubs yet"
              : "No other clubs"}
        </h2>

        {allClubs.length === 0 && myClubs.length === 0 ? (
          <div
            style={{
              background: "white",
              border: "1px dashed #E8DDD0",
              borderRadius: "16px",
              padding: "48px 24px",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "32px", marginBottom: "12px" }}>📖</p>
            <p
              style={{
                fontSize: "14px",
                color: "#8B7355",
                marginBottom: "16px",
              }}
            >
              No clubs exist yet. Be the first to create one!
            </p>
            <button
              onClick={() => setShowCreate(true)}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                background: "#2C1810",
                color: "white",
                border: "none",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Create a club
            </button>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {allClubs.map((club) => (
              <div
                key={club.id}
                style={{
                  background: "white",
                  border: "1px solid #E8DDD0",
                  borderRadius: "12px",
                  padding: "18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    background: "#F5ECD7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#8B7355",
                  }}
                >
                  {club.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "#2C1810",
                      marginBottom: "3px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {club.name}
                  </h3>
                  {club.description && (
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#8B7355",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {club.description}
                    </p>
                  )}
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#B5A090",
                      marginTop: "2px",
                    }}
                  >
                    {club.member_count} members
                  </p>
                </div>
                <button
                  onClick={() => joinClub(club.id)}
                  disabled={joiningId === club.id}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    background: joiningId === club.id ? "#E8DDD0" : "#FAF7F2",
                    color: "#2C1810",
                    border: "1px solid #E8DDD0",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: joiningId === club.id ? "not-allowed" : "pointer",
                    fontFamily: "'Inter', sans-serif",
                    flexShrink: 0,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (joiningId !== club.id) {
                      (e.currentTarget as HTMLElement).style.background =
                        "#2C1810";
                      (e.currentTarget as HTMLElement).style.color = "white";
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "#FAF7F2";
                    (e.currentTarget as HTMLElement).style.color = "#2C1810";
                  }}
                >
                  {joiningId === club.id ? "Joining..." : "Join"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
