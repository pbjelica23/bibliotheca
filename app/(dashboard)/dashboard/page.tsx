"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { UserBook, Profile } from "@/lib/types";

export default function DashboardPage() {
  const [totalPages, setTotalPages] = useState<number>(0);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentlyReading, setCurrentlyReading] = useState<UserBook[]>([]);
  const [wantToRead, setWantToRead] = useState<UserBook[]>([]);
  const [readCount, setReadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) setProfile(profileData);

      const { data: reading } = await supabase
        .from("user_books")
        .select("*, book:books(*)")
        .eq("user_id", user.id)
        .eq("status", "reading")
        .order("created_at", { ascending: false })
        .limit(3);

      if (reading) setCurrentlyReading(reading);

      const { data: wantRead } = await supabase
        .from("user_books")
        .select("*, book:books(*)")
        .eq("user_id", user.id)
        .eq("status", "want_to_read")
        .order("created_at", { ascending: false })
        .limit(5);

      if (wantRead) setWantToRead(wantRead);

      const { count } = await supabase
        .from("user_books")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "read");

      if (count !== null) setReadCount(count);

      // Fetch total pages and avg rating
      const { data: readBooks } = await supabase
        .from("user_books")
        .select("rating, book:books(page_count)")
        .eq("user_id", user.id)
        .eq("status", "read");

      if (readBooks) {
        const pages = readBooks.reduce(
          (sum: number, b: any) => sum + (b.book?.page_count || 0),
          0,
        );
        const rated = readBooks.filter((b: any) => b.rating);
        const avg =
          rated.length > 0
            ? rated.reduce((sum: number, b: any) => sum + b.rating, 0) /
              rated.length
            : 0;
        setTotalPages(pages);
        setAvgRating(avg);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = profile?.full_name?.split(" ")[0] || "Reader";
  const goalProgress = Math.min(
    Math.round((readCount / (profile?.reading_goal || 12)) * 100),
    100,
  );
  const daysLeft = Math.ceil(
    (new Date(new Date().getFullYear(), 11, 31).getTime() -
      new Date().getTime()) /
      (1000 * 60 * 60 * 24),
  );

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
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>📚</div>
          <p style={{ color: "#8B7355", fontSize: "14px" }}>
            Loading your library...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "480px", margin: "0 auto" }}>
      {/* Greeting header */}
      <div style={{ marginBottom: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "13px",
                color: "#8B7355",
                marginBottom: "4px",
              }}
            >
              {greeting()}, {firstName}
            </p>
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "28px",
                fontWeight: 700,
                color: "#2C1810",
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              Your Library
              <br />
              Awaits
            </h1>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                background: "#2C1810",
                color: "white",
                borderRadius: "10px",
                padding: "8px 14px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  fontFamily: "'Playfair Display', serif",
                }}
              >
                {daysLeft}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.06em",
                  opacity: 0.7,
                }}
              >
                DAYS
              </div>
            </div>
            <p style={{ fontSize: "10px", color: "#8B7355", marginTop: "4px" }}>
              left in {new Date().getFullYear()}
            </p>
          </div>
        </div>

        {/* Reading goal progress */}
        <div
          style={{
            marginTop: "16px",
            background: "white",
            border: "1px solid #E8DDD0",
            borderRadius: "12px",
            padding: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <span
              style={{ fontSize: "13px", color: "#2C1810", fontWeight: 500 }}
            >
              {new Date().getFullYear()} Reading Journey
            </span>
            <span
              style={{ fontSize: "13px", color: "#C9A84C", fontWeight: 600 }}
            >
              {readCount} / {profile?.reading_goal || 12}
            </span>
          </div>
          <div
            style={{
              height: "6px",
              background: "#F5ECD7",
              borderRadius: "3px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${goalProgress}%`,
                background: "linear-gradient(to right, #C9A84C, #E8C46A)",
                borderRadius: "3px",
                transition: "width 1s ease",
              }}
            />
          </div>
          <p style={{ fontSize: "11px", color: "#8B7355", marginTop: "6px" }}>
            {profile?.reading_goal
              ? `${Math.max(0, profile.reading_goal - readCount)} books to reach your goal`
              : "Set a reading goal in settings"}
          </p>
        </div>
      </div>

      {/* Currently reading */}
      <div style={{ marginBottom: "28px" }}>
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
              fontSize: "18px",
              fontWeight: 600,
              color: "#2C1810",
            }}
          >
            Currently Reading
          </h2>
          <Link
            href="/dashboard/library"
            style={{
              fontSize: "12px",
              color: "#C9A84C",
              textDecoration: "none",
            }}
          >
            View all
          </Link>
        </div>

        {currentlyReading.length === 0 ? (
          <div
            style={{
              background: "white",
              border: "1px dashed #E8DDD0",
              borderRadius: "12px",
              padding: "32px",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "24px", marginBottom: "8px" }}>📖</p>
            <p
              style={{
                fontSize: "13px",
                color: "#8B7355",
                marginBottom: "12px",
              }}
            >
              No books in progress
            </p>
            <Link
              href="/dashboard/library"
              style={{
                fontSize: "13px",
                color: "#C9A84C",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Add a book →
            </Link>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {currentlyReading.map((ub) => (
              <Link
                key={ub.id}
                href={`/dashboard/book/${ub.book_id}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    background: "white",
                    border: "1px solid #E8DDD0",
                    borderRadius: "12px",
                    padding: "16px",
                    display: "flex",
                    gap: "14px",
                    alignItems: "center",
                    transition: "border-color 0.2s",
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
                  {/* Book cover */}
                  <div
                    style={{
                      width: "52px",
                      height: "72px",
                      borderRadius: "6px",
                      overflow: "hidden",
                      flexShrink: 0,
                      background: "#F5ECD7",
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
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {ub.book?.title}
                    </h3>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#8B7355",
                        marginBottom: "10px",
                      }}
                    >
                      {ub.book?.author}
                    </p>

                    {ub.book?.page_count && (
                      <>
                        <div
                          style={{
                            height: "4px",
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
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Want to read shelf */}
      <div style={{ marginBottom: "28px" }}>
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
              fontSize: "18px",
              fontWeight: 600,
              color: "#2C1810",
            }}
          >
            Want to Read
          </h2>
          <Link
            href="/dashboard/library"
            style={{
              fontSize: "12px",
              color: "#C9A84C",
              textDecoration: "none",
            }}
          >
            View all
          </Link>
        </div>

        {wantToRead.length === 0 ? (
          <div
            style={{
              background: "white",
              border: "1px dashed #E8DDD0",
              borderRadius: "12px",
              padding: "32px",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "24px", marginBottom: "8px" }}>🔖</p>
            <p style={{ fontSize: "13px", color: "#8B7355" }}>
              Your reading list is empty
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              gap: "12px",
              overflowX: "auto",
              paddingBottom: "8px",
            }}
          >
            {wantToRead.map((ub) => (
              <Link
                key={ub.id}
                href={`/dashboard/book/${ub.book_id}`}
                style={{ textDecoration: "none", flexShrink: 0 }}
              >
                <div style={{ width: "90px" }}>
                  <div
                    style={{
                      width: "90px",
                      height: "130px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      background: "#F5ECD7",
                      marginBottom: "6px",
                      transition: "transform 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.transform =
                        "translateY(-2px)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.transform =
                        "translateY(0)")
                    }
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
                          fontSize: "28px",
                        }}
                      >
                        📚
                      </div>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#2C1810",
                      fontWeight: 500,
                      lineHeight: 1.3,
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {ub.book?.title}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Stats summary */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "10px",
        }}
      >
        {[
          {
            label: "Total pages",
            value: totalPages > 0 ? totalPages.toLocaleString() : "—",
            sub: "all time",
          },
          {
            label: "Avg rating",
            value: avgRating > 0 ? `${avgRating.toFixed(1)}★` : "—",
            sub: "your books",
          },
          {
            label: "Books read",
            value: readCount.toString(),
            sub: "this year",
          },
        ].map((stat) => (
          <Link
            key={stat.label}
            href="/dashboard/stats"
            style={{ textDecoration: "none" }}
          >
            <div
              style={{
                background: "white",
                border: "1px solid #E8DDD0",
                borderRadius: "12px",
                padding: "14px 12px",
                textAlign: "center",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.borderColor = "#C9A84C")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.borderColor = "#E8DDD0")
              }
            >
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#2C1810",
                  marginBottom: "2px",
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "#8B7355",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {stat.label}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
      `}</style>
    </div>
  );
}
