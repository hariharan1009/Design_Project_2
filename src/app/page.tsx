import Link from 'next/link';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <div className={styles.container}>
      
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Master Your Technical Interviews</h1>
          <p className={styles.heroSubtitle}>
            AI-powered resume analysis, coding challenges, and mock interviews to help you land your dream job
          </p>
          <div className={styles.ctaButtons}>
            <Link href="/InterviewAssistant" className={styles.primaryButton}>Start Interview</Link>
            <Link href="/CodeEditor" className={styles.secondaryButton}>Try Coding Challenge</Link>
          </div>
        </div>
      </section>

      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>Why Choose Our Platform</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>💡</div>
            <h3>Personalized Questions</h3>
            <p>Our AI analyzes your resume and asks relevant technical questions based on your skills.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>👨‍💻</div>
            <h3>Real-time Feedback</h3>
            <p>Get instant feedback on your answers with detailed explanations and improvement tips.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📊</div>
            <h3>Code Analysis</h3>
            <p>Understand time and space complexity of your code with optimization suggestions.</p>
          </div>
        </div>
      </section>

      <section className={styles.howItWorks}>
        <h2 className={styles.sectionTitle}>How It Works</h2>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepContent}>
              <h3>Upload Your Resume</h3>
              <p>Upload your PDF resume and our system will extract your technical skills automatically.</p>
            </div>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepContent}>
              <h3>Start Mock Interview</h3>
              <p>Begin a simulated interview with questions tailored to your experience level.</p>
            </div>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepContent}>
              <h3>Improve Your Skills</h3>
              <p>Review feedback and practice coding challenges to strengthen weak areas.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.testimonials}>
        <h2 className={styles.sectionTitle}>Success Stories</h2>
        <div className={styles.testimonialCards}>
          <div className={styles.testimonialCard}>
            <p className={styles.testimonialText}>
              "This platform helped me land my dream job at Google! The mock interviews were incredibly realistic."
            </p>
            <p className={styles.testimonialAuthor}>- Sarah, Software Engineer</p>
          </div>
          <div className={styles.testimonialCard}>
            <p className={styles.testimonialText}>
              "The code analysis tool improved my problem-solving skills dramatically. I aced my technical rounds!"
            </p>
            <p className={styles.testimonialAuthor}>- Michael, Full Stack Developer</p>
          </div>
        </div>
      </section>
    </div>
  );
}