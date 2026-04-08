"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Club, Book } from "@/lib/types";

interface Member {
  id: string;
  user_id: string;
  role: string;
  profile: { full_name: string | null; username: string | null };
}

interface Vote {
  id: string;
  book_id: string;
  user_id: string;
  book: Book;
}

export default function ClubDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [club, setClub] = useState<Club | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showVoteSearch, setShowVoteSearch] = useState(false);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchClub = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data: clubData } = await supabase
      .from("clubs")
      .select("*")
      .eq("id", id)
      .single();

    if (clubData) {
      setClub(clubData);
      if (clubData.current_book_id) {
        const { data: book } = await supabase
          .from("books")
          .select("*")
          .eq("id", clubData.current_book_id)
          .single();
        if (book) setCurrentBook(book);
      }
    }

    const { data: membersData } = await supabase
      .from("club_members")
      .select("*, profile:profiles(full_name, username)")
      .eq("club_id", id);

    if (membersData) {
      setMembers(membersData);
      const me = membersData.find((m) => m.user_id === user.id);
      setIsMember(!!me);
      setIsAdmin(me?.role === "admin");
    }

    const { data: votesData } = await supabase
      .from("club_votes")
      .select("*, book:books(*)")
      .eq("club_id", id);

    if (votesData) {
      setVotes(votesData);
      const myV = votesData.find((v) => v.user_id === user.id);
      if (myV) setMyVote(myV.book_id);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchClub();
  }, [id]);

  const searchBooks = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=5`,
      );
      const data = await res.json();
      setSearchResults(data.items || []);
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  };

  const addVoteBook = async (googleBook: any) => {
    const supabase = createClient();
    const bookData = {
      id: googleBook.id,
      title: googleBook.volumeInfo.title,
      author: googleBook.volumeInfo.authors?.join(", ") || "Unknown",
      cover_url:
        googleBook.volumeInfo.imageLinks?.thumbnail?.replace(
          "http:",
          "https:",
        ) || null,
      description: googleBook.volumeInfo.description || null,
      page_count: googleBook.volumeInfo.pageCount || null,
      published_date: googleBook.volumeInfo.publishedDate || null,
      genre: googleBook.volumeInfo.categories?.[0] || null,
    };
    await supabase.from("books").upsert(bookData, { onConflict: "id" });

    // Remove old vote if exists
    if (myVote) {
      await supabase
        .from("club_votes")
        .delete()
        .eq("club_id", id)
        .eq("user_id", userId);
    }

    await supabase.from("club_votes").insert({
      club_id: id,
      book_id: googleBook.id,
      user_id: userId,
    });

    setMyVote(googleBook.id);
    setShowVoteSearch(false);
    setSearchQuery("");
    setSearchResults([]);
    setSuccessMsg("Vote cast!");
    setTimeout(() => setSuccessMsg(""), 2000);
    fetchClub();
  };

  const castVote = async (bookId: string) => {
    const supabase = createClient();
    if (myVote) {
      await supabase
        .from("club_votes")
        .delete()
        .eq("club_id", id)
        .eq("user_id", userId);
    }
    if (myVote !== bookId) {
      await supabase
        .from("club_votes")
        .insert({ club_id: id, book_id: bookId, user_id: userId });
      setMyVote(bookId);
    } else {
      setMyVote(null);
    }
    fetchClub();
  };

  const setCurrentBookAdmin = async (bookId: string) => {
    const supabase = createClient();
    await supabase
      .from("clubs")
      .update({ current_book_id: bookId })
      .eq("id", id);
    setSuccessMsg("Current book updated!");
    setTimeout(() => setSuccessMsg(""), 2000);
    fetchClub();
  };

  const leaveClub = async () => {
    const supabase = createClient();
    await supabase
      .from("club_members")
      .delete()
      .eq("club_id", id)
      .eq("user_id", userId);
    router.push("/dashboard/clubs");
  };

  // Group votes by book
  const votesByBook = votes.reduce(
    (acc, v) => {
      if (!acc[v.book_id]) acc[v.book_id] = { book: v.book, count: 0 };
      acc[v.book_id].count++;
      return acc;
    },
    {} as Record<string, { book: Book; count: number }>,
  );

  const sortedVotes = Object.entries(votesByBook).sort(
    (a, b) => b[1].count - a[1].count,
  );
  const totalVotes = votes.length;

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
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>📖</div>
          <p style={{ color: "#8B7355", fontSize: "14px" }}>Loading club...</p>
        </div>
      </div>
    );
  }

  if (!club)
    return (
      <div style={{ padding: "24px", color: "#8B7355" }}>Club not found.</div>
    );

  return (
    <div
      style={{ maxWidth: "480px", margin: "0 auto", paddingBottom: "100px" }}
    >
      {/* Club hero */}
      <div style={{ background: "#2C1810", padding: "24px 24px 32px" }}>
        <button
          onClick={() => router.back()}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "none",
            borderRadius: "8px",
            padding: "8px 14px",
            color: "white",
            fontSize: "13px",
            cursor: "pointer",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          ← Back
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "8px",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "#C9A84C",
              background: "rgba(201,168,76,0.15)",
              border: "1px solid rgba(201,168,76,0.2)",
              padding: "2px 8px",
              borderRadius: "20px",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {isMember ? "Member" : "Not a member"}
          </span>
          {isAdmin && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                color: "#22c55e",
                background: "rgba(34,197,94,0.1)",
                border: "1px solid rgba(34,197,94,0.2)",
                padding: "2px 8px",
                borderRadius: "20px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Admin
            </span>
          )}
        </div>

        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "24px",
            fontWeight: 700,
            color: "white",
            marginBottom: "6px",
            lineHeight: 1.2,
          }}
        >
          {club.name}
        </h1>
        {club.description && (
          <p
            style={{
              fontSize: "13px",
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.6,
            }}
          >
            {club.description}
          </p>
        )}

        {/* Members row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "16px",
          }}
        >
          <div style={{ display: "flex" }}>
            {members.slice(0, 5).map((m, i) => (
              <div
                key={m.id}
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: `hsl(${i * 60}, 40%, 40%)`,
                  border: "2px solid #2C1810",
                  marginLeft: i > 0 ? "-8px" : "0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "white",
                }}
              >
                {(m.profile?.full_name || "?").charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
          <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
            {members.length} member{members.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div style={{ padding: "24px" }}>
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

        {/* Currently reading */}
        <div
          style={{
            background: "white",
            border: "1px solid #E8DDD0",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "16px",
          }}
        >
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "16px",
              fontWeight: 600,
              color: "#2C1810",
              marginBottom: "14px",
            }}
          >
            Currently Reading
          </h2>

          {currentBook ? (
            <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
              <div
                style={{
                  width: "52px",
                  height: "72px",
                  borderRadius: "6px",
                  overflow: "hidden",
                  background: "#F5ECD7",
                  flexShrink: 0,
                }}
              >
                {currentBook.cover_url ? (
                  <img
                    src={currentBook.cover_url}
                    alt={currentBook.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                    }}
                  >
                    📚
                  </div>
                )}
              </div>
              <div>
                <h3
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#2C1810",
                    marginBottom: "4px",
                  }}
                >
                  {currentBook.title}
                </h3>
                <p style={{ fontSize: "12px", color: "#8B7355" }}>
                  {currentBook.author}
                </p>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: "13px", color: "#8B7355" }}>
              No book selected yet.
            </p>
          )}
        </div>

        {/* Vote for next book */}
        <div
          style={{
            background: "white",
            border: "1px solid #E8DDD0",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "14px",
            }}
          >
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "16px",
                fontWeight: 600,
                color: "#2C1810",
              }}
            >
              Next Month&apos;s Pick
            </h2>
            {isMember && (
              <button
                onClick={() => setShowVoteSearch(!showVoteSearch)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  background: showVoteSearch ? "#8B7355" : "#FAF7F2",
                  color: showVoteSearch ? "white" : "#2C1810",
                  border: "1px solid #E8DDD0",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {showVoteSearch ? "Cancel" : "+ Nominate"}
              </button>
            )}
          </div>

          {/* Nominate search */}
          {showVoteSearch && (
            <div style={{ marginBottom: "16px" }}>
              <div
                style={{ display: "flex", gap: "8px", marginBottom: "10px" }}
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchBooks()}
                  placeholder="Search for a book to nominate..."
                  autoFocus
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #E8DDD0",
                    fontSize: "13px",
                    color: "#2C1810",
                    background: "#FAF7F2",
                    outline: "none",
                    fontFamily: "'Inter', sans-serif",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
                  onBlur={(e) => (e.target.style.borderColor = "#E8DDD0")}
                />
                <button
                  onClick={searchBooks}
                  style={{
                    padding: "9px 14px",
                    borderRadius: "8px",
                    background: "#2C1810",
                    color: "white",
                    border: "none",
                    fontSize: "12px",
                    cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {searching ? "..." : "Go"}
                </button>
              </div>
              {searchResults.map((book: any) => (
                <div
                  key={book.id}
                  onClick={() => addVoteBook(book)}
                  style={{
                    display: "flex",
                    gap: "10px",
                    padding: "10px",
                    background: "#FAF7F2",
                    borderRadius: "8px",
                    marginBottom: "6px",
                    cursor: "pointer",
                    alignItems: "center",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "#F0E6D3")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "#FAF7F2")
                  }
                >
                  <div
                    style={{
                      width: "32px",
                      height: "44px",
                      borderRadius: "3px",
                      overflow: "hidden",
                      background: "#E8DDD0",
                      flexShrink: 0,
                    }}
                  >
                    {book.volumeInfo.imageLinks?.thumbnail ? (
                      <img
                        src={book.volumeInfo.imageLinks.thumbnail.replace(
                          "http:",
                          "https:",
                        )}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "14px",
                        }}
                      >
                        📚
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#2C1810",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {book.volumeInfo.title}
                    </p>
                    <p style={{ fontSize: "11px", color: "#8B7355" }}>
                      {book.volumeInfo.authors?.join(", ")}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#C9A84C",
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    Nominate
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Vote results */}
          {sortedVotes.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#8B7355" }}>
              No nominations yet.{" "}
              {isMember ? "Be the first to nominate a book!" : ""}
            </p>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {sortedVotes.map(([bookId, { book, count }]) => {
                const pct =
                  totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                const isMyVote = myVote === bookId;
                return (
                  <div
                    key={bookId}
                    style={{
                      background: isMyVote ? "#FAF7F2" : "white",
                      border: `1px solid ${isMyVote ? "#C9A84C" : "#E8DDD0"}`,
                      borderRadius: "10px",
                      padding: "12px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                        marginBottom: "8px",
                      }}
                    >
                      <div
                        style={{
                          width: "36px",
                          height: "50px",
                          borderRadius: "4px",
                          overflow: "hidden",
                          background: "#F5ECD7",
                          flexShrink: 0,
                        }}
                      >
                        {book?.cover_url ? (
                          <img
                            src={book.cover_url}
                            alt=""
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "14px",
                            }}
                          >
                            📚
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#2C1810",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {book?.title}
                        </p>
                        <p style={{ fontSize: "11px", color: "#8B7355" }}>
                          {book?.author}
                        </p>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p
                          style={{
                            fontSize: "16px",
                            fontWeight: 700,
                            color: "#C9A84C",
                            fontFamily: "'Playfair Display', serif",
                            lineHeight: 1,
                          }}
                        >
                          {pct}%
                        </p>
                        <p style={{ fontSize: "10px", color: "#8B7355" }}>
                          {count} vote{count !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div
                      style={{
                        height: "4px",
                        background: "#F5ECD7",
                        borderRadius: "2px",
                        overflow: "hidden",
                        marginBottom: "8px",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: isMyVote ? "#C9A84C" : "#D4C4B5",
                          borderRadius: "2px",
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", gap: "6px" }}>
                      {isMember && (
                        <button
                          onClick={() => castVote(bookId)}
                          style={{
                            padding: "5px 12px",
                            borderRadius: "6px",
                            background: isMyVote ? "#2C1810" : "#FAF7F2",
                            color: isMyVote ? "white" : "#2C1810",
                            border: `1px solid ${isMyVote ? "#2C1810" : "#E8DDD0"}`,
                            fontSize: "11px",
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "'Inter', sans-serif",
                            transition: "all 0.2s",
                          }}
                        >
                          {isMyVote ? "✓ My vote" : "Vote"}
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => setCurrentBookAdmin(bookId)}
                          style={{
                            padding: "5px 12px",
                            borderRadius: "6px",
                            background: "#FAF7F2",
                            color: "#8B7355",
                            border: "1px solid #E8DDD0",
                            fontSize: "11px",
                            cursor: "pointer",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          Set as current
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Members list */}
        <div
          style={{
            background: "white",
            border: "1px solid #E8DDD0",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "16px",
          }}
        >
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "16px",
              fontWeight: 600,
              color: "#2C1810",
              marginBottom: "14px",
            }}
          >
            Members
          </h2>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {members.map((m) => (
              <div
                key={m.id}
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "#2C1810",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#C9A84C",
                    flexShrink: 0,
                  }}
                >
                  {(m.profile?.full_name || "?").charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#2C1810",
                    }}
                  >
                    {m.profile?.full_name || "Unknown"}
                  </p>
                  {m.profile?.username && (
                    <p style={{ fontSize: "11px", color: "#8B7355" }}>
                      @{m.profile.username}
                    </p>
                  )}
                </div>
                {m.role === "admin" && (
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#C9A84C",
                      background: "rgba(201,168,76,0.1)",
                      border: "1px solid rgba(201,168,76,0.2)",
                      padding: "2px 8px",
                      borderRadius: "20px",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Admin
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Leave club */}
        {isMember && !isAdmin && (
          <button
            onClick={leaveClub}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              background: "white",
              color: "#DC2626",
              border: "1px solid #FECACA",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Leave club
          </button>
        )}
      </div>
    </div>
  );
}
