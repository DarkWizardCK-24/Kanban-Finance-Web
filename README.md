# Kanban Finance System (Next.js)

A clean web app for smart wealth management. Visualize and track your savings, investments & financial goals using intuitive Kanban boards. Built with Next.js & Firebase (Auth + Firestore). Manage money better. Grow wealth faster.

Built with **Next.js 14 (App Router)**, **TailwindCSS**, **react-icons**, and **Firebase (Auth + Firestore)**. Connects to the **same Firebase project** (`kanban-finance-system`) used by the Flutter companion app, so accounts, bank cards, and transactions stay in sync in real time.

## Features

- 🔐 Firebase email/password auth (login, register, password reset)
- 🏦 Bank account CRUD with bank-specific gradient cards
- 💸 Transactions (credit / debit) per account
- 📋 Two kanban boards:
  - Per-account: drag transactions across **Pending → Processing → Completed → Failed** to update status
  - Cross-account: drag transactions between bank accounts to reassign
- 💰 Wealth dashboard (monthly inflow/outflow, net flow, category breakdown)
- 👤 Profile management
- 🌗 Always-on dark "Vault" theme with the original color palette
- 📱 Fully responsive — mobile, tablet, laptop, desktop

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build
npm start            # serve production build
```

The Firebase web config is hard-coded in `src/lib/firebase.ts` — same credentials as the Flutter app's `firebase_options.dart`.
