#  MockMate - AI Interview Simulator

## Overview
MockMate is an AI-powered interview preparation platform built with Next.js (using TypeScript and CSS Modules) with App Router. It helps users master technical interviews through resume analysis, coding challenges, and mock interviews. 
## Deployment link
https://mock-mate-ai-interview-simulator.vercel.app

## Features
- **AI-powered Interview Simulation**: Practice with realistic interview scenarios
- **Code Editor**: Integrated coding environment for technical challenges
- **Resume Analysis**: Get feedback on your resume from AI
- **Dashboard**: Track your progress and interview performance
- **Technical Interview Preparation**: Prepare for coding interviews with tailored challenges

## Technologies Used
- Next.js (App Router)
- TypeScript
- CSS Modules
- Groq API (for AI capabilities)
- React

## Getting Started

### Prerequisites
- Node.js (v18 or later)
- npm or yarn
- Groq API key (sign up at [Groq's website](https://groq.com/))

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/hariharan1009/MockMate.git
   cd MockMate
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory and add your Groq API key:
   ```env
   NEXT_PUBLIC_GROQ_API_KEY=your_api_key_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure
```
MockMate/
├── app/
│   ├── page.module.css
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── CodeEditor/
│   ├── Dashboard/
│   ├── InterviewAssistant/
├── public/
├── package.json
├── tsconfig.json
└── README.md
```

## Available Scripts
- `dev`: Runs the development server
- `build`: Creates an optimized production build
- `start`: Starts the production server
- `lint`: Runs ESLint

## Contributing
Contributions are welcome! Please fork the repository and create a pull request with your changes.

## License
This project is open-source and available under the MIT License.

## Contact
For questions or feedback, please open an issue on GitHub or contact the maintainer.
mdhari707@gmail.com
---

