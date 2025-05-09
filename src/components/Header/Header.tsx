import Link from 'next/link';
import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <Link href="/" className={styles.logo}>
          AI Interview Simulator
        </Link>
        <nav className={styles.nav}>
          <Link href="/">Home</Link>
          <Link href="/CodeEditor">Code Editor</Link>
          <Link href="/InterviewAssistant">Interview Assistant</Link>
        </nav>
      </div>
    </header>
  );
}