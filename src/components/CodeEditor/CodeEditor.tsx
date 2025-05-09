"use client";

import React, { useState, useCallback, useEffect } from "react";
import Groq from "groq-sdk";
import styles from "./CodeEditor.module.css";

interface AnalysisResult {
  timeComplexity: string;
  spaceComplexity: string;
  suggestion?: string;
  correctedCode?: string;
}

const difficultyLevels = ["easy", "medium", "hard"];
const questionTopics = [
  "array", 
  "string", 
  "tree", 
  "graph", 
  "stack", 
  "queue", 
  "hashmap", 
  "linkedlist",
  "dynamic programming",
  "recursion",
  "sorting",
  "searching"
];

export default function CodeEditor() {
  const [code, setCode] = useState<string>("");
  const [question, setQuestion] = useState<string>("Loading question...");
  const [analysis, setAnalysis] = useState<AnalysisResult>({
    timeComplexity: "Not analyzed yet",
    spaceComplexity: "Not analyzed yet"
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [language, setLanguage] = useState<string>("javascript");
  const [questionLoading, setQuestionLoading] = useState<boolean>(true);
  const [showCorrectedCode, setShowCorrectedCode] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [topic, setTopic] = useState<string>("array");

  const groq = new Groq({
    apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  useEffect(() => {
    generateQuestion();
  }, [language, difficulty, topic]);

  const generateQuestion = async () => {
    setQuestionLoading(true);
    try {
      const response = await groq.chat.completions.create({
        messages: [{
          role: "user",
          content: `Generate a ${difficulty} level ${language} coding question about ${topic} that would be appropriate for assessing time and space complexity. 
          The question should be challenging but solvable in about 20-30 lines of code. 
          Make sure the question clearly relates to ${topic} concepts.
          Return ONLY the question text with no additional commentary or formatting.`
        }],
        model: "llama-3.3-70b-versatile",
        temperature: difficulty === "hard" ? 0.8 : difficulty === "medium" ? 0.7 : 0.6,
      });

      const generatedQuestion = response.choices[0]?.message?.content;
      if (generatedQuestion) {
        setQuestion(generatedQuestion);
      } else {
        setQuestion("Couldn't generate a question. Click 'New Question' to try again.");
      }
    } catch (error) {
      setQuestion("We couldn't load a question. Please check your connection and try again.");
      console.error("Error generating question:", error);
    } finally {
      setQuestionLoading(false);
    }
  };

  const analyzeCode = useCallback(async () => {
    if (!code.trim()) {
      setAnalysis({
        timeComplexity: "Not analyzed",
        spaceComplexity: "Not analyzed",
        suggestion: "Please write your solution code first before analyzing."
      });
      return;
    }

    setLoading(true);
    setShowCorrectedCode(false);
    setAnalysis({
      timeComplexity: "Analyzing...",
      spaceComplexity: "Analyzing...",
      suggestion: undefined,
      correctedCode: undefined
    });

    try {
      const response = await groq.chat.completions.create({
        messages: [{
          role: "user", 
          content: `Question: ${question}\n\nAnalyze this solution code and provide ONLY a JSON response with these exact fields:
{
  "timeComplexity": "Big O time complexity (e.g., O(n))",
  "spaceComplexity": "Big O space complexity (e.g., O(1))",
  "suggestion": "Optional suggestions for improvement if needed",
  "correctedCode": "Provide an optimized version of the code if improvements are possible, otherwise return the original code"
}

Solution code in ${language}:
\`\`\`${language}
${code}
\`\`\``
        }],
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("The analysis didn't return any results. Please try again.");
      }

      let result: Partial<AnalysisResult> = {};
      try {
        result = JSON.parse(content);
      } catch (e) {
        throw new Error("We couldn't understand the analysis response. Please try again.");
      }

      setAnalysis({
        timeComplexity: result.timeComplexity || "Could not determine",
        spaceComplexity: result.spaceComplexity || "Could not determine",
        suggestion: result.suggestion,
        correctedCode: result.correctedCode
      });
    } catch (error) {
      setAnalysis({
        timeComplexity: "Analysis failed",
        spaceComplexity: "Analysis failed",
        suggestion: error instanceof Error ? 
          `Suggestion: ${error.message}` : 
          "Something went wrong. Please check your code and try again."
      });
    } finally {
      setLoading(false);
    }
  }, [code, language, question]);

  const generateNewQuestion = async () => {
    setQuestionLoading(true);
    setCode("");
    setShowCorrectedCode(false);
    setAnalysis({
      timeComplexity: "Not analyzed yet",
      spaceComplexity: "Not analyzed yet",
      suggestion: undefined,
      correctedCode: undefined
    });
    
    try {
      const response = await groq.chat.completions.create({
        messages: [{
          role: "user",
          content: `Generate a new ${difficulty} level ${language} coding question about ${topic} that would be appropriate for assessing time and space complexity. 
          The question should be challenging but solvable in about 20-30 lines of code. 
          Make sure the question clearly relates to ${topic} concepts.
          Return ONLY the question text with no additional commentary or formatting.`
        }],
        model: "llama-3.3-70b-versatile",
        temperature: difficulty === "hard" ? 0.8 : difficulty === "medium" ? 0.7 : 0.6,
      });

      const generatedQuestion = response.choices[0]?.message?.content;
      if (generatedQuestion) {
        setQuestion(generatedQuestion);
      } else {
        setQuestion("Couldn't generate a new question. Please try again.");
      }
    } catch (error) {
      setQuestion("We couldn't load a new question. Please try again later.");
      console.error("Error generating question:", error);
    } finally {
      setQuestionLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Code Complexity Challenge</h1>
      
      <div className={styles.questionSection}>
        <div className={styles.questionHeader}>
          <h2>Challenge Question</h2>
          <button 
            onClick={generateNewQuestion}
            disabled={questionLoading}
            className={styles.newQuestionButton}
          >
            {questionLoading ? "Generating..." : "New Question"}
          </button>
        </div>
        <div className={styles.questionBox}>
          {questionLoading ? (
            <div className={styles.loadingQuestion}>Generating question...</div>
          ) : (
            <p className={styles.questionText}>{question}</p>
          )}
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label>Language:</label>
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            className={styles.select}
            disabled={questionLoading}
          >
            {["javascript", "python", "java", "c++", "typescript"].map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>

        <div className={styles.controlGroup}>
          <label>Difficulty:</label>
          <select 
            value={difficulty} 
            onChange={(e) => setDifficulty(e.target.value)}
            className={styles.select}
            disabled={questionLoading}
          >
            {difficultyLevels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>

        <div className={styles.controlGroup}>
          <label>Topic:</label>
          <select 
            value={topic} 
            onChange={(e) => setTopic(e.target.value)}
            className={styles.select}
            disabled={questionLoading}
          >
            {questionTopics.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        
        <button 
          onClick={analyzeCode} 
          disabled={loading || questionLoading}
          className={styles.analyzeButton}
        >
          {loading ? "Analyzing..." : "Analyze Solution"}
        </button>
      </div>

      <div className={styles.editorContainer}>
        <div className={styles.codeInput}>
          <h2>Your Solution Code</h2>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={`Write your ${language} solution here...`}
            spellCheck="false"
            className={styles.textarea}
            disabled={questionLoading}
          />
        </div>

        <div className={styles.results}>
          <h2>Complexity Analysis</h2>
          
          <div className={styles.complexityContainer}>
            <div className={styles.complexityBox}>
              <h3>Time Complexity</h3>
              <div className={styles.complexityValue}>
                {loading ? "..." : analysis.timeComplexity}
              </div>
            </div>
            
            <div className={styles.complexityBox}>
              <h3>Space Complexity</h3>
              <div className={styles.complexityValue}>
                {loading ? "..." : analysis.spaceComplexity}
              </div>
            </div>
          </div>

          {analysis.suggestion && (
            <div className={styles.suggestionBox}>
              <h3>Suggestion</h3>
              <div className={styles.suggestionText}>
                {analysis.suggestion}
              </div>
            </div>
          )}

          {analysis.correctedCode && analysis.correctedCode !== code && (
            <div className={styles.correctedCodeSection}>
              <button
                onClick={() => setShowCorrectedCode(!showCorrectedCode)}
                className={styles.toggleCorrectedCode}
              >
                {showCorrectedCode ? "Hide Corrected Code" : "Show Corrected Code"}
              </button>
              
              {showCorrectedCode && (
                <div className={styles.correctedCodeBox}>
                  <h3>Optimized Solution</h3>
                  <pre className={styles.codeBlock}>
                    {analysis.correctedCode}
                  </pre>
                  <button
                    onClick={() => {
                      setCode(analysis.correctedCode || "");
                      setShowCorrectedCode(false);
                    }}
                    className={styles.useCorrectedButton}
                  >
                    Use This Solution
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}