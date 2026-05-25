# The 5/5/5 Ecosystem Revenue Engine

A full-stack-ready interactive MVP for diagnosing, designing, and operationalising partner-led revenue engines.

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui-style local components
- Recharts
- Supabase-ready architecture
- Vercel-ready deployment

## Features

- Premium landing page for the 5/5/5 Ecosystem Revenue Engine
- Workspace dashboard with six modules
- 20-question diagnostic across five categories
- Automatic scoring, maturity level, weakest and strongest category detection
- Category radar chart and heatmap table
- Primary bottleneck selection
- Tailored recommendations engine
- Email capture
- Strategy builder and downloadable strategy snapshot
- 45-day partner activation planner with task notes and progress
- Co-sell motion builder with pipeline table
- Revenue engine tracker with metrics, ratios, and trend chart placeholder
- Export summary as PDF using browser print with a TODO for production PDF generation

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Supabase Integration

The prototype stores state in `localStorage`. Supabase is prepared in:

```text
lib/supabase/client.ts
```

To enable persistence later, add these environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Suggested future tables:

- `workspaces`
- `diagnostic_results`
- `strategy_snapshots`
- `activation_tasks`
- `cosell_motions`
- `revenue_metrics`
- `lead_captures`

## Deployment

This project is ready for Vercel. Add Supabase environment variables only when database persistence is required.
