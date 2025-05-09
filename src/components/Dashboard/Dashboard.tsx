'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [mockData] = useState({
    userStats: {
      completedInterviews: 12,
      codingChallenges: 24,
      averageScore: 82,
      skillsMastered: 8,
    },
    recentActivities: [
      { id: 1, type: 'Interview', title: 'Frontend Developer Mock', date: '2023-11-15', score: 85 },
      { id: 2, type: 'Code Challenge', title: 'React Component Optimization', date: '2023-11-12', score: 78 },
      { id: 3, type: 'Interview', title: 'JavaScript Fundamentals', date: '2023-11-10', score: 90 },
    ],
    skillProgress: [
      { name: 'JavaScript', progress: 85 },
      { name: 'React', progress: 75 },
      { name: 'Algorithms', progress: 65 },
      { name: 'System Design', progress: 50 },
    ],
    upcomingGoals: [
      { id: 1, title: 'Complete 5 more interviews', progress: 60 },
      { id: 2, title: 'Improve algorithm score to 80%', progress: 45 },
    ]
  });

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardHeader}>
        <h1>Your Interview Dashboard</h1>
        <p>Track your progress and improve your interview skills</p>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tabButton} ${activeTab === 'overview' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'progress' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('progress')}
        >
          Progress
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'history' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className={styles.overviewTab}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <h3>Completed Interviews</h3>
              <p className={styles.statValue}>{mockData.userStats.completedInterviews}</p>
            </div>
            <div className={styles.statCard}>
              <h3>Coding Challenges</h3>
              <p className={styles.statValue}>{mockData.userStats.codingChallenges}</p>
            </div>
            <div className={styles.statCard}>
              <h3>Average Score</h3>
              <p className={styles.statValue}>{mockData.userStats.averageScore}%</p>
            </div>
            <div className={styles.statCard}>
              <h3>Skills Mastered</h3>
              <p className={styles.statValue}>{mockData.userStats.skillsMastered}</p>
            </div>
          </div>

          <div className={styles.chartSection}>
            <h2>Skill Progress</h2>
            <div className={styles.progressBars}>
              {mockData.skillProgress.map(skill => (
                <div key={skill.name} className={styles.progressItem}>
                  <div className={styles.progressLabel}>
                    <span>{skill.name}</span>
                    <span>{skill.progress}%</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill} 
                      style={{ width: `${skill.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'progress' && (
        <div className={styles.progressTab}>
          <h2>Your Learning Goals</h2>
          <div className={styles.goalsList}>
            {mockData.upcomingGoals.map(goal => (
              <div key={goal.id} className={styles.goalItem}>
                <h3>{goal.title}</h3>
                <div className={styles.goalProgress}>
                  <div 
                    className={styles.goalProgressBar}
                    style={{ width: `${goal.progress}%` }}
                  ></div>
                </div>
                <span>{goal.progress}% complete</span>
              </div>
            ))}
          </div>

          <div className={styles.recommendations}>
            <h2>Recommended Practice</h2>
            <div className={styles.recommendationCards}>
              <div className={styles.recommendationCard}>
                <h3>System Design Patterns</h3>
                <p>Practice common system design interview questions</p>
                <Link href="/interview-assistant" className={styles.practiceButton}>
                  Start Practice
                </Link>
              </div>
              <div className={styles.recommendationCard}>
                <h3>React Hooks Deep Dive</h3>
                <p>Master advanced React hook patterns</p>
                <Link href="/CodeEditor" className={styles.practiceButton}>
                  Code Challenge
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className={styles.historyTab}>
          <h2>Recent Activities</h2>
          <div className={styles.activitiesTable}>
            <div className={styles.tableHeader}>
              <span>Type</span>
              <span>Title</span>
              <span>Date</span>
              <span>Score</span>
            </div>
            {mockData.recentActivities.map(activity => (
              <div key={activity.id} className={styles.tableRow}>
                <span>{activity.type}</span>
                <span>{activity.title}</span>
                <span>{activity.date}</span>
                <span className={activity.score >= 80 ? styles.highScore : styles.lowScore}>
                  {activity.score}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}