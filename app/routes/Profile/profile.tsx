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
import ConfirmCancelBookingModal from "../../components/ConfirmCancelBookingModal";
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

  // MODAL STATE
  const [showVenueEditor, setShowVenueEditor] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | undefined>(
    undefined
  );

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [venueToDelete, setVenueToDelete] = useState<Venue | null>(null);

  const [showProfileMediaModal, setShowProfileMediaModal] = useState(false);

  // Confirm cancel booking modal
  const [showCancelBookingModal, setShowCancelBookingModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);

  // Mobile collapsible sections
  const [isVenuesOpen, setIsVenuesOpen] = useState(true);
  const [isBookingsOpen, setIsBookingsOpen] = useState(true);

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

  function handleCancelBookingClick(booking: Booking) {
    setBookingToCancel(booking);
    setShowCancelBookingModal(true);
  }

  function handleConfirmCancelBooking(id: string) {
    setBookings((prev) => prev.filter((b) => b.id !== id));
    setShowCancelBookingModal(false);
    setBookingToCancel(null);
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
    if (!editingVenue) {
      navigate(`/venues/${savedVenue.id}`);
    }
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

  //  early UI states
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

  //  main render
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
            {/* New venue button - above section */}
            <div className={styles.newVenueButtonRow}>
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

            <div className={styles.sectionHeadingRow}>
              {/* Desktop title */}
              <h3 className={`${styles.sectionHeading} ${styles.desktopOnly}`}>
                My Venues
              </h3>

              {/* Mobile collapsible toggle */}
              <button
                className={styles.mobileToggle}
                onClick={() => setIsVenuesOpen(!isVenuesOpen)}
              >
                <span className={styles.mobileToggleText}>
                  My Venues
                  {venues.length > 0 && (
                    <span className={styles.countBadge}>{venues.length}</span>
                  )}
                </span>
                <span
                  className={`${styles.mobileToggleIcon} ${isVenuesOpen ? styles.mobileToggleIconOpen : ""}`}
                >
                  ▼
                </span>
              </button>
            </div>

            <div
              className={`${styles.collapsibleContent} ${isVenuesOpen ? styles.collapsibleContentOpen : ""}`}
            >
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
            </div>
          </section>
        )}

        {/* My Bookings */}
        <section>
          <div className={styles.sectionHeadingRow}>
            {/* Desktop title */}
            <h3 className={`${styles.sectionHeading} ${styles.desktopOnly}`}>
              My Bookings
            </h3>

            {/* Mobile collapsible toggle */}
            <button
              className={styles.mobileToggle}
              onClick={() => setIsBookingsOpen(!isBookingsOpen)}
            >
              <span className={styles.mobileToggleText}>
                My Bookings
                {bookings.length > 0 && (
                  <span className={styles.countBadge}>{bookings.length}</span>
                )}
              </span>
              <span
                className={`${styles.mobileToggleIcon} ${isBookingsOpen ? styles.mobileToggleIconOpen : ""}`}
              >
                ▼
              </span>
            </button>
          </div>

          <div
            className={`${styles.collapsibleContent} ${isBookingsOpen ? styles.collapsibleContentOpen : ""}`}
          >
            {bookings.length === 0 ? (
              <p className={styles.muted}>You have no bookings yet.</p>
            ) : (
              <ul className={styles.bookingList}>
                {bookings.map((b) => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    onCancel={() => handleCancelBookingClick(b)}
                  />
                ))}
              </ul>
            )}
          </div>
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

      {/* Cancel Booking Modal */}
      <ConfirmCancelBookingModal
        isOpen={showCancelBookingModal}
        bookingId={bookingToCancel?.id || null}
        venueName={bookingToCancel?.venue?.name}
        onClose={() => {
          setShowCancelBookingModal(false);
          setBookingToCancel(null);
        }}
        onCancelled={handleConfirmCancelBooking}
      />

      <ProfileMediaModal
        isOpen={showProfileMediaModal}
        onClose={() => setShowProfileMediaModal(false)}
        onSaved={handleProfileMediaSaved}
      />
    </>
  );
}
