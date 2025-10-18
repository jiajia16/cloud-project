# SilverTrails Platform

The **SilverTrails Platform** consists of two web applications:

1. **Senior PWA** – a React + Vite-based progressive web app for seniors to explore activities, earn points, and redeem vouchers.
2. **Organizer Dashboard** – a Next.js + shadcn/ui dashboard for staff to create trails, manage participants, and view reports.

Both apps use **pnpm** for package management and must be installed separately before running.

---

##  Prerequisites

Before starting, make sure the following tools are installed on your computer:

- **Node.js** (version 18 or higher) → [Download here](https://nodejs.org)
- **pnpm** (recommended version 8 or higher) → [Install guide](https://pnpm.io/installation)

To check that everything is installed correctly, open your terminal and run:

node -v
pnpm -v


If pnpm is not installed, you can install it globally with:
npm install -g pnpm

1. pnpm install
2. cd apps/senior-pwa
3. pnpm run dev
4. cd apps/organizer-dashbaord
5. pnpm run dev 

-- The Organizer Dashboard uses: shadcn/ui for styled components. lucide-react for icons. please install if necessary. 

-- Pushing: .gitignore already excludes node_modules, .next, and other large build files — do not push these to GitHub.


