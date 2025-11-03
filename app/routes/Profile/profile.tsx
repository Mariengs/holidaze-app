import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getProfile, type UserProfile } from "../../api/auth";
import {
  getUserBookings,
  deleteBooking,
  type Booking,
} from "../../api/bookings";
import { getUserVenues, type Venue } from "../../api/venues";

import VenueEditorModal from "../../components/VenueEditorModal";
import ConfirmDeleteVenueModal from "../../components/ConfirmDeleteVenueModal";
import ProfileMediaModal from "../../components/ProfileMediaModal";

import VenueCard from "../../components/VenueCard";
import BookingCard from "../../components/BookingCard";

import styles from "./profile.module.css";

export default function ProfilePage() {
  const navigate = useNavigate();

  // auth / profile
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // data
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);

  // loading / error
  const [loadingProfileData, setLoadingProfileData] = useState(true);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- MODAL STATE ---
  const [showVenueEditor, setShowVenueEditor] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | undefined>(
    undefined
  );

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [venueToDelete, setVenueToDelete] = useState<Venue | null>(null);

  const [showProfileMediaModal, setShowProfileMediaModal] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedProfile = getProfile();

    if (!storedProfile) {
      navigate("/");
      return;
    }

    setProfile(storedProfile);

    async function fetchData() {
      try {
        if (!storedProfile?.name) {
          throw new Error("Could not find profile name.");
        }

        const bookingsResult = await getUserBookings(storedProfile.name);
        setBookings(bookingsResult);

        if (storedProfile.venueManager) {
          setLoadingVenues(true);
          const venuesResult = await getUserVenues(storedProfile.name);
          setVenues(venuesResult || []);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoadingProfileData(false);
        setLoadingVenues(false);
      }
    }

    fetchData();
  }, [navigate]);

  async function handleCancelBooking(id: string) {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
      await deleteBooking(id);
      setBookings((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      alert((err as Error).message);
    }
  }

  function handleVenueSaved(savedVenue: Venue) {
    setVenues((prev) => {
      const exists = prev.find((v) => v.id === savedVenue.id);
      if (exists) {
        return prev.map((v) => (v.id === savedVenue.id ? savedVenue : v));
      }
      return [savedVenue, ...prev];
    });

    setShowVenueEditor(false);
    setEditingVenue(undefined);
  }

  function handleVenueDeleted(deletedVenueId: string) {
    setVenues((prev) => prev.filter((v) => v.id !== deletedVenueId));
    setShowDeleteModal(false);
    setVenueToDelete(null);
  }

  function handleProfileMediaSaved(partial: Partial<UserProfile>) {
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            avatar: partial.avatar ?? prev.avatar,
            banner: partial.banner ?? prev.banner,
          }
        : prev
    );
  }

  // --- early UI states ---
  if (loadingProfileData) {
    return (
      <section className={styles.centerMessage}>
        <p>Loading profile…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.centerError}>
        <p>{error}</p>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className={styles.centerMessage}>
        <h2>You are not logged in.</h2>
        <p>Please log in to view your profile.</p>
      </section>
    );
  }

  // --- main render ---
  return (
    <>
      <section className={styles.wrapper}>
        {/* Banner */}
        {profile.banner?.url && (
          <div
            className={styles.banner}
            style={{ backgroundImage: `url(${profile.banner.url})` }}
            aria-label={profile.banner.alt || "Profile banner"}
          />
        )}

        {/* Profile header */}
        <h1 className={styles.title}>My Profile</h1>

        <div className={styles.profileRow}>
          <img
            src={profile.avatar?.url || "https://via.placeholder.com/100"}
            alt={profile.avatar?.alt || profile.name}
            className={styles.avatar}
          />

          <div>
            <h2 className={styles.name}>{profile.name}</h2>
            <p className={styles.email}>{profile.email}</p>

            {profile.venueManager ? (
              <p className={styles.roleManager}>Venue Manager</p>
            ) : (
              <p className={styles.roleCustomer}>Customer</p>
            )}
          </div>
        </div>

        {/* actions */}
        <div className={styles.actionRow}>
          <button
            onClick={() => setShowProfileMediaModal(true)}
            className={`${styles.btn} ${styles.btnEditMedia}`}
          >
            Edit profile
          </button>
        </div>

        <hr className={styles.divider} />

        {/* My Venues */}
        {profile.venueManager && (
          <section style={{ marginBottom: "2rem" }}>
            <div className={styles.sectionHeadingRow}>
              <h3 className={styles.sectionHeading}>My Venues</h3>

              <button
                className={styles.btnNewVenue}
                onClick={() => {
                  setEditingVenue(undefined);
                  setShowVenueEditor(true);
                }}
              >
                + New venue
              </button>
            </div>

            {loadingVenues ? (
              <p className={styles.muted}>Loading your venues…</p>
            ) : venues.length === 0 ? (
              <p className={styles.muted}>
                You have not listed any venues yet.
              </p>
            ) : (
              <ul className={styles.venueList}>
                {venues.map((v) => (
                  <VenueCard
                    key={v.id}
                    venue={v}
                    onEdit={(venue) => {
                      setEditingVenue(venue);
                      setShowVenueEditor(true);
                    }}
                    onDelete={(venue) => {
                      setVenueToDelete(venue);
                      setShowDeleteModal(true);
                    }}
                  />
                ))}
              </ul>
            )}
          </section>
        )}

        {/* My Bookings */}
        <section>
          <div className={styles.sectionHeadingRow}>
            <h3 className={styles.sectionHeading}>My Bookings</h3>
          </div>

          {bookings.length === 0 ? (
            <p className={styles.muted}>You have no bookings yet.</p>
          ) : (
            <ul className={styles.bookingList}>
              {bookings.map((b) => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  onCancel={handleCancelBooking}
                />
              ))}
            </ul>
          )}
        </section>
      </section>

      {/* Modals */}
      <VenueEditorModal
        isOpen={showVenueEditor}
        initialVenue={editingVenue}
        onClose={() => {
          setShowVenueEditor(false);
          setEditingVenue(undefined);
        }}
        onSaved={handleVenueSaved}
      />

      <ConfirmDeleteVenueModal
        isOpen={showDeleteModal}
        venueId={venueToDelete?.id || null}
        venueName={venueToDelete?.name}
        onClose={() => {
          setShowDeleteModal(false);
          setVenueToDelete(null);
        }}
        onDeleted={handleVenueDeleted}
      />

      <ProfileMediaModal
        isOpen={showProfileMediaModal}
        onClose={() => setShowProfileMediaModal(false)}
        onSaved={handleProfileMediaSaved}
      />
    </>
  );
}
