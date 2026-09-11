# ⚡ FlashStudy

**FlashStudy** is an advanced, AI-powered learning platform designed to help students and professionals master any subject with ease. By leveraging cutting-edge Large Language Models (LLMs), FlashStudy transforms your raw notes and PDFs into structured study kits, interactive flashcards, and comprehensive exam simulations.

---

## 🚀 Key Features

### 🧠 AI Study Kit Generation
Transform any text or PDF into a complete study package:
- **Smart Summaries**: Distill complex topics into concise, readable notes.
- **Concept Extraction**: Automatically identify key terms and definitions.
- **Automated Mind Mapping**: Visualize relationships between concepts using Mermaid.js diagrams.

### 📅 SRS Dashboard (Spaced Repetition System)
Never forget what you've learned. Our integrated SRS dashboard tracks your progress and schedules review sessions based on proven cognitive science principles.

### 📝 Exam Simulator
Test your knowledge in a realistic environment:
- **Dynamic Question Sets**: AI-generated quizzes tailored to your material.
- **Immediate Feedback**: Understand where you went wrong with detailed explanations.
- **Performance Tracking**: Monitor your scores over time.

### 💬 AI Study Chat
Need clarification? Chat with our integrated AI assistant that has the context of your specific study materials.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **AI Core**: [Gemini 1.5 Pro](https://ai.google.dev/gemini-api)
- **Visuals**: [Mermaid.js](https://mermaid.js.org/) (Flowcharts), [KaTeX](https://katex.org/) (Math Formulas)

---

## ⚙️ Getting Started

### Prerequisites
- Node.js 20+ 
- npm / yarn / pnpm

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Ankit-49/flash-study.git
   cd flash-study
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env.local` file in the root directory and add your API keys:
   ```env
   GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here
   # Add other keys as needed (Supabase, Vercel, etc.)
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

- `npm run dev` — Start the development server
- `npm run build` — Build the app for production
- `npm run start` — Start the production server
- `npm run lint` — Run ESLint checks

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an issue.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  Built with ❤️ by <a href="https://github.com/Ankit-49">Ankit Sapkota</a>
</div>
