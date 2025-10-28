import { useEffect, useState } from "react";
import { getProfile, clearAuth, type UserProfile } from "../../api/auth";
import {
  getUserBookings,
  deleteBooking,
  type Booking,
} from "../../api/bookings";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedProfile = getProfile();

    if (!storedProfile) {
      navigate("/");
      return;
    }

    setProfile(storedProfile);

    async function fetchBookings() {
      try {
        // ✅ Beskyttelse mot null
        if (!storedProfile?.name) {
          throw new Error("Could not find profile name.");
        }

        const data = await getUserBookings(storedProfile.name);
        setBookings(data);
      } catch (err) {
        console.error("❌ Error fetching bookings:", err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchBookings();
  }, [navigate]);

  function handleLogout() {
    clearAuth();
    navigate("/"); // gå tilbake til home etter log out
  }

  async function handleCancelBooking(id: string) {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
      await deleteBooking(id);
      setBookings((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      alert((err as Error).message);
    }
  }

  if (loading) {
    return (
      <section style={{ padding: "2rem", textAlign: "center" }}>
        <p>Loading profile…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section style={{ padding: "2rem", textAlign: "center", color: "red" }}>
        <p>{error}</p>
      </section>
    );
  }

  if (!profile) {
    return (
      <section style={{ padding: "2rem", textAlign: "center" }}>
        <h2>You are not logged in.</h2>
        <p>Please log in to view your profile.</p>
      </section>
    );
  }

  return (
    <section
      style={{
        maxWidth: "700px",
        margin: "2rem auto",
        padding: "2rem",
        backgroundColor: "#fff",
        borderRadius: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "1rem" }}>
        My Profile
      </h1>

      {/* Brukerinfo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <img
          src={profile.avatar?.url || "https://via.placeholder.com/100"}
          alt={profile.avatar?.alt || profile.name}
          style={{
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            objectFit: "cover",
            backgroundColor: "#f0f0f0",
          }}
        />

        <div>
          <h2 style={{ margin: 0 }}>{profile.name}</h2>
          <p style={{ margin: 0, color: "#666" }}>{profile.email}</p>
          {profile.venueManager && (
            <p style={{ color: "#2563eb", fontWeight: 500 }}>Venue Manager</p>
          )}
        </div>
      </div>

      {/* Log out knapp */}
      <button
        onClick={handleLogout}
        style={{
          backgroundColor: "#111827",
          color: "white",
          padding: "0.6rem 1.2rem",
          border: "none",
          borderRadius: "8px",
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        Log out
      </button>

      <hr
        style={{
          margin: "2rem 0",
          border: "none",
          borderTop: "1px solid #eee",
        }}
      />

      {/* My Venues */}
      {profile.venueManager && (
        <div>
          <h3 style={{ marginBottom: "0.5rem" }}>My Venues</h3>
          <p style={{ color: "#666" }}>
            You can list, edit, or delete your venues here (coming soon).
          </p>
        </div>
      )}

      {/* My Bookings */}
      <div style={{ marginTop: "1.5rem" }}>
        <h3 style={{ marginBottom: "0.5rem" }}>My Bookings</h3>

        {bookings.length === 0 ? (
          <p style={{ color: "#666" }}>You have no bookings yet.</p>
        ) : (
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              display: "grid",
              gap: "1rem",
            }}
          >
            {bookings.map((b) => (
              <li
                key={b.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "1rem",
                  display: "flex",
                  gap: "1rem",
                  alignItems: "center",
                  backgroundColor: "#fafafa",
                }}
              >
                {b.venue?.media?.[0]?.url && (
                  <img
                    src={b.venue.media[0].url}
                    alt={b.venue.media[0].alt || b.venue.name}
                    style={{
                      width: "100px",
                      height: "80px",
                      objectFit: "cover",
                      borderRadius: "6px",
                    }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: "0 0 0.25rem 0" }}>{b.venue?.name}</h4>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "#555" }}>
                    {b.dateFrom.split("T")[0]} → {b.dateTo.split("T")[0]}
                  </p>
                  <p
                    style={{
                      margin: "0.3rem 0 0 0",
                      fontSize: "0.9rem",
                      color: "#333",
                    }}
                  >
                    Guests: {b.guests}
                  </p>
                </div>
                <button
                  onClick={() => handleCancelBooking(b.id)}
                  style={{
                    backgroundColor: "#dc2626",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "0.4rem 0.8rem",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
