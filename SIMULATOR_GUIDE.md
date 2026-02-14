# DCS Operator Assessment Simulator — User Guide

This document explains how to run the application, open the simulator, and use every feature step by step.

---

## Table of Contents

1. [How to Run the Application](#1-how-to-run-the-application)
2. [How to Open the Simulator](#2-how-to-open-the-simulator)
3. [Overview of the Simulator](#3-overview-of-the-simulator)
4. [Header and Controls](#4-header-and-controls)
5. [Generator Panel (Level 1)](#5-generator-panel-level-1)
6. [Stabilizer Panel (Level 2)](#6-stabilizer-panel-level-2)
7. [Temperature Panel (Level 3)](#7-temperature-panel-level-3)
8. [Gas Panel — O₂ and CO₂ (Level 4)](#8-gas-panel--o₂-and-co₂-level-4)
9. [System Controls — RECENTRE and SYSTEM RESET (Level 5)](#9-system-controls--recentre-and-system-reset-level-5)
10. [Rules Panel (Help)](#10-rules-panel-help)
11. [Scoring System](#11-scoring-system)
12. [Difficulty and Time](#12-difficulty-and-time)
13. [When the Session Ends](#13-when-the-session-ends)
14. [Results Screen](#14-results-screen)
15. [Personality Traits](#15-personality-traits)
16. [Pass / Fail and Operator Classification](#16-pass--fail-and-operator-classification)
17. [Attempt History and Clear History](#17-attempt-history-and-clear-history)
18. [Restarting a Session](#18-restarting-a-session)
19. [Data Stored on Your Device (localStorage)](#19-data-stored-on-your-device-localstorage)
20. [Edge Cases and Safeguards](#20-edge-cases-and-safeguards)
21. [Troubleshooting](#21-troubleshooting)

---

## 1. How to Run the Application

### Prerequisites

- **Node.js** (v18 or newer recommended)
- **npm**, **yarn**, **pnpm**, or **bun**

### Steps

1. Open a terminal in the project folder (where `package.json` is).
2. Install dependencies (if you haven’t already):
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Wait until you see something like:
   ```text
   ▲ Next.js 16.x.x
   - Local:        http://localhost:3000
   ```
5. The app is now running. Keep this terminal open while you use the simulator.

**Other package managers:**

- **Yarn:** `yarn dev`
- **pnpm:** `pnpm dev`
- **Bun:** `bun dev`

---

## 2. How to Open the Simulator

You have two ways to open the simulator:

### Option A — From the home page

1. In your browser, go to **http://localhost:3000**
2. You will see the **DCS Operator Assessment Simulator** landing page.
3. Click the **“Launch Simulator”** button.
4. You will be taken to **http://localhost:3000/simulator**.

### Option B — Direct URL

1. In your browser, go directly to **http://localhost:3000/simulator**
2. The simulator page loads immediately.

**Why you were seeing the Vercel intro:**  
The app’s **home page** is at `/` (root). The **simulator** lives at **`/simulator`**. The default Next.js template shows a “To get started…” intro on the root. This project’s root page has been replaced with a simple landing that links to the simulator; clicking **“Launch Simulator”** or visiting **/simulator** takes you to the actual assessment.

---

## 3. Overview of the Simulator

- **Purpose:** Simulate a DCS (Distributed Control System) operator monitoring several systems. You must react to “red zone” conditions by pressing the correct controls within the rules.
- **Duration:** One session is **8 minutes (480 seconds)**.
- **Layout:**  
  - **Header:** Title, timer, score, help (?) button.  
  - **Panels:** Generator, Stabilizers, Temperature, O₂/CO₂, and system controls (RECENTRE, SYSTEM RESET).  
  - **Results:** After time runs out, a full-screen results view with score, accuracy, personality traits, pass/fail, and classification.

Values (generator, temperature, O₂, CO₂, stabilizers) **change over time**. Some zones are **green** (OK) and some **red** (action required). Your job is to press the **correct** button for the **current** situation; wrong or unnecessary presses hurt your score.

---

## 4. Header and Controls

At the top of the simulator you always see:

- **Title:** “DCS Operator Assessment Simulated Control Panel”
- **Timer:** Countdown in **MM:SS** (e.g. 08:00 → 00:00). Updates every second. Turns amber when ≤ 1 minute left.
- **Score panel:** Current total score and counts for: correct, incorrect, missed, and unnecessary actions.
- **Help (?):** A **?** button. Click it to show or hide the **rules panel** (see [Rules Panel (Help)](#10-rules-panel-help)).

When the session has not started, you also see a short intro and a **“Start simulation”** button. Click that to begin the 8-minute run.

---

## 5. Generator Panel (Level 1)

**What it shows:** A vertical “power” bar (segments) and a numeric percentage (0–100%).

**Red zones:**

- **Low (red/amber):** Generator &lt; 40%
- **High (red):** Generator &gt; 80%

**Buttons:**

- **ON**  
  - **When to use:** Generator is **low** (&lt; 40%).  
  - Correct press: you gain points.  
  - Wrong press (e.g. pressing STABILIZE when it’s low): penalty.

- **STABILIZE**  
  - **When to use:** Generator is **high** (&gt; 80%).  
  - Correct press: you gain points.  
  - Wrong press or pressing when it’s low: penalty.

**Rules summary:** Low → ON. High → STABILIZE. If you do nothing when a red condition is active for too long (about 3 seconds), it counts as a **missed** action and you lose points.

---

## 6. Stabilizer Panel (Level 2)

**What it shows:** Two circular **dials** (Top and Bottom), each with a value 0–100%.

**Red zone:** For each dial, “red” means:

- Value &lt; 30%, or  
- Value &gt; 70%

**Buttons:**

- **RECENTRE**  
  - **When to use:** **Both** stabilizers are in the red zone.  
  - Correct: you gain points.  
  - Wrong or unnecessary: penalty.

- **RESET**  
  - **When to use:** **Both** stabilizers are in the **green** zone (normal).  
  - Correct: you gain points.  
  - Wrong or unnecessary: penalty.

**Important:** If **only one** stabilizer is red, the rules say **do nothing** (no required action). Pressing RECENTRE or RESET in that case counts as an **unnecessary** action and you lose points.

---

## 7. Temperature Panel (Level 3)

**What it shows:** Current temperature (0–100%) and a simple **bar history** of recent values (no external chart library).

**Red zone:** Temperature &gt; 75%.

**Spike sequence:** When temperature goes into the red zone, the simulator tracks a **spike count** (first, second, third time in that “spike” sequence):

- **First spike** → press **HIGH**
- **Second spike** → press **HIGH** again
- **Third spike** → press **3RD HIGH**
- After the third, the counter resets; the next time it goes red, the cycle starts again (first → HIGH, second → HIGH, third → 3RD HIGH).

**Buttons:**

- **HIGH** — For the **first** or **second** temperature spike in the current sequence.
- **3RD HIGH** — For the **third** spike in the current sequence.

Wrong sequence (e.g. 3RD HIGH on first spike), wrong button, or ignoring a required press: penalty.

---

## 8. Gas Panel — O₂ and CO₂ (Level 4)

**What it shows:** Two vertical bars — **O₂** and **CO₂** — each 0–100%.

**Red zones:**

- **O₂:** Red when &lt; 25%
- **CO₂:** Red when &gt; 75%

**Buttons:**

- **RESET**  
  - **When to use:** **Exactly one** gas is in the red zone (O₂ red and CO₂ green, or O₂ green and CO₂ red).  
  - Correct: gain points.  
  - Wrong or unnecessary: penalty.

- **ALARM**  
  - **When to use:** **Both** gases are in the red zone.  
  - Correct: gain points.  
  - Wrong or unnecessary: penalty.

If **both** are green, no action is required. Pressing RESET or ALARM then counts as unnecessary and you lose points.

---

## 9. System Controls — RECENTRE and SYSTEM RESET (Level 5)

This block has two buttons that affect the whole system:

- **RECENTRE**  
  - Same rule as the Stabilizer panel: use when **both stabilizers** are red (or when the rules say RECENTRE for stabilizers).  
  - Fine-tunes a stable process; corrects minor drift.  
  - Wrong or unnecessary use: penalty.

- **SYSTEM RESET**  
  - **When to use:** **Only** when **both** of these are true:  
    - Temperature is in the red zone (&gt; 75%), and  
    - O₂ is in the red zone (&lt; 25%).  
  - Effect: Resets **all** systems (generator, temperature, O₂, CO₂, stabilizers) back to safe values.  
  - **Time penalty:** Each **correct** use of SYSTEM RESET deducts **5 seconds** from the timer (your session ends 5 seconds earlier).  
  - **Cooldown:** After you use SYSTEM RESET, the button is disabled for **10 seconds** to prevent spamming.  
  - Use only when necessary (temp + O₂ both red). Using it when not required is wrong and is penalized.

---

## 10. Rules Panel (Help)

Click the **?** button in the header to show or hide the rules panel.

It displays:

- **✔ FOLLOW THE RULES**
- **ISOLATE** any deviation first.
- **RECENTRE** drift if stable.
- **RESET** only when normal.
- *Good operators wait. They don’t panic-reset.*

Use this as a quick reminder of the intended behaviour. The panel does not affect scoring; it’s for reference only.

---

## 11. Scoring System

Scores are updated in real time and shown in the header.

**Points:**

- **Correct action:** +10  
- **Fast reaction bonus:** +5 extra if you respond in under **1.5 seconds** (when a required action was pending).
- **Wrong action:** −15  
- **Missed action:** −20 (required action not taken within about 3 seconds).  
- **Unnecessary action:** −10 (you pressed a button when no action was required).

**What is “required”?**  
The simulator decides, from current values, which single action (if any) is required right now (e.g. “press ON” or “press RECENTRE”). Only that action is “correct”; anything else in that moment is wrong or unnecessary.

Your **total score** can go negative if you make many mistakes. Pass/fail and classification use this total plus accuracy and personality metrics (see below).

---

## 12. Difficulty and Time

Difficulty **increases with elapsed time** (same 8-minute run):

- **Phase 1 (0–2 min 40 s):** Lower volatility; small changes; 10% spike chance.
- **Phase 2 (2 min 40 s–5 min 20 s):** Medium volatility; 15% spike chance.
- **Phase 3 (5 min 20 s–8 min):** High volatility; larger jumps; 20% spike chance; more overlapping red zones.

So the same panels and rules apply throughout, but values move more and overlap more as time goes on.

---

## 13. When the Session Ends

The session ends when:

- The **timer reaches 0** (including any time deducted for SYSTEM RESET), or  
- You run out of the 8 minutes in normal play.

Then:

- All system updates **stop**.
- All control buttons are **disabled**.
- **No further scoring** (no points for or against).
- The **Results** screen is shown (see [Results Screen](#14-results-screen)).

---

## 14. Results Screen

After the session ends, a full-screen **Results** overlay appears.

It shows:

- **PASS or FAIL** — Large badge (green for PASS, red for FAIL).
- **Final score** — The total points at the end.
- **Accuracy %** — Correct responses out of all required events (correct + incorrect + missed).
- **Average reaction time** — In milliseconds, for required actions where a reaction time was recorded.
- **Operator classification** — One of:
  - Excellent Operator  
  - Competent Operator  
  - Needs Improvement  
  - High Risk Operator  
  (See [Pass / Fail and Operator Classification](#16-pass--fail-and-operator-classification).)
- **Personality traits** — Five bars (0–100%): Vigilance, Compliance, Impulsivity, Stress Tolerance, Consistency. (See [Personality Traits](#15-personality-traits).)
- **Restart simulation** — Button to start a new 8-minute session (subject to 5-second cooldown; see [Restarting a Session](#18-restarting-a-session)).
- **Attempt history** — List of previous runs (date, score, status, classification) from this browser. (See [Attempt History and Clear History](#17-attempt-history-and-clear-history).)

You can only close this view by using **“Restart simulation”** (after the cooldown). There is no separate “close results” button; restarting takes you back to the main simulator screen for a new run.

---

## 15. Personality Traits

The simulator derives five **personality-style** metrics from your behaviour (all 0–100):

- **Vigilance** — Based on **reaction speed**. Faster correct responses → higher score; slower → lower.
- **Compliance** — Based on **accuracy %** (how often you did the right thing when something was required).
- **Impulsivity** — Based on **unnecessary actions**. More unnecessary presses → higher impulsivity.
- **Stress tolerance** — Based on performance in **Phase 3** (last ~2 min 40 s). Better accuracy in that high-difficulty window → higher score.
- **Consistency** — Based on **variance of your reaction times**. More consistent (low variance) → higher score.

These are for feedback and classification only; they do not change the live score during the run.

---

## 16. Pass / Fail and Operator Classification

**Pass criteria (all must be met):**

- Accuracy ≥ 70%  
- Vigilance ≥ 60  
- Impulsivity ≤ 40  
- Final score ≥ 300  

If any of these is not met, the result is **FAIL**.

**Classification (when PASS):**

- **Excellent Operator** — Score ≥ 500  
- **Competent Operator** — Score 400–499  
- **Needs Improvement** — Score 300–399  
- **High Risk Operator** — Score &lt; 300 (but still passed the four criteria above)

**Classification (when FAIL):**

- **High Risk Operator** — If impulsivity &gt; 60 or final score &lt; 0  
- **Needs Improvement** — Otherwise

So you can see both **PASS/FAIL** and a **label** that summarizes your performance.

---

## 17. Attempt History and Clear History

**Attempt history** appears **below** the main result block on the Results screen.

- Each row is one **past run** (from this browser): **date/time**, **score**, **status** (PASS/FAIL), **classification**.
- Newest runs are at the **top**.
- Data is stored in the browser (localStorage); see [Data Stored on Your Device](#19-data-stored-on-your-device-localstorage).

**Clear history:**  
There is a **“Clear history”** control near the attempt list. Click it to **delete all** stored attempts for this app in this browser. The list will empty immediately. This does not affect the current result you are viewing, only stored history.

---

## 18. Restarting a Session

- **During the run:** There is no “pause” or “restart” button; you must wait for the timer to reach 0 (or for the 8 minutes to elapse).
- **After the run:** On the Results screen, use **“Restart simulation”**.

**Restart cooldown:**  
For **5 seconds** after the results appear, **“Restart simulation”** is **disabled** and the button shows a countdown (e.g. “Restart simulation (5s)”). After 5 seconds, you can click it.

When you restart:

- Timer resets to **8:00**.
- All system values reset to safe/default.
- Score and all counters (correct, incorrect, missed, unnecessary) reset.
- Temperature spike counter resets.
- A **new** session starts; the previous run is already saved in attempt history (unless you cleared it).

---

## 19. Data Stored on Your Device (localStorage)

The simulator uses the browser’s **localStorage** (key: `dcs-simulator-results`) to store **attempt history**.

**What is stored per attempt:**

- Unique id  
- Date (ISO string)  
- Final score  
- Accuracy  
- Average reaction time  
- Personality traits (all five)  
- Classification  
- Status (PASS/FAIL)  

**When it is saved:**  
Automatically when a session **ends** (timer reaches 0 and the result is computed).

**Where it lives:**  
Only in **this browser** on **this device**. Clearing site data or using a different browser/device will remove or not show this history.

**Clear history:**  
Use **“Clear history”** on the Results screen to remove all stored attempts for this app.

---

## 20. Edge Cases and Safeguards

The app includes several protections:

- **Button cooldown (500 ms):** You cannot register a new action within 500 ms of the previous press on any control. This reduces accidental double-presses.
- **Duplicate scoring:** Each “required” event is tied to one pending action; once you act (or miss), that event is resolved and not scored again for the same occurrence.
- **System reset:** SYSTEM RESET has a 10-second cooldown and a 5-second time penalty when used correctly, so it cannot be spammed.
- **After game end:** When the timer hits 0, all buttons are disabled and no further actions are scored.
- **Intervals:** Timers and game loops are cleared when the session ends or when you leave the page, so the app does not keep updating in the background unnecessarily.

**Visual feedback:**

- **Red zones:** Panels can show a red glow and a subtle pulse when their value is in the red zone.
- **Critical overlap:** When **two or more** red conditions are active at once (e.g. temperature red and O₂ red), the **control panel grid** may briefly shake to signal higher stress.

---

## 21. Troubleshooting

**I only see the Vercel/Next.js intro.**  
- You are on the **root** URL (`/`). Go to **http://localhost:3000/simulator** or click **“Launch Simulator”** on the home page (if the home page has been updated to the simulator landing).

**Simulator page is blank or errors.**  
- Ensure you ran `npm run dev` (or equivalent) and that the terminal shows no build errors.  
- Hard-refresh the page (e.g. Ctrl+F5 or Cmd+Shift+R).  
- Check the browser console (F12 → Console) for errors.

**Timer or values don’t update.**  
- Don’t leave the tab in the background for a long time; timers can throttle. Focus the tab and continue; if the session is already over, use **Restart simulation**.

**Results or history missing.**  
- Results appear only **after** the 8-minute timer (or effective time after penalties) reaches 0.  
- History is stored in **localStorage**. If you cleared site data or use another browser/device, previous attempts will not appear. Use **“Clear history”** only if you intend to remove them.

**“Restart simulation” is disabled.**  
- Wait for the **5-second cooldown** after the results screen appears. The button will become clickable and the countdown will disappear.

**I want to run a production build.**  
- Build: `npm run build`  
- Start: `npm run start`  
- Then open **http://localhost:3000** and go to **/simulator** as above.

---

## Quick Reference — Where to Go

| Goal                    | URL or action                          |
|-------------------------|----------------------------------------|
| Run the app             | Terminal: `npm run dev`                |
| Open app in browser     | http://localhost:3000                  |
| Open simulator          | http://localhost:3000/simulator or “Launch Simulator” on home |
| Read this guide in repo | Open `SIMULATOR_GUIDE.md` in the project |

This guide covers how to run the application, why you were seeing the default Vercel intro (root vs `/simulator`), and how to use every part of the DCS Operator Assessment Simulator from start to results and restart.
