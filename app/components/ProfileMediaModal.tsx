import { useState } from "react";
import styles from "../styles/modal.module.css";
import { updateProfileMedia } from "../api/auth";
import { getProfile, type UserProfile } from "../api/auth";

interface ProfileMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (newProfile: Partial<UserProfile>) => void;
}

function isHttpUrl(url: string) {
  return /^https?:\/\//i.test(url.trim());
}

export default function ProfileMediaModal({
  isOpen,
  onClose,
  onSaved,
}: ProfileMediaModalProps) {
  if (!isOpen) return null;

  const current = getProfile();

  const [avatarUrl, setAvatarUrl] = useState(current?.avatar?.url || "");
  const [bannerUrl, setBannerUrl] = useState(
    (current as any)?.banner?.url || ""
  );

  const [avatarLoadError, setAvatarLoadError] = useState<string | null>(null);
  const [bannerLoadError, setBannerLoadError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);

    try {
      const updated = await updateProfileMedia({
        avatarUrl: avatarUrl.trim() || undefined,
        bannerUrl: bannerUrl.trim() || undefined,
      });

      onSaved({
        avatar: updated.avatar,
        banner: updated.banner,
      });

      onClose();
    } catch (error) {
      setErr((error as Error).message || "Failed to update profile images");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.heading}>Update profile images</h2>

        <form onSubmit={handleSave}>
          {/* Banner preview */}
          <div className={styles.previewWrapper}>
            <div className={styles.bannerPreview} aria-label="Banner preview">
              {isHttpUrl(bannerUrl) ? (
                <img
                  key={bannerUrl}
                  src={bannerUrl}
                  alt="Banner preview"
                  className={styles.bannerImage}
                  onLoad={() => setBannerLoadError(null)}
                  onError={() =>
                    setBannerLoadError("Could not load banner image")
                  }
                />
              ) : (
                <span className={styles.previewPlaceholder}>
                  Banner preview will appear here
                </span>
              )}
            </div>
            {bannerLoadError && (
              <p className={styles.error}>{bannerLoadError}</p>
            )}
          </div>

          {/* Avatar preview */}
          <div className={styles.avatarSection}>
            <div className={styles.avatarPreview} aria-label="Avatar preview">
              {isHttpUrl(avatarUrl) ? (
                <img
                  key={avatarUrl}
                  src={avatarUrl}
                  alt="Avatar preview"
                  className={styles.avatarImage}
                  onLoad={() => setAvatarLoadError(null)}
                  onError={() =>
                    setAvatarLoadError("Could not load avatar image")
                  }
                />
              ) : (
                <span className={styles.previewPlaceholder}>No avatar</span>
              )}
            </div>

            <div className={styles.avatarText}>
              {avatarLoadError && (
                <p className={styles.error}>{avatarLoadError}</p>
              )}
            </div>
          </div>

          {/* Inputs */}
          <label className={styles.formGroup}>
            Banner URL
            <input
              className={styles.input}
              placeholder="https://..."
              value={bannerUrl}
              onChange={(e) => {
                setBannerUrl(e.target.value);
                setBannerLoadError(null);
              }}
            />
          </label>

          <label className={styles.formGroup}>
            Avatar URL
            <input
              className={styles.input}
              placeholder="https://..."
              value={avatarUrl}
              onChange={(e) => {
                setAvatarUrl(e.target.value);
                setAvatarLoadError(null);
              }}
            />
          </label>

          {err && <p className={styles.error}>{err}</p>}

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className={`${styles.btn} ${styles.btnOutline}`}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
