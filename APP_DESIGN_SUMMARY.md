# EZ Academy: AI Immersion Design & UI Specification

This document summarizes the current design language and UI/UX philosophy of EZ Academy for further improvement or analysis.

## 1. Core Aesthetic: "The AI Cockpit"
- **Visual Identity:** A high-tech, immersive "intelligence dashboard."
- **Color Palette:** 
  - **Atmosphere:** Deep Obsidian (`#0A0A0A`) background.
  - **Primary:** Neural Lime (`#C0FF00`) - used for interactive elements, status indicators, and glows.
  - **Accents:** Glass cards (white at 5-10% opacity) with blurred backdrops and subtle border glows.
- **Typography:** 
  - **Dynamic:** Heavy use of **black italicized** headings for a "speed/tech" feel.
  - **Data:** Monospace elements for system IDs and technical readouts.
  - **Identity:** "Neural Identity" headers with wide letter-spacing (`tracking-widest`).

## 2. Key Interactive Modules

### A. System Initialization (Onboarding)
- **Concept:** Not a form, but a "system boot-up."
- **Elements:**
  - Progressive sequence with typing animations.
  - "Initializing profile..." and "Calibrating proficiency..." style messaging.
  - Scanline effects and glass overlays.

### B. SpeakEZ (Live AI Conversation Cockpit)
- **Atmosphere:** Feels like a real-time neural link.
- **UI Elements:**
  - Pulsing voice visualizer and mic glow.
  - Layered "feedback pods" showing Clarity, Fluency, and Vocabulary metrics.
  - Animated scanlines and metric bars.

### C. Intelligence Dashboard
- **Charts:** Gradient-filled Area charts, high-opacity Radar charts (Proficiency Matrix), and Scatter charts (Mastery Heatmap).
- **Interactivity:** Hover states with neon-text-glow and smooth transitions.
- **Hero:** "Neural Link Active" status indicators.

## 3. Tech Stack & Implementation
- **Framework:** React 18+ with Vite.
- **Styling:** Tailwind CSS (utility-first) with custom neon-glow classes.
- **Animations:** `motion/react` (staggered entrances, fluid state changes).
- **Icons:** `lucide-react` (selected for technical/geometric shapes).
- **AI Core:** Powered by Gemini (Google GenAI SDK).

## 4. UI Patterns
- **Glassmorphism:** Cards use `backdrop-blur-xl` and `bg-white/5`.
- **Scanlines:** Subtle animated CSS overlay for that CRT/technical monitor feel.
- **Micro-interactions:** Buttons rotate slightly or glow on hover.

## 5. Mobile Considerations
- **Fluid Layouts:** Uses `max-w-7xl` and grid-reflow for desktop, while stacking cards vertically for mobile.
- **Density Control:** Larger paddings and touch targets for mobile vs. dense technical readouts for desktop.
