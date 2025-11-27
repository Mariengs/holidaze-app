import { useState } from "react";
import styles from "../styles/ProfileModal.module.css";
import { updateProfileMedia } from "../api/auth";
import { getProfile, type UserProfile } from "../api/auth";
import { useToast } from "./context/ToastContext";

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
  const { showToast } = useToast();

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

      showToast({
        message: "Profile updated successfully!",
        type: "success",
        duration: 3000,
      });

      onClose();
    } catch (error) {
      setErr((error as Error).message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  const hasValidBannerUrl = isHttpUrl(bannerUrl);
  const hasValidAvatarUrl = isHttpUrl(avatarUrl);

  return (
    <div
      className={styles.overlay}
      onClick={() => {
        if (!saving) {
          onClose();
        }
      }}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.heading}>Update profile images</h2>

        <form onSubmit={handleSave}>
          {/* Banner preview */}
          <div className={styles.previewWrapper}>
            <label className={styles.formGroup}>
              Banner URL
              <input
                className={styles.input}
                placeholder="https://example.com/banner.jpg"
                value={bannerUrl}
                onChange={(e) => {
                  setBannerUrl(e.target.value);
                  setBannerLoadError(null);
                }}
              />
            </label>

            <div className={styles.bannerPreview} aria-label="Banner preview">
              {hasValidBannerUrl && !bannerLoadError ? (
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
                  {bannerLoadError || "Banner preview will appear here"}
                </span>
              )}
            </div>
            {bannerLoadError && (
              <p className={styles.error}>{bannerLoadError}</p>
            )}
          </div>

          {/* Avatar preview */}
          <div className={styles.previewWrapper}>
            <label className={styles.formGroup}>
              Avatar URL
              <input
                className={styles.input}
                placeholder="https://example.com/avatar.jpg"
                value={avatarUrl}
                onChange={(e) => {
                  setAvatarUrl(e.target.value);
                  setAvatarLoadError(null);
                }}
              />
            </label>

            <div className={styles.avatarSection}>
              <div className={styles.avatarPreview} aria-label="Avatar preview">
                {hasValidAvatarUrl && !avatarLoadError ? (
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
                  <span className={styles.previewPlaceholder}>
                    {avatarLoadError || "Avatar preview"}
                  </span>
                )}
              </div>

              <div className={styles.avatarText}>
                <p className={styles.previewText}>
                  Your profile picture will appear as a circle
                </p>
                {avatarLoadError && (
                  <p className={styles.error}>{avatarLoadError}</p>
                )}
              </div>
            </div>
          </div>

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
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
