import { useState, useEffect } from "react";
import {
  createVenue,
  updateVenue,
  type Venue,
  type VenuePayload,
} from "../api/venues";
import { useToast } from "./context/ToastContext";
import styles from "../styles/venueEditorModal.module.css";

interface VenueEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (venue: Venue) => void;
  initialVenue?: Venue;
}

type MediaItem = { url: string };

type Meta = {
  wifi: boolean;
  parking: boolean;
  breakfast: boolean;
  pets: boolean;
};

export default function VenueEditorModal({
  isOpen,
  onClose,
  onSaved,
  initialVenue,
}: VenueEditorModalProps) {
  const isEditing = !!initialVenue;
  const { showToast } = useToast();

  // Basic fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  // numeric fields as strings so inputs can be empty
  const [price, setPrice] = useState<string>("");
  const [maxGuests, setMaxGuests] = useState<string>("1");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [mediaList, setMediaList] = useState<MediaItem[]>([{ url: "" }]);

  // Amenities + rating
  const [meta, setMeta] = useState<Meta>({
    wifi: false,
    parking: false,
    breakfast: false,
    pets: false,
  });
  const [rating, setRating] = useState<string>("0");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Field errors for numeric fields
  const [priceError, setPriceError] = useState<string | null>(null);
  const [maxGuestsError, setMaxGuestsError] = useState<string | null>(null);
  const [ratingError, setRatingError] = useState<string | null>(null);

  // Clickable stars
  function EditableStars({
    value = 0,
    onChange,
  }: {
    value?: number;
    onChange: (v: number) => void;
  }) {
    const v = Math.max(0, Math.min(5, Math.round(value ?? 0)));
    return (
      <div role="radiogroup" aria-label="Rating" className={styles.starsGroup}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={v === n}
            onClick={() => onChange(n)}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                onChange(n);
              }
            }}
            onTouchStart={() => onChange(n)}
            className={`${styles.btn} ${styles.starBtn} ${v >= n ? styles.starBtnActive : ""}`}
            title={`${n} star${n > 1 ? "s" : ""}`}
          >
            {v >= n ? "★" : "☆"}
          </button>
        ))}
      </div>
    );
  }

  // Mobile: stars in the background + invisible range + clickable hit areas
  function StarSlider({
    value = 0,
    onChange,
  }: {
    value?: number;
    onChange: (v: number) => void;
  }) {
    const v = Math.max(0, Math.min(5, Math.round(value ?? 0)));

    return (
      <div className={styles.starSlider} aria-label="Rating (mobile)">
        {/* Visible stars */}
        <div className={styles.starRow} aria-hidden="true">
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              className={`${styles.starVisual} ${v >= n ? styles.starOn : styles.starOff}`}
            >
              {v >= n ? "★" : "☆"}
            </span>
          ))}
        </div>

        {/* Focusable and accessible control */}
        <input
          type="range"
          min={0}
          max={5}
          step={1}
          value={v}
          onChange={(e) => onChange(Number(e.target.value))}
          className={styles.starRange}
          aria-label="Drag to set rating 0–5"
          aria-valuemin={0}
          aria-valuemax={5}
          aria-valuenow={v}
        />

        {/* Star hit */}
        <div className={styles.starHitRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              role="presentation"
              className={styles.starHit}
              aria-hidden="true"
              tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onChange(n)}
              onTouchStart={() => onChange(n)}
            />
          ))}
        </div>

        <span className={styles.starValue} aria-hidden>
          {v}/5
        </span>
      </div>
    );
  }

  // Validation helpers

  function validatePrice(value: string): boolean {
    if (value.trim() === "") {
      setPriceError("Price is required.");
      return false;
    }
    const num = Number(value);
    if (Number.isNaN(num)) {
      setPriceError("Price must be a number.");
      return false;
    }
    if (num < 0) {
      setPriceError("Price cannot be negative.");
      return false;
    }
    setPriceError(null);
    return true;
  }

  function validateMaxGuests(value: string): boolean {
    if (value.trim() === "") {
      setMaxGuestsError("Max guests is required.");
      return false;
    }
    const num = Number(value);
    if (Number.isNaN(num) || !Number.isFinite(num)) {
      setMaxGuestsError("Max guests must be a number.");
      return false;
    }
    if (!Number.isInteger(num)) {
      setMaxGuestsError("Max guests must be a whole number.");
      return false;
    }
    if (num < 1) {
      setMaxGuestsError("There must be at least 1 guest.");
      return false;
    }
    setMaxGuestsError(null);
    return true;
  }

  function validateRating(value: string): boolean {
    if (value.trim() === "") {
      setRatingError("Rating is required.");
      return false;
    }
    const num = Number(value);
    if (Number.isNaN(num)) {
      setRatingError("Rating must be a number.");
      return false;
    }
    if (num < 0 || num > 5) {
      setRatingError("Rating must be between 0 and 5.");
      return false;
    }
    setRatingError(null);
    return true;
  }

  useEffect(() => {
    if (!isOpen) return;

    if (initialVenue) {
      setName(initialVenue.name || "");
      setDescription(initialVenue.description || "");
      setPrice(
        typeof initialVenue.price === "number" ? String(initialVenue.price) : ""
      );
      setMaxGuests(
        typeof initialVenue.maxGuests === "number"
          ? String(initialVenue.maxGuests)
          : "1"
      );
      setCity(initialVenue.location?.city || "");
      setCountry(initialVenue.location?.country || "");
      setMediaList(
        initialVenue.media?.length
          ? initialVenue.media.map((m) => ({ url: m.url || "" }))
          : [{ url: "" }]
      );
      setMeta({
        wifi: !!initialVenue.meta?.wifi,
        parking: !!initialVenue.meta?.parking,
        breakfast: !!initialVenue.meta?.breakfast,
        pets: !!initialVenue.meta?.pets,
      });
      setRating(
        typeof initialVenue.rating === "number"
          ? String(initialVenue.rating)
          : "0"
      );
    } else {
      setName("");
      setDescription("");
      setPrice("");
      setMaxGuests("1");
      setCity("");
      setCountry("");
      setMediaList([{ url: "" }]);
      setMeta({ wifi: false, parking: false, breakfast: false, pets: false });
      setRating("0");
    }

    setError(null);
    setSaving(false);
    setPriceError(null);
    setMaxGuestsError(null);
    setRatingError(null);
  }, [isOpen, initialVenue]);

  if (!isOpen) return null;

  function handleMediaChange(index: number, value: string) {
    setMediaList((prev) => {
      const copy = [...prev];
      copy[index] = { url: value };
      return copy;
    });
  }
  function handleAddMedia() {
    setMediaList((prev) => [...prev, { url: "" }]);
  }
  function handleRemoveMedia(index: number) {
    setMediaList((prev) => prev.filter((_, i) => i !== index));
  }
  function toggleMeta(key: keyof Meta) {
    setMeta((m) => ({ ...m, [key]: !m[key] }));
  }

  function handleCancel() {
    const numericPrice = Number(price || 0);
    const numericMaxGuests = Number(maxGuests || 0);
    const numericRating = Number(rating || 0);

    const hasChanges =
      name.trim() !== "" ||
      description.trim() !== "" ||
      numericPrice > 0 ||
      numericMaxGuests > 1 ||
      city.trim() !== "" ||
      country.trim() !== "" ||
      mediaList.some((m) => m.url.trim() !== "") ||
      meta.wifi ||
      meta.parking ||
      meta.breakfast ||
      meta.pets ||
      numericRating > 0;

    if (hasChanges) {
      if (
        confirm(
          "Are you sure you want to cancel? Any unsaved changes will be lost."
        )
      ) {
        onClose();
      }
    } else {
      onClose();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // validate numbers before saving
    const priceOk = validatePrice(price);
    const guestsOk = validateMaxGuests(maxGuests);
    const ratingOk = validateRating(rating);

    if (!priceOk || !guestsOk || !ratingOk) {
      return;
    }

    setSaving(true);

    try {
      const cleanedMedia = mediaList
        .map((m) => m.url.trim())
        .filter((url) => url !== "")
        .map((url) => ({ url, alt: name || "venue image" }));

      const numericPrice = Number(price || 0);
      const numericMaxGuests = Number(maxGuests || 0);
      const numericRating = Math.max(0, Math.min(5, Number(rating || 0)));

      const body: VenuePayload = {
        name,
        description,
        price: numericPrice,
        maxGuests: numericMaxGuests,
        media: cleanedMedia,
        rating: numericRating,
        meta,
        location:
          city || country
            ? { city: city || undefined, country: country || undefined }
            : undefined,
      };

      const saved =
        isEditing && initialVenue?.id
          ? await updateVenue(initialVenue.id, body)
          : await createVenue(body);

      onSaved(saved);

      showToast({
        message: isEditing
          ? "Venue updated successfully!"
          : "Venue created successfully!",
        type: "success",
      });

      onClose();
    } catch (err) {
      const msg = (err as Error).message || "Could not save venue";
      setError(msg);
      showToast({ message: msg, type: "error" });
    } finally {
      setSaving(false);
    }
  }

  const ratingNumber = rating === "" ? 0 : Number(rating || 0);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.heading}>
          {isEditing ? "Edit venue" : "New venue"}
        </h2>

        <form onSubmit={handleSubmit} className={styles.formContents}>
          <div className={styles.formBody}>
            <div className={styles.formBodyInner}>
              <label className={styles.formGroup}>
                Name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={styles.input}
                />
              </label>

              <label className={styles.formGroup}>
                Description
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className={styles.textarea}
                />
              </label>

              <div className={styles.row}>
                <label className={`${styles.formGroup} ${styles.col}`}>
                  Price / night
                  <input
                    type="number"
                    min={0}
                    value={price}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPrice(val);
                      if (val !== "") {
                        validatePrice(val);
                      } else {
                        setPriceError(null);
                      }
                    }}
                    required
                    className={styles.input}
                  />
                  {priceError && (
                    <span className={styles.error}>{priceError}</span>
                  )}
                </label>

                <label className={`${styles.formGroup} ${styles.col}`}>
                  Max guests
                  <input
                    type="number"
                    min={1}
                    value={maxGuests}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMaxGuests(val);
                      if (val !== "") {
                        validateMaxGuests(val);
                      } else {
                        setMaxGuestsError(null);
                      }
                    }}
                    required
                    className={styles.input}
                  />
                  {maxGuestsError && (
                    <span className={styles.error}>{maxGuestsError}</span>
                  )}
                </label>
              </div>

              <div className={styles.row}>
                <label className={`${styles.formGroup} ${styles.col}`}>
                  City
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={styles.input}
                  />
                </label>

                <label className={`${styles.formGroup} ${styles.col}`}>
                  Country
                  <input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className={styles.input}
                  />
                </label>
              </div>

              {/* AMENITIES */}
              <fieldset className={styles.formGroup}>
                <legend className={styles.legend}>Amenities</legend>
                <div className={styles.row}>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={meta.wifi}
                      onChange={() => toggleMeta("wifi")}
                    />
                    <span>Wi-Fi</span>
                  </label>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={meta.parking}
                      onChange={() => toggleMeta("parking")}
                    />
                    <span>Parking</span>
                  </label>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={meta.breakfast}
                      onChange={() => toggleMeta("breakfast")}
                    />
                    <span>Breakfast</span>
                  </label>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={meta.pets}
                      onChange={() => toggleMeta("pets")}
                    />
                    <span>Pets allowed</span>
                  </label>
                </div>
              </fieldset>

              {/* RATING */}
              <fieldset className={styles.formGroup}>
                <legend className={styles.legend}>Rating</legend>

                {/* Desktop: stars + number input */}
                <div className={styles.ratingRowDesktop}>
                  <EditableStars
                    value={ratingNumber}
                    onChange={(v) => {
                      setRating(String(v));
                      setRatingError(null);
                    }}
                  />
                  <input
                    type="number"
                    min={0}
                    max={5}
                    step={1}
                    value={rating}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRating(val);
                      if (val !== "") {
                        validateRating(val);
                      } else {
                        setRatingError(null);
                      }
                    }}
                    className={`${styles.input} ${styles.ratingInput}`}
                    aria-label="Rating (0 to 5)"
                  />
                </div>

                {/* Mobile: star slider */}
                <div className={styles.ratingRowMobile}>
                  <StarSlider
                    value={ratingNumber}
                    onChange={(v) => {
                      setRating(String(v));
                      setRatingError(null);
                    }}
                  />
                </div>

                {ratingError && (
                  <span className={styles.error}>{ratingError}</span>
                )}
              </fieldset>

              {/* IMAGES */}
              <div className={styles.formGroup}>
                <div className={styles.sectionHeaderRow}>
                  <span className={styles.sectionTitle}>Images</span>
                </div>

                {mediaList.map((media, index) => (
                  <div key={index} className={styles.imageBlock}>
                    <div className={styles.row}>
                      <label className={`${styles.formGroup} ${styles.col2}`}>
                        Image URL
                        <input
                          value={media.url}
                          onChange={(e) =>
                            handleMediaChange(index, e.target.value)
                          }
                          placeholder="https://..."
                          className={styles.input}
                        />
                      </label>

                      <div className={styles.alignEndBox}>
                        <button
                          type="button"
                          onClick={() => handleRemoveMedia(index)}
                          disabled={mediaList.length === 1}
                          className={`${styles.btn} ${styles.btnSmall} ${styles.btnDanger}`}
                          title={
                            mediaList.length === 1
                              ? "You need at least one block"
                              : "Remove this image"
                          }
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {media.url.trim() !== "" && (
                      <div className={styles.imagePreviewRow}>
                        <img
                          src={media.url}
                          alt="preview"
                          className={styles.imageThumb}
                        />
                        <div className={styles.imagePreviewMeta}>
                          <div>Preview</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddMedia}
                  className={`${styles.btn} ${styles.btnSmall} ${styles.btnOutline} ${styles.addImageBtn}`}
                >
                  + Add image
                </button>
              </div>

              {error && <p className={styles.error}>{error}</p>}
            </div>
          </div>

          {/* Sticky footer with actions */}
          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleCancel}
              className={`${styles.btn} ${styles.btnOutline}`}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              {saving
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                  ? "Save"
                  : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
