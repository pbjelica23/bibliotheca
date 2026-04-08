"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { UserBook, GoogleBook } from "@/lib/types";

type Tab = "read" | "reading" | "want_to_read";

const tabs: { key: Tab; label: string }[] = [
  { key: "reading", label: "Reading" },
  { key: "read", label: "Read" },
  { key: "want_to_read", label: "Want to Read" },
];

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<Tab>("reading");
  const [userBooks, setUserBooks] = useState<UserBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GoogleBook[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [addingBook, setAddingBook] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchUserBooks = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_books")
      .select("*, book:books(*)")
      .eq("user_id", user.id)
      .eq("status", activeTab)
      .order("created_at", { ascending: false });

    if (data) setUserBooks(data);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchUserBooks();
  }, [activeTab]);

  const searchBooks = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=8`,
      );
      const data = await res.json();
      setSearchResults(data.items || []);
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") searchBooks();
  };

  const addBook = async (googleBook: GoogleBook, status: Tab) => {
    setAddingBook(googleBook.id);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

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

    const { error } = await supabase.from("user_books").upsert(
      {
        user_id: user.id,
        book_id: googleBook.id,
        status,
        pages_read: 0,
      },
      { onConflict: "user_id,book_id" },
    );

    if (!error) {
      setSuccessMsg(
        `"${googleBook.volumeInfo.title}" added to ${status.replace("_", " ")}!`,
      );
      setTimeout(() => setSuccessMsg(""), 3000);
      if (status === activeTab) fetchUserBooks();
    }

    setAddingBook(null);
  };

  const removeBook = async (userBookId: string) => {
    const supabase = createClient();
    await supabase.from("user_books").delete().eq("id", userBookId);
    setUserBooks((prev) => prev.filter((b) => b.id !== userBookId));
  };

  const updateStatus = async (userBookId: string, newStatus: Tab) => {
    const supabase = createClient();
    await supabase
      .from("user_books")
      .update({ status: newStatus })
      .eq("id", userBookId);
    setUserBooks((prev) => prev.filter((b) => b.id !== userBookId));
  };

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
          My Library
        </h1>
        <button
          onClick={() => {
            setShowSearch(!showSearch);
            setSearchResults([]);
            setSearchQuery("");
          }}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: showSearch ? "#2C1810" : "white",
            border: "1px solid #E8DDD0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: showSearch ? "white" : "#2C1810",
            transition: "all 0.2s",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      </div>

      {/* Search panel */}
      {showSearch && (
        <div
          style={{
            background: "white",
            border: "1px solid #E8DDD0",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search by title, author..."
              autoFocus
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid #E8DDD0",
                fontSize: "14px",
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
              disabled={searching}
              style={{
                padding: "10px 16px",
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
              {searching ? "..." : "Search"}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                maxHeight: "400px",
                overflowY: "auto",
              }}
            >
              {searchResults.map((book) => (
                <div
                  key={book.id}
                  style={{
                    display: "flex",
                    gap: "12px",
                    padding: "12px",
                    background: "#FAF7F2",
                    borderRadius: "10px",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "56px",
                      borderRadius: "4px",
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
                        alt={book.volumeInfo.title}
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
                          fontSize: "16px",
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
                        marginBottom: "2px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {book.volumeInfo.title}
                    </p>
                    <p
                      style={{
                        fontSize: "11px",
                        color: "#8B7355",
                        marginBottom: "8px",
                      }}
                    >
                      {book.volumeInfo.authors?.join(", ")}
                    </p>
                    <div
                      style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}
                    >
                      {(["reading", "want_to_read", "read"] as Tab[]).map(
                        (status) => (
                          <button
                            key={status}
                            onClick={() => addBook(book, status)}
                            disabled={addingBook === book.id}
                            style={{
                              padding: "4px 10px",
                              borderRadius: "6px",
                              border: "1px solid #E8DDD0",
                              background: "white",
                              fontSize: "11px",
                              color: "#2C1810",
                              cursor: "pointer",
                              fontFamily: "'Inter', sans-serif",
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              (
                                e.currentTarget as HTMLElement
                              ).style.background = "#2C1810";
                              (e.currentTarget as HTMLElement).style.color =
                                "white";
                            }}
                            onMouseLeave={(e) => {
                              (
                                e.currentTarget as HTMLElement
                              ).style.background = "white";
                              (e.currentTarget as HTMLElement).style.color =
                                "#2C1810";
                            }}
                          >
                            + {status.replace("_", " ")}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          background: "white",
          border: "1px solid #E8DDD0",
          borderRadius: "10px",
          padding: "4px",
          marginBottom: "20px",
          gap: "4px",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              padding: "8px 4px",
              borderRadius: "7px",
              border: "none",
              background: activeTab === tab.key ? "#2C1810" : "transparent",
              color: activeTab === tab.key ? "white" : "#8B7355",
              fontSize: "12px",
              fontWeight: activeTab === tab.key ? 600 : 400,
              cursor: "pointer",
              transition: "all 0.2s",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Book list */}
      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "48px",
            color: "#8B7355",
            fontSize: "14px",
          }}
        >
          Loading...
        </div>
      ) : userBooks.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "48px 24px",
            background: "white",
            border: "1px dashed #E8DDD0",
            borderRadius: "16px",
          }}
        >
          <p style={{ fontSize: "32px", marginBottom: "12px" }}>📚</p>
          <p
            style={{ fontSize: "14px", color: "#8B7355", marginBottom: "16px" }}
          >
            No books in this list yet
          </p>
          <button
            onClick={() => setShowSearch(true)}
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
            Search for books
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {userBooks.map((ub) => (
            <div
              key={ub.id}
              style={{
                background: "white",
                border: "1px solid #E8DDD0",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              {/* Clickable area */}
              <Link
                href={`/dashboard/book/${ub.book_id}`}
                style={{
                  display: "flex",
                  gap: "14px",
                  padding: "16px",
                  textDecoration: "none",
                  alignItems: "center",
                }}
              >
                {/* Cover */}
                <div
                  style={{
                    width: "56px",
                    height: "80px",
                    borderRadius: "6px",
                    overflow: "hidden",
                    background: "#F5ECD7",
                    flexShrink: 0,
                  }}
                >
                  {ub.book?.cover_url ? (
                    <img
                      src={ub.book.cover_url}
                      alt={ub.book.title}
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

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "#2C1810",
                      marginBottom: "2px",
                      lineHeight: 1.3,
                    }}
                  >
                    {ub.book?.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#8B7355",
                      marginBottom: "8px",
                    }}
                  >
                    {ub.book?.author}
                  </p>
                  {ub.status === "reading" && ub.book?.page_count && (
                    <>
                      <div
                        style={{
                          height: "3px",
                          background: "#F5ECD7",
                          borderRadius: "2px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${Math.round((ub.pages_read / ub.book.page_count) * 100)}%`,
                            background: "#C9A84C",
                            borderRadius: "2px",
                          }}
                        />
                      </div>
                      <p
                        style={{
                          fontSize: "11px",
                          color: "#8B7355",
                          marginTop: "4px",
                        }}
                      >
                        {ub.pages_read} / {ub.book.page_count} pages
                      </p>
                    </>
                  )}
                  {ub.status === "read" && ub.rating && (
                    <span style={{ fontSize: "13px", color: "#C9A84C" }}>
                      {"★".repeat(ub.rating)}
                      {"☆".repeat(5 - ub.rating)}
                    </span>
                  )}
                </div>

                <div style={{ color: "#D4C4B5", flexShrink: 0 }}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </Link>

              {/* Action buttons */}
              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  padding: "10px 16px",
                  borderTop: "1px solid #F5ECD7",
                  flexWrap: "wrap",
                }}
              >
                {tabs
                  .filter((t) => t.key !== activeTab)
                  .map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => updateStatus(ub.id, tab.key)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "6px",
                        border: "1px solid #E8DDD0",
                        background: "#FAF7F2",
                        fontSize: "11px",
                        color: "#8B7355",
                        cursor: "pointer",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Move to {tab.label}
                    </button>
                  ))}
                <button
                  onClick={() => removeBook(ub.id)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: "1px solid #FECACA",
                    background: "#FEF2F2",
                    fontSize: "11px",
                    color: "#DC2626",
                    cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
