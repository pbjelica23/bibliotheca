"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

interface Stats {
  totalBooks: number;
  totalRead: number;
  totalReading: number;
  totalWantToRead: number;
  totalPages: number;
  avgRating: number;
  readingGoal: number;
  booksPerMonth: { month: string; books: number }[];
  genreBreakdown: { name: string; value: number }[];
  recentlyFinished: {
    id: string;
    book: { title: string; author: string; cover_url: string | null };
    finished_at: string;
    rating: number | null;
  }[];
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const GENRE_COLORS = [
  "#C9A84C",
  "#2C1810",
  "#8B7355",
  "#E8C46A",
  "#D4A574",
  "#A0856B",
];

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userBooks } = await supabase
        .from("user_books")
        .select("*, book:books(*)")
        .eq("user_id", user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("reading_goal")
        .eq("id", user.id)
        .single();

      if (!userBooks) return;

      const read = userBooks.filter((b) => b.status === "read");
      const reading = userBooks.filter((b) => b.status === "reading");
      const wantToRead = userBooks.filter((b) => b.status === "want_to_read");

      // Total pages
      const totalPages = read.reduce(
        (sum, b) => sum + (b.book?.page_count || 0),
        0,
      );

      // Avg rating
      const rated = read.filter((b) => b.rating);
      const avgRating =
        rated.length > 0
          ? rated.reduce((sum, b) => sum + b.rating, 0) / rated.length
          : 0;

      // Books per month (current year)
      const currentYear = new Date().getFullYear();
      const booksPerMonth = MONTHS.map((month, i) => ({
        month,
        books: read.filter((b) => {
          if (!b.finished_at) return false;
          const d = new Date(b.finished_at);
          return d.getFullYear() === currentYear && d.getMonth() === i;
        }).length,
      }));

      // Genre breakdown
      const genreMap: Record<string, number> = {};
      userBooks.forEach((b) => {
        const genre = b.book?.genre || "Unknown";
        genreMap[genre] = (genreMap[genre] || 0) + 1;
      });
      const genreBreakdown = Object.entries(genreMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

      // Recently finished
      const recentlyFinished = read
        .filter((b) => b.finished_at)
        .sort(
          (a, b) =>
            new Date(b.finished_at).getTime() -
            new Date(a.finished_at).getTime(),
        )
        .slice(0, 5);

      setStats({
        totalBooks: userBooks.length,
        totalRead: read.length,
        totalReading: reading.length,
        totalWantToRead: wantToRead.length,
        totalPages,
        avgRating,
        readingGoal: profile?.reading_goal || 12,
        booksPerMonth,
        genreBreakdown,
        recentlyFinished,
      });
      setLoading(false);
    };

    fetchStats();
  }, []);

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
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>📊</div>
          <p style={{ color: "#8B7355", fontSize: "14px" }}>
            Loading your stats...
          </p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const goalPct = Math.min(
    Math.round((stats.totalRead / stats.readingGoal) * 100),
    100,
  );

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
          marginBottom: "24px",
        }}
      >
        Your Stats
      </h1>

      {/* Top metric cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
          marginBottom: "24px",
        }}
      >
        {[
          { label: "Books read", value: stats.totalRead, icon: "📚" },
          {
            label: "Pages read",
            value: stats.totalPages.toLocaleString(),
            icon: "📄",
          },
          { label: "Currently reading", value: stats.totalReading, icon: "📖" },
          { label: "Want to read", value: stats.totalWantToRead, icon: "🔖" },
        ].map((m) => (
          <div
            key={m.label}
            style={{
              background: "white",
              border: "1px solid #E8DDD0",
              borderRadius: "12px",
              padding: "18px",
            }}
          >
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>
              {m.icon}
            </div>
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "24px",
                fontWeight: 700,
                color: "#2C1810",
                marginBottom: "4px",
              }}
            >
              {m.value}
            </div>
            <div style={{ fontSize: "12px", color: "#8B7355" }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Reading goal */}
      <div
        style={{
          background: "white",
          border: "1px solid #E8DDD0",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
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
            {new Date().getFullYear()} Reading Goal
          </h2>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#C9A84C" }}>
            {stats.totalRead} / {stats.readingGoal}
          </span>
        </div>
        <div
          style={{
            height: "8px",
            background: "#F5ECD7",
            borderRadius: "4px",
            overflow: "hidden",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${goalPct}%`,
              background: "linear-gradient(to right, #C9A84C, #E8C46A)",
              borderRadius: "4px",
              transition: "width 1s ease",
            }}
          />
        </div>
        <p style={{ fontSize: "12px", color: "#8B7355" }}>
          {goalPct}% complete —{" "}
          {stats.totalRead >= stats.readingGoal
            ? "🎉 Goal achieved!"
            : `${stats.readingGoal - stats.totalRead} books to go`}
        </p>
      </div>

      {/* Books per month chart */}
      <div
        style={{
          background: "white",
          border: "1px solid #E8DDD0",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "24px",
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
          Books read per month
        </h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={stats.booksPerMonth}
            margin={{ top: 0, right: 0, left: -24, bottom: 0 }}
          >
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#8B7355", fontFamily: "Inter" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#8B7355", fontFamily: "Inter" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: "white",
                border: "1px solid #E8DDD0",
                borderRadius: "8px",
                fontSize: "12px",
                fontFamily: "Inter",
                color: "#2C1810",
              }}
              cursor={{ fill: "#F5ECD7" }}
            />
            <Bar dataKey="books" radius={[4, 4, 0, 0]}>
              {stats.booksPerMonth.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.books > 0 ? "#C9A84C" : "#F5ECD7"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Genre breakdown */}
      {stats.genreBreakdown.length > 0 && (
        <div
          style={{
            background: "white",
            border: "1px solid #E8DDD0",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "24px",
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
            Genres
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={stats.genreBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {stats.genreBreakdown.map((_, index) => (
                  <Cell
                    key={index}
                    fill={GENRE_COLORS[index % GENRE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Legend
                formatter={(value) => (
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#8B7355",
                      fontFamily: "Inter",
                    }}
                  >
                    {value}
                  </span>
                )}
              />
              <Tooltip
                contentStyle={{
                  background: "white",
                  border: "1px solid #E8DDD0",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontFamily: "Inter",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Avg rating */}
      {stats.avgRating > 0 && (
        <div
          style={{
            background: "white",
            border: "1px solid #E8DDD0",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "40px",
                fontWeight: 700,
                color: "#C9A84C",
                lineHeight: 1,
              }}
            >
              {stats.avgRating.toFixed(1)}
            </div>
            <div
              style={{ fontSize: "12px", color: "#8B7355", marginTop: "4px" }}
            >
              avg rating
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: "2px", marginBottom: "8px" }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  style={{
                    fontSize: "20px",
                    color:
                      star <= Math.round(stats.avgRating)
                        ? "#C9A84C"
                        : "#E8DDD0",
                  }}
                >
                  ★
                </span>
              ))}
            </div>
            <p style={{ fontSize: "12px", color: "#8B7355" }}>
              Based on {stats.recentlyFinished.filter((b) => b.rating).length}{" "}
              rated books
            </p>
          </div>
        </div>
      )}

      {/* Recently finished */}
      {stats.recentlyFinished.length > 0 && (
        <div
          style={{
            background: "white",
            border: "1px solid #E8DDD0",
            borderRadius: "16px",
            padding: "20px",
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
            Recently finished
          </h2>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {stats.recentlyFinished.map((ub) => (
              <div
                key={ub.id}
                style={{ display: "flex", gap: "12px", alignItems: "center" }}
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
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {ub.book?.title}
                  </p>
                  <p style={{ fontSize: "11px", color: "#8B7355" }}>
                    {ub.book?.author}
                  </p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  {ub.rating && (
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#C9A84C",
                        fontWeight: 600,
                      }}
                    >
                      {"★".repeat(ub.rating)}
                    </div>
                  )}
                  <div style={{ fontSize: "10px", color: "#8B7355" }}>
                    {new Date(ub.finished_at).toLocaleDateString("en", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
