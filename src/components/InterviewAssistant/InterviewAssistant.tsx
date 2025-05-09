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
}

export default function InterviewAssistant() {
  const groq = new Groq({
    apiKey:
      process.env.NEXT_PUBLIC_GROQ_API_KEY ,
    dangerouslyAllowBrowser: true,
  });

  const [resumeText, setResumeText] = useState<string>("");
  const [skills, setSkills] = useState<string[]>([]);
  const [currentSkillIndex, setCurrentSkillIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [history, setHistory] = useState<ChatHistoryEntry[]>([]);
  const [interviewing, setInterviewing] = useState(false);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

        setResumeText(extractedText);
        extractSkills(extractedText);
      } catch (error) {
        console.error("Error extracting text from PDF:", error);
      }
    };
  };

  async function extractSkills(text: string) {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `Extract key technical skills from this resume: ${text}`,
        },
      ],
      model: "llama-3.3-70b-versatile",
    });

    const extractedSkills =
      response.choices[0]?.message?.content?.split(",").map((s) => s.trim()) ||
      [];
    setSkills(extractedSkills);
  }

  async function startInterview() {
    if (skills.length === 0) return;
    setHistory([]);
    setInterviewing(true);
    setCurrentSkillIndex(0);
    await askNextQuestion(skills[0]);
  }

  async function askNextQuestion(skill: string) {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Ask a technical question about ${skill}. and dont use markdown format `,
        },
      ],
      model: "llama-3.3-70b-versatile",
    });

    setCurrentQuestion(response.choices[0]?.message?.content || "");
  }

  async function handleAnswerSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!answer.trim()) return;

    const feedbackResponse = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `Provide feedback on this answer: ${answer} and dont use markdown format `,
        },
      ],
      model: "llama-3.3-70b-versatile",
    });

    const feedback =
      feedbackResponse.choices[0]?.message?.content || "No feedback available.";
    setHistory([...history, { question: currentQuestion, answer, feedback }]);
    setAnswer("");

    if (currentSkillIndex + 1 < skills.length) {
      setCurrentSkillIndex(currentSkillIndex + 1);
      await askNextQuestion(skills[currentSkillIndex + 1]);
    } else {
      setInterviewing(false);
      setCurrentQuestion("Interview completed.");
    }
  }

  return (
    <div className={styles.container}>
      <h1>AI Interview Assistant</h1>

      <div className={styles.uploadSection}>
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileUpload}
        />
      </div>

      <button
        onClick={startInterview}
        className={styles.button}
        disabled={interviewing || skills.length === 0}
      >
        Start Interview
      </button>

      <div className={styles.history}>
        {history.map((entry, index) => (
          <div key={index} className={styles.message}>
            <p>
              <strong>Question:</strong> {entry.question}
            </p>
            <p>
              <strong>Your Answer:</strong> {entry.answer}
            </p>
            <p>
              <strong>Feedback:</strong> {entry.feedback}
            </p>
          </div>
        ))}
      </div>

      {interviewing && (
        <div className={styles.questionContainer}>
          <p>
            <strong>Current Question:</strong> {currentQuestion}
          </p>
          <form onSubmit={handleAnswerSubmit} className={styles.form}>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className={styles.input}
            />
            <button type="submit" className={styles.button}>
              Submit Answer
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
