import { useState, useEffect } from "react";
import { createVenue, updateVenue, type Venue } from "../api/venues";
import styles from "../styles/venueEditorModal.module.css";

interface VenueEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (venue: Venue) => void;
  initialVenue?: Venue; // if set => edit mode
}

type MediaItem = {
  url: string;
};

export default function VenueEditorModal({
  isOpen,
  onClose,
  onSaved,
  initialVenue,
}: VenueEditorModalProps) {
  const isEditing = !!initialVenue;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [maxGuests, setMaxGuests] = useState<number>(1);
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [mediaList, setMediaList] = useState<MediaItem[]>([{ url: "" }]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync data when modal opens or initialVenue changes
  useEffect(() => {
    if (!isOpen) return;

    if (initialVenue) {
      setName(initialVenue.name || "");
      setDescription(initialVenue.description || "");
      setPrice(initialVenue.price || 0);
      setMaxGuests(initialVenue.maxGuests || 1);
      setCity(initialVenue.location?.city || "");
      setCountry(initialVenue.location?.country || "");
      setMediaList(
        initialVenue.media?.length
          ? initialVenue.media.map((m) => ({ url: m.url || "" }))
          : [{ url: "" }]
      );
    } else {
      // create defaults
      setName("");
      setDescription("");
      setPrice(0);
      setMaxGuests(1);
      setCity("");
      setCountry("");
      setMediaList([{ url: "" }]);
    }

    setError(null);
    setSaving(false);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const cleanedMedia = mediaList
        .map((m) => m.url.trim())
        .filter((url) => url !== "")
        .map((url) => ({
          url,
          alt: name || "venue image",
        }));

      const body = {
        name,
        description,
        price: Number(price),
        maxGuests: Number(maxGuests),
        media: cleanedMedia,
        location:
          city || country
            ? {
                city: city || undefined,
                country: country || undefined,
              }
            : undefined,
      };

      let saved: Venue;
      if (isEditing && initialVenue?.id) {
        saved = await updateVenue(initialVenue.id, body);
      } else {
        saved = await createVenue(body);
      }

      onSaved(saved);
      onClose();
    } catch (err) {
      setError((err as Error).message || "Could not save venue");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.heading}>
          {isEditing ? "Edit venue" : "New venue"}
        </h2>

        {/* display: contents på form for å la .actions (sticky) være søsken av .formBody */}
        <form onSubmit={handleSubmit} style={{ display: "contents" }}>
          {/* Scrollable content area */}
          <div className={styles.formBody}>
            <div className={styles.formBodyInner}>
              {/* BASIC INFO */}
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
                <label className={styles.formGroup} style={{ flex: 1 }}>
                  Price / night
                  <input
                    type="number"
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    required
                    className={styles.input}
                  />
                </label>

                <label className={styles.formGroup} style={{ flex: 1 }}>
                  Max guests
                  <input
                    type="number"
                    min={1}
                    value={maxGuests}
                    onChange={(e) => setMaxGuests(Number(e.target.value))}
                    required
                    className={styles.input}
                  />
                </label>
              </div>

              <div className={styles.row}>
                <label className={styles.formGroup} style={{ flex: 1 }}>
                  City
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={styles.input}
                  />
                </label>

                <label className={styles.formGroup} style={{ flex: 1 }}>
                  Country
                  <input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className={styles.input}
                  />
                </label>
              </div>

              {/* IMAGES */}
              <div className={styles.formGroup}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <span style={{ fontWeight: 500 }}>Images</span>
                  <button
                    type="button"
                    onClick={handleAddMedia}
                    className={`${styles.btn} ${styles.btnSmall} ${styles.btnOutline}`}
                  >
                    + Add image
                  </button>
                </div>

                {mediaList.map((media, index) => (
                  <div key={index} className={styles.imageBlock}>
                    <div className={styles.row}>
                      <label
                        className={styles.formGroup}
                        style={{ flex: 2, marginRight: "0.5rem" }}
                      >
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

                      <div
                        style={{
                          flex: 0,
                          display: "flex",
                          alignItems: "flex-end",
                        }}
                      >
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
                          <div>{media.url}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {error && <p className={styles.error}>{error}</p>}
            </div>
          </div>

          {/* Sticky footer with actions */}
          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
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
