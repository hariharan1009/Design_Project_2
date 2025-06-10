import Link from 'next/link';
import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <Link href="/" className={styles.logo}>
           MockMate
                </Link>
        <nav className={styles.nav}>
          <Link href="/">Home</Link>
          <Link href="/InterviewAssistant">Interview Assistant</Link>
           <Link href="/CodeEditor">Code Challenge</Link>
        </nav>
      </div>
    </header>
  );
}