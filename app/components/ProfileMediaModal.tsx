import { useState } from "react";
import styles from "../styles/modal.module.css";
import { updateProfileMedia } from "../api/auth";
import { getProfile, type UserProfile } from "../api/auth";

interface ProfileMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (newProfile: Partial<UserProfile>) => void;
}

export default function ProfileMediaModal({
  isOpen,
  onClose,
  onSaved,
}: ProfileMediaModalProps) {
  if (!isOpen) return null;

  // hent eksisterende profil så vi kan pre-fylle feltene
  const current = getProfile();

  const [avatarUrl, setAvatarUrl] = useState(current?.avatar?.url || "");
  const [avatarAlt, setAvatarAlt] = useState(current?.avatar?.alt || "");
  const [bannerUrl, setBannerUrl] = useState(
    (current as any)?.banner?.url || ""
  );
  const [bannerAlt, setBannerAlt] = useState(
    (current as any)?.banner?.alt || ""
  );

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);

    try {
      const updated = await updateProfileMedia({
        avatarUrl: avatarUrl.trim() || undefined,
        avatarAlt: avatarAlt.trim() || undefined,
        bannerUrl: bannerUrl.trim() || undefined,
        bannerAlt: bannerAlt.trim() || undefined,
      });

      // send data opp til parent (ProfilePage) slik at vi kan sync'e state
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
          <label className={styles.formGroup}>
            Avatar URL
            <input
              className={styles.input}
              placeholder="https://..."
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
          </label>

          <label className={styles.formGroup}>
            Avatar alt text
            <input
              className={styles.input}
              placeholder="My face"
              value={avatarAlt}
              onChange={(e) => setAvatarAlt(e.target.value)}
            />
          </label>

          <label className={styles.formGroup}>
            Banner URL
            <input
              className={styles.input}
              placeholder="https://..."
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
            />
          </label>

          <label className={styles.formGroup}>
            Banner alt text
            <input
              className={styles.input}
              placeholder="Beach view"
              value={bannerAlt}
              onChange={(e) => setBannerAlt(e.target.value)}
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
