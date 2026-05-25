![Next.js](https://img.shields.io/badge/Next.js-black?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Drizzle](https://img.shields.io/badge/Drizzle-C5F74F?logo=drizzle&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-fbf0df?logo=bun&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green)

# Subscription Tracker

Recurring charges are easy to forget. Free trials turn into paid plans. Subscriptions accumulate across different payment methods and billing cycles, making it hard to get a clear picture of your actual monthly spend. Subscription Tracker centralizes everything — subscriptions, budgets, renewal tracking, and spending insights — in one place, and notifies you before anything slips through.

- **Subscription management** — Track every subscription with full detail: pricing, billing cycle, trial periods, taxes, discounts, payment source, and priority.
- **Budget tracking** — Set monthly or yearly spending limits with configurable warning (80%) and critical (95%) alert thresholds.
- **Automated reminders** — Get emailed before a subscription renews or a trial ends, with configurable lead time per subscription.
- **Spending insights** — Monthly spending trends, category breakdowns, spend by payment source, and upcoming renewals on a single dashboard.
- **Activity feed** — A full audit trail of every change: created, updated, renewed, cancelled, paused, price changed, and more.
- **Multi-currency** — Track subscriptions in 10 currencies with live exchange rates, all normalized to a single budget currency.
- **Financial flexibility** — Beyond standard subscriptions, also track EMI loan repayments and recurring savings deposits in the same interface.

## Stack & Architecture

### Tech Stack

| Layer         | Technology                               |
| ------------- | ---------------------------------------- |
| Framework     | Next.js (App Router), React, TypeScript  |
| Database      | PostgreSQL via Drizzle ORM               |
| UI            | Tailwind CSS, shadcn/ui, Radix UI        |
| Forms         | React Hook Form + Zod                    |
| Data fetching | TanStack React Query                     |
| Charts        | Recharts                                 |
| Email         | Resend + React Email                     |
| Auth          | JWT (HttpOnly cookie) + bcrypt           |
| Currency      | Frankfurter API (server-side, 24h cache) |

### Architecture

Next.js App Router with a clean separation between pages, components, API routes, and business logic under `src/lib/`. Database access, email sending, cron logic, currency conversion, and subscription math each live in their own modules.

Authentication is handled entirely in-house — no third-party auth provider. Users sign in with email and password; the server issues a JWT stored in an HttpOnly cookie valid for 7 days. All protected routes verify the token server-side with rate limiting applied per endpoint.

### Subscription Model

Each subscription tracks:

- **Kind** — `subscription` (standard recurring), `emi` (fixed loan repayment), or `savings` (recurring deposit)
- **Billing cycle** — weekly, monthly, quarterly, yearly, or a custom interval in days
- **Pricing** — base price, optional trial price, optional yearly price, tax, and discount amounts
- **Trial** — trial flag, trial price, and trial end date tracked separately
- **Status** — active, inactive, trial, paused, cancelled, expired, or pending
- **Reminders** — per-subscription toggle with configurable days-before setting

Monthly cost is normalized across billing cycles (e.g., a yearly plan divided by 12, a weekly plan multiplied by 52/12) so all spend comparisons use the same unit.

### Automated Jobs

A set of cron tasks run on a schedule to keep data accurate and notifications timely:

1. **Advance renewals** — Rolls `nextRenewalDate` forward for subscriptions past their due date, with catch-up logic if the cron was offline.
2. **Expire trials** — Marks trial subscriptions as `expired` once the trial end date passes.
3. **Renewal reminders** — Sends email alerts a configured number of days before the next renewal date.
4. **Trial ending alerts** — Sends email alerts when a trial ends within 3 days.
5. **Budget alerts** — Sends email when monthly spend crosses the warning or critical threshold.

Reminder emails are idempotent — a deduplication table prevents the same alert from being sent twice for the same subscription, type, and date.

### Email

Emails are sent via the Resend API using React Email templates. If `RESEND_API_KEY` is not set (e.g., in local development), the email content is logged to the console instead of being delivered — no extra setup required to run the app locally.

## Getting Started

### Prerequisites

- Bun 1.x+
- PostgreSQL database

### Installation

```bash
bun install
```

### Environment Variables

Create a `.env` file at the project root:

```env
# Required
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your-secret-key-at-least-32-characters
CRON_SECRET=your-cron-auth-token

# Optional
RESEND_API_KEY=re_...               # Email delivery; logs to console if omitted
EMAIL_FROM=no-reply@yourdomain.com  # Sender address
NEXT_PUBLIC_DEPLOYMENT_URL=https://yourapp.com
```

### Database

Run migrations to set up the schema:

```bash
bun run db:mig
```

### Development

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production

```bash
bun run build
bun run start
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the [MIT License](LICENSE).

## 🌐 Contact

[![Instagram](https://img.shields.io/badge/Instagram-%23E4405F.svg?logo=Instagram&logoColor=white)](https://instagram.com/itsdrvgo)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-%230077B5.svg?logo=linkedin&logoColor=white)](https://linkedin.com/in/itsdrvgo)
[![Twitch](https://img.shields.io/badge/Twitch-%239146FF.svg?logo=Twitch&logoColor=white)](https://twitch.tv/itsdrvgo)
[![X](https://img.shields.io/badge/X-%23000000.svg?logo=X&logoColor=white)](https://x.com/itsdrvgo)
[![YouTube](https://img.shields.io/badge/YouTube-%23FF0000.svg?logo=YouTube&logoColor=white)](https://youtube.com/@itsdrvgodev)
