# DCS Operator Assessment Simulator

A game-based DCS (Distributed Control System) operator monitoring simulator with SHL-style scoring. Built with Next.js (App Router), TypeScript, and Tailwind CSS.

## Quick start

```bash
npm install
npm run dev
```

Open **http://localhost:3000** and click **Launch Simulator**, or go directly to **http://localhost:3000/simulator**.

## Why you see the default page

- The **home page** is at `/` (root). This project’s root now shows a short landing with a **Launch Simulator** button.
- The **simulator** lives at **`/simulator`**. If you visit only `http://localhost:3000`, you get the home page; you must open `/simulator` (or use the button) to run the assessment.

## Full user guide

For a complete step-by-step guide (how to run the app, every panel, every rule, scoring, results, and troubleshooting), see:

- **[SIMULATOR_GUIDE.md](./SIMULATOR_GUIDE.md)** — How to use this application in full detail.

## Tech stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- No backend, no database, no auth — runs entirely in the browser (localStorage for attempt history).

## Project structure

- `app/simulator/page.tsx` — Main simulator UI and game loop
- `app/components/` — Timer, ScorePanel, GeneratorPanel, StabilizerPanel, TemperaturePanel, GasPanel, ControlButtons, ResultsScreen
- `app/lib/` — gameEngine, scoringEngine, personalityEngine, randomizer, storage
- `types/gameTypes.ts` — Shared types and constants

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run dev`  | Start dev server         |
| `npm run build`| Production build         |
| `npm run start`| Run production build     |
