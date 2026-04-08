"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { UserBook, Note } from "@/lib/types";

export default function BookDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [userBook, setUserBook] = useState<UserBook | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagesRead, setPagesRead] = useState(0);
  const [rating, setRating] = useState(0);
  const [newNote, setNewNote] = useState("");
  const [newChapter, setNewChapter] = useState("");
  const [newHighlight, setNewHighlight] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);

  useEffect(() => {
    const fetchBook = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: ub } = await supabase
        .from("user_books")
        .select("*, book:books(*)")
        .eq("user_id", user.id)
        .eq("book_id", id)
        .single();

      if (ub) {
        setUserBook(ub);
        setPagesRead(ub.pages_read || 0);
        setRating(ub.rating || 0);
      }

      const { data: notesData } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .eq("book_id", id)
        .order("created_at", { ascending: false });

      if (notesData) setNotes(notesData);
      setLoading(false);
    };

    fetchBook();
  }, [id]);

  const saveProgress = async () => {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("user_books")
      .update({
        pages_read: pagesRead,
        rating: rating || null,
        finished_at:
          userBook?.book?.page_count && pagesRead >= userBook.book.page_count
            ? new Date().toISOString()
            : null,
      })
      .eq("id", userBook?.id);
    setSaving(false);
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    setAddingNote(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        book_id: id,
        content: newNote,
        chapter: newChapter || null,
        highlight: newHighlight || null,
      })
      .select()
      .single();

    if (data) setNotes((prev) => [data, ...prev]);
    setNewNote("");
    setNewChapter("");
    setNewHighlight("");
    setShowNoteForm(false);
    setAddingNote(false);
  };

  const deleteNote = async (noteId: string) => {
    const supabase = createClient();
    await supabase.from("notes").delete().eq("id", noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
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
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>📖</div>
          <p style={{ color: "#8B7355", fontSize: "14px" }}>Loading book...</p>
        </div>
      </div>
    );
  }

  if (!userBook) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <p style={{ color: "#8B7355" }}>Book not found in your library.</p>
        <button
          onClick={() => router.back()}
          style={{
            marginTop: "12px",
            color: "#C9A84C",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Go back
        </button>
      </div>
    );
  }

  const book = userBook.book!;
  const progress = book.page_count
    ? Math.min(Math.round((pagesRead / book.page_count) * 100), 100)
    : 0;

  return (
    <div
      style={{ maxWidth: "480px", margin: "0 auto", paddingBottom: "100px" }}
    >
      {/* Book hero */}
      <div
        style={{
          background: "#2C1810",
          padding: "24px 24px 32px",
          position: "relative",
        }}
      >
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
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          ← Back
        </button>

        <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
          <div
            style={{
              width: "80px",
              height: "115px",
              borderRadius: "8px",
              overflow: "hidden",
              background: "#3D2315",
              flexShrink: 0,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            {book.cover_url ? (
              <img
                src={book.cover_url}
                alt={book.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
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

          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "20px",
                fontWeight: 700,
                color: "white",
                marginBottom: "6px",
                lineHeight: 1.3,
              }}
            >
              {book.title}
            </h1>
            <p
              style={{
                fontSize: "13px",
                color: "rgba(255,255,255,0.6)",
                marginBottom: "12px",
              }}
            >
              {book.author}
            </p>
            <span
              style={{
                display: "inline-block",
                background: "rgba(201,168,76,0.2)",
                color: "#E8C46A",
                border: "1px solid rgba(201,168,76,0.3)",
                borderRadius: "20px",
                padding: "3px 10px",
                fontSize: "11px",
                fontWeight: 500,
                textTransform: "capitalize",
              }}
            >
              {userBook.status.replace("_", " ")}
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding: "24px" }}>
        {/* Progress tracker */}
        {userBook.status === "reading" && (
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
                marginBottom: "16px",
              }}
            >
              Reading Progress
            </h2>

            <div style={{ marginBottom: "16px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <span style={{ fontSize: "13px", color: "#8B7355" }}>
                  Pages read
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#2C1810",
                  }}
                >
                  {pagesRead} {book.page_count ? `/ ${book.page_count}` : ""}
                </span>
              </div>
              {book.page_count && (
                <div
                  style={{
                    height: "6px",
                    background: "#F5ECD7",
                    borderRadius: "3px",
                    overflow: "hidden",
                    marginBottom: "8px",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${progress}%`,
                      background: "linear-gradient(to right, #C9A84C, #E8C46A)",
                      borderRadius: "3px",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              )}
              <input
                type="range"
                min={0}
                max={book.page_count || 1000}
                value={pagesRead}
                onChange={(e) => setPagesRead(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#C9A84C" }}
              />
            </div>

            <button
              onClick={saveProgress}
              disabled={saving}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                background: saving ? "#E8DDD0" : "#2C1810",
                color: "white",
                border: "none",
                fontSize: "13px",
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {saving ? "Saving..." : "Save progress"}
            </button>
          </div>
        )}

        {/* Rating */}
        {userBook.status === "read" && (
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
                marginBottom: "16px",
              }}
            >
              Your Rating
            </h2>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "28px",
                    cursor: "pointer",
                    color: star <= rating ? "#C9A84C" : "#E8DDD0",
                    transition: "color 0.15s, transform 0.15s",
                    transform: star <= rating ? "scale(1.1)" : "scale(1)",
                  }}
                >
                  ★
                </button>
              ))}
            </div>
            <button
              onClick={saveProgress}
              disabled={saving}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                background: saving ? "#E8DDD0" : "#2C1810",
                color: "white",
                border: "none",
                fontSize: "13px",
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {saving ? "Saving..." : "Save rating"}
            </button>
          </div>
        )}

        {/* Description */}
        {book.description && (
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
                marginBottom: "12px",
              }}
            >
              About this book
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "#8B7355",
                lineHeight: 1.8,
                display: "-webkit-box",
                WebkitLineClamp: 5,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {book.description.replace(/<[^>]*>/g, "")}
            </p>
            {book.page_count && (
              <p
                style={{
                  fontSize: "12px",
                  color: "#B5A090",
                  marginTop: "12px",
                }}
              >
                {book.page_count} pages
                {book.published_date &&
                  ` · Published ${book.published_date.substring(0, 4)}`}
              </p>
            )}
          </div>
        )}

        {/* Notes section */}
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
              marginBottom: "16px",
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
              Notes & Highlights
            </h2>
            <button
              onClick={() => setShowNoteForm(!showNoteForm)}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: showNoteForm ? "#2C1810" : "#FAF7F2",
                border: "1px solid #E8DDD0",
                color: showNoteForm ? "white" : "#2C1810",
                fontSize: "18px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
                transition: "all 0.2s",
              }}
            >
              {showNoteForm ? "×" : "+"}
            </button>
          </div>

          {/* Add note form */}
          {showNoteForm && (
            <div
              style={{
                background: "#FAF7F2",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "16px",
                border: "1px solid #E8DDD0",
              }}
            >
              <input
                type="text"
                value={newChapter}
                onChange={(e) => setNewChapter(e.target.value)}
                placeholder="Chapter (optional)"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #E8DDD0",
                  fontSize: "13px",
                  color: "#2C1810",
                  background: "white",
                  outline: "none",
                  marginBottom: "8px",
                  fontFamily: "'Inter', sans-serif",
                  boxSizing: "border-box",
                }}
              />
              <input
                type="text"
                value={newHighlight}
                onChange={(e) => setNewHighlight(e.target.value)}
                placeholder="Quote or highlight (optional)"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #E8DDD0",
                  fontSize: "13px",
                  color: "#2C1810",
                  background: "white",
                  outline: "none",
                  marginBottom: "8px",
                  fontFamily: "'Inter', sans-serif",
                  boxSizing: "border-box",
                  fontStyle: "italic",
                }}
              />
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Your thoughts, notes, marginalia..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #E8DDD0",
                  fontSize: "13px",
                  color: "#2C1810",
                  background: "white",
                  outline: "none",
                  marginBottom: "10px",
                  fontFamily: "'Inter', sans-serif",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
              <button
                onClick={addNote}
                disabled={addingNote || !newNote.trim()}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  background: !newNote.trim() ? "#E8DDD0" : "#2C1810",
                  color: "white",
                  border: "none",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: !newNote.trim() ? "not-allowed" : "pointer",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {addingNote ? "Adding..." : "Add note"}
              </button>
            </div>
          )}

          {/* Notes list */}
          {notes.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "24px",
                color: "#8B7355",
                fontSize: "13px",
              }}
            >
              No notes yet. Add your first thought above.
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {notes.map((note) => (
                <div
                  key={note.id}
                  style={{
                    background: "#FAF7F2",
                    borderRadius: "10px",
                    padding: "14px",
                    borderLeft: "3px solid #C9A84C",
                  }}
                >
                  {note.chapter && (
                    <p
                      style={{
                        fontSize: "10px",
                        fontWeight: 600,
                        color: "#C9A84C",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        marginBottom: "6px",
                      }}
                    >
                      {note.chapter}
                    </p>
                  )}
                  {note.highlight && (
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#8B7355",
                        fontStyle: "italic",
                        marginBottom: "8px",
                        lineHeight: 1.6,
                        borderLeft: "2px solid #E8DDD0",
                        paddingLeft: "10px",
                      }}
                    >
                      "{note.highlight}"
                    </p>
                  )}
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#2C1810",
                      lineHeight: 1.7,
                      marginBottom: "8px",
                    }}
                  >
                    {note.content}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: "10px", color: "#B5A090" }}>
                      {new Date(note.created_at).toLocaleDateString("en", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <button
                      onClick={() => deleteNote(note.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#B5A090",
                        fontSize: "12px",
                        cursor: "pointer",
                        padding: "2px 6px",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
