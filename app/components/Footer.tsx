import styles from "../styles/layout.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <p>© {new Date().getFullYear()} Holidaze. All rights reserved.</p>
    </footer>
  );
}
