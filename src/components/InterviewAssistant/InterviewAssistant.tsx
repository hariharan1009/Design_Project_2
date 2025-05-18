"use client";

import React, { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import Groq from "groq-sdk";
import styles from "./InterviewAssistant.module.css";

import "pdfjs-dist/build/pdf.worker.min";
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ChatHistoryEntry {
  question: string;
  answer: string;
  feedback: string;
  score: number;
}

interface ResultAnalysis {
  overallPerformance: "excellent" | "good" | "average" | "needs improvement";
  strengths: [string, string, string];
  weaknesses: [string, string, string];
  improvementSuggestions: [string, string, string];
}

export default function InterviewAssistant() {
  const groq = new Groq({
    apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  const [resumeText, setResumeText] = useState<string>("");
  const [skills, setSkills] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [history, setHistory] = useState<ChatHistoryEntry[]>([]);
  const [interviewing, setInterviewing] = useState(false);
  const [isResumeValid, setIsResumeValid] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [questions, setQuestions] = useState<string[]>([]);
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [resultAnalysis, setResultAnalysis] = useState<ResultAnalysis | null>(null);
  const [selectedMcqOption, setSelectedMcqOption] = useState<number | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setIsResumeValid(null);

    const reader = new FileReader();
    reader.readAsArrayBuffer(file);

    reader.onload = async () => {
      try {
        const pdfData = new Uint8Array(reader.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
        let extractedText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          extractedText += textContent.items
            .map((item) => ("str" in item ? item.str : ""))
            .join(" ");
        }

        const verificationResponse = await groq.chat.completions.create({
          messages: [
            {
              role: "user",
              content: `Is this text a resume? Answer only with 'yes' or 'no': ${extractedText.substring(0, 1000)}`,
            },
          ],
          model: "llama-3.3-70b-versatile",
        });

        const isResume = verificationResponse.choices[0]?.message?.content?.toLowerCase().includes("yes") ?? false;
        
        if (isResume) {
          setResumeText(extractedText);
          await extractSkills(extractedText);
          setIsResumeValid(true);
        } else {
          setIsResumeValid(false);
        }
      } catch (error) {
        console.error("Error processing PDF:", error);
        setIsResumeValid(false);
      } finally {
        setIsProcessing(false);
      }
    };
  };

  async function extractSkills(text: string) {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `Extract key technical skills from this resume: ${text}. Return as comma-separated values.`,
        },
      ],
      model: "llama-3.3-70b-versatile",
    });

    const extractedSkills =
      response.choices[0]?.message?.content?.split(",").map((s) => s.trim()) || [];
    setSkills(extractedSkills);
  }

  async function generateQuestions() {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `Generate exactly 10 technical interview questions based on these skills: ${skills.join(", ")}. 
          Return them as a numbered list without any additional text.`,
        },
      ],
      model: "llama-3.3-70b-versatile",
    });

    const generatedQuestions = response.choices[0]?.message?.content
      ?.split('\n')
      .filter(q => q.trim().length > 0)
      .map(q => q.replace(/^\d+\.\s*/, '').trim()) || [];
    
    setQuestions(generatedQuestions.slice(0, 10));
    return generatedQuestions.slice(0, 10);
  }

  async function startInterview() {
    if (skills.length === 0) return;
    setHistory([]);
    setTotalScore(0);
    setInterviewing(true);
    setCurrentQuestionIndex(0);
    setInterviewCompleted(false);
    setSelectedMcqOption(null);
    
    const generatedQuestions = await generateQuestions();
    if (generatedQuestions.length > 0) {
      setCurrentQuestion(generatedQuestions[0]);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAnswerSubmit(e);
    }
  };

  async function handleAnswerSubmit(event: React.FormEvent | React.KeyboardEvent) {
    event.preventDefault();
    if (!answer.trim()) return;

    const feedbackResponse = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `Evaluate this answer to the question "${currentQuestion}": ${answer}. 
          Provide feedback and score the answer from 1-10 based on technical accuracy and completeness and it will not correct give 0 marks. 
          Format your response as: "Score: X/10. Feedback: [your feedback here]". 
          Don't use markdown.`,
        },
      ],
      model: "llama-3.3-70b-versatile",
    });

    const feedbackText = feedbackResponse.choices[0]?.message?.content || "No feedback available.";
    const scoreMatch = feedbackText.match(/Score: (\d+)\/10/i);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 5;
    const feedback = feedbackText.replace(/Score: \d+\/10\.?\s*/i, '').trim();

    const newHistory = [...history, { 
      question: currentQuestion, 
      answer, 
      feedback,
      score 
    }];
    setHistory(newHistory);
    setTotalScore(totalScore + score);
    setAnswer("");

    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentQuestion(questions[currentQuestionIndex + 1]);
    } else {
      await analyzeResults(newHistory);
      setInterviewing(false);
      setInterviewCompleted(true);
    }
  }

  async function analyzeResults(history: ChatHistoryEntry[]) {
    const analysisPrompt = `Analyze these interview results and provide a JSON object with these exact keys:
    - overallPerformance (string: "excellent", "good", "average", or "needs improvement")
    - strengths (array of 3 strings)
    - weaknesses (array of 3 strings)
    - improvementSuggestions (array of 3 strings)
    
    Example format:
    {
      "overallPerformance": "good",
      "strengths": ["strength1", "strength2", "strength3"],
      "weaknesses": ["weakness1", "weakness2", "weakness3"],
      "improvementSuggestions": ["suggestion1", "suggestion2", "suggestion3"]
    }

    Interview results: ${JSON.stringify(history.slice(0, 3))} [showing first 3 for brevity]`;

    try {
      const response = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an expert interview analyst. Provide clear, constructive feedback in JSON format.",
          },
          {
            role: "user",
            content: analysisPrompt,
          },
        ],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
      });

      const rawAnalysis = response.choices[0]?.message?.content || "{}";
      let parsedAnalysis;
      
      try {
        parsedAnalysis = JSON.parse(rawAnalysis);
      } catch (e) {
        console.error("Failed to parse JSON:", rawAnalysis);
        throw new Error("Invalid JSON response from API");
      }

      // Default values if API returns invalid data
      const defaultAnalysis: ResultAnalysis = {
        overallPerformance: "average",
        strengths: ["No strengths identified", "N/A", "N/A"],
        weaknesses: ["No weaknesses identified", "N/A", "N/A"],
        improvementSuggestions: ["Review your answers", "Practice more", "Study relevant materials"]
      };

      // Validate and format the response
      const validatedAnalysis: ResultAnalysis = {
        overallPerformance: 
          ["excellent", "good", "average", "needs improvement"].includes(parsedAnalysis.overallPerformance?.toLowerCase())
          ? parsedAnalysis.overallPerformance.toLowerCase() as ResultAnalysis["overallPerformance"]
          : defaultAnalysis.overallPerformance,
        strengths: Array.isArray(parsedAnalysis.strengths) && parsedAnalysis.strengths.length >= 3
          ? [parsedAnalysis.strengths[0], parsedAnalysis.strengths[1], parsedAnalysis.strengths[2]]
          : defaultAnalysis.strengths,
        weaknesses: Array.isArray(parsedAnalysis.weaknesses) && parsedAnalysis.weaknesses.length >= 3
          ? [parsedAnalysis.weaknesses[0], parsedAnalysis.weaknesses[1], parsedAnalysis.weaknesses[2]]
          : defaultAnalysis.weaknesses,
        improvementSuggestions: Array.isArray(parsedAnalysis.improvementSuggestions) && parsedAnalysis.improvementSuggestions.length >= 3
          ? [parsedAnalysis.improvementSuggestions[0], parsedAnalysis.improvementSuggestions[1], parsedAnalysis.improvementSuggestions[2]]
          : defaultAnalysis.improvementSuggestions
      };

      setResultAnalysis(validatedAnalysis);
    } catch (error) {
      console.error("Error analyzing results:", error);
      setResultAnalysis({
        overallPerformance: "average",
        strengths: ["Could not analyze", "N/A", "N/A"],
        weaknesses: ["Could not analyze", "N/A", "N/A"],
        improvementSuggestions: ["Review your answers", "Practice more", "Study relevant materials"]
      });
    }
  }

  const calculateProgress = () => {
    return questions.length > 0 
      ? Math.round(((currentQuestionIndex) / questions.length) * 100)
      : 0;
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance.toLowerCase()) {
      case "excellent": return "#4CAF50";
      case "good": return "#8BC34A";
      case "average": return "#FFC107";
      case "needs improvement": return "#F44336";
      default: return "#9E9E9E";
    }
  };

  const renderResults = () => {
    if (!interviewCompleted || !resultAnalysis) return null;

    const averageScore = (totalScore / questions.length).toFixed(1);
    const performanceColor = getPerformanceColor(resultAnalysis.overallPerformance);

    return (
      <div className={styles.resultsContainer}>
        <h2>Interview Results</h2>
        
        <div className={styles.resultsSummary}>
          <div className={styles.summaryCard}>
            <h3>Overall Performance</h3>
            <div 
              className={styles.performanceBadge}
              style={{ backgroundColor: performanceColor }}
            >
              {resultAnalysis.overallPerformance}
            </div>
            <p>Average Score: <strong>{averageScore}/10</strong></p>
            <p>Total Score: <strong>{totalScore}/{questions.length * 10}</strong></p>
          </div>
          
          <div className={styles.summaryCard}>
            <h3>Self-Assessment</h3>
            <p>How would you rate your performance?</p>
            <div className={styles.mcqOptions}>
              {[1, 2, 3, 4, 5].map((option) => (
                <button
                  key={option}
                  className={`${styles.mcqOption} ${selectedMcqOption === option ? styles.selected : ''}`}
                  onClick={() => setSelectedMcqOption(option)}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className={styles.mcqLabels}>
              <span>Poor</span>
              <span>Fair</span>
              <span>Good</span>
              <span>Very Good</span>
              <span>Excellent</span>
            </div>
          </div>
        </div>

        <div className={styles.analysisSection}>
          <div className={styles.analysisColumn}>
            <h3>Your Strengths</h3>
            <ul>
              {resultAnalysis.strengths.map((strength, i) => (
                <li key={i} className={styles.strengthItem}>
                  <span className={styles.bullet}>✓</span> {strength}
                </li>
              ))}
            </ul>
          </div>
          
          <div className={styles.analysisColumn}>
            <h3>Areas for Improvement</h3>
            <ul>
              {resultAnalysis.weaknesses.map((weakness, i) => (
                <li key={i} className={styles.weaknessItem}>
                  <span className={styles.bullet}>⚠</span> {weakness}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.suggestionsSection}>
          <h3>Recommendations</h3>
          <ol>
            {resultAnalysis.improvementSuggestions.map((suggestion, i) => (
              <li key={i}>{suggestion}</li>
            ))}
          </ol>
        </div>

        <div className={styles.actionButtons}>
          <button 
            className={`${styles.button} ${styles.primaryButton}`}
            onClick={() => {
              setInterviewCompleted(false);
              setHistory([]);
              setTotalScore(0);
              startInterview();
            }}
          >
            Retake Interview
          </button>
          <button 
            className={`${styles.button} ${styles.secondaryButton}`}
            onClick={() => {
              setInterviewCompleted(false);
              setHistory([]);
              setTotalScore(0);
              setSkills([]);
              setResumeText("");
              setIsResumeValid(null);
            }}
          >
            Upload New Resume
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <h1>AI Interview Assistant</h1>

      {interviewing && (
        <div className={styles.scorePanel}>
          <div className={styles.scoreContainer}>
            <div className={styles.scoreItem}>
              <span className={styles.scoreLabel}>Current Score:</span>
              <span className={styles.scoreValue}>{totalScore}/{currentQuestionIndex * 10}</span>
            </div>
            <div className={styles.scoreItem}>
              <span className={styles.scoreLabel}>Average:</span>
              <span className={styles.scoreValue}>
                {currentQuestionIndex > 0 ? (totalScore / currentQuestionIndex).toFixed(1) : 0}/10
              </span>
            </div>
            <div className={styles.scoreItem}>
              <span className={styles.scoreLabel}>Progress:</span>
              <span className={styles.scoreValue}>
                {currentQuestionIndex}/{questions.length}
              </span>
            </div>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${calculateProgress()}%` }}
            ></div>
          </div>
        </div>
      )}

      {interviewCompleted ? (
        renderResults()
      ) : (
        <>
          <div className={styles.uploadSection}>
            <label className={styles.uploadButton}>
              Upload Your Resume
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
            </label>
            {isProcessing && <p className={styles.status}>Processing resume...</p>}
            {isResumeValid === false && (
              <p className={styles.error}>The uploaded file doesn't appear to be a valid resume. Please upload a proper resume.</p>
            )}
          </div>

          {isResumeValid && (
            <button
              onClick={startInterview}
              className={styles.button}
              disabled={interviewing || skills.length === 0}
            >
              {interviewing ? "Interview in Progress..." : "Start Interview"}
            </button>
          )}

          <div className={styles.history}>
            {history.map((entry, index) => (
              <div key={index} className={styles.message}>
                <p><strong>Question {index + 1}:</strong> {entry.question}</p>
                <p><strong>Your Answer:</strong> {entry.answer}</p>
                <p><strong>Feedback:</strong> {entry.feedback}</p>
              </div>
            ))}
          </div>

          {interviewing && (
            <div className={styles.questionContainer}>
              <p>
                <strong>Question {currentQuestionIndex + 1} of {questions.length}:</strong> {currentQuestion}
              </p>
              <form onSubmit={handleAnswerSubmit} className={styles.form}>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your answer here..."
                  className={styles.input}
                  rows={4}
                />
                <button type="submit" className={styles.button}>
                  Submit Answer
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}