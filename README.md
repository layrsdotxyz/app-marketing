# Predifi Marketing Site — hedera-marketing
# Next.js 15, predifi.com

## Routes
- `/` — Landing page (GSAP animations, waitlist CTA)
- `/waitlist` — GetWaitlist signup
- `/pwi` — Predifi World Index placeholder
- `/blog` — Blog index (ISR, marketing agent)
- `/blog/[slug]` — Blog post (slug: `DD-month-YYYY-topic`)
- `/privacy` — Privacy Policy
- `/tos` — Terms of Service

## Development

```bash
cp .env.example .env.local
npm install
npm run dev
# → http://localhost:3000
```

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_WAITLIST_ID` | GetWaitlist widget ID (default: 32647) |
| `NEXT_PUBLIC_APP_URL` | dApp URL (default: https://app.predifi.com) |

## Stack
- **Next.js 15** — App Router, ISR
- **React 19** — Server + Client components
- **GSAP 3** — Landing page animations (client-side only)
- **framer-motion** — Page transitions
- **next-themes** — Dark mode
- **Tailwind CSS** — Predifi design system
- **Sonner** — Toast notifications

## Deployment
Target: `predifi.com`
dApp lives at: `app.predifi.com` (`hedera-dapp-ui` repo)
