# Simplicity Investing — website revamp

A modern, fast, zero-dependency redesign of [simplicityinvesting.com](https://www.simplicityinvesting.com/).

## Run locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

No build step. You can deploy it as-is to GitHub Pages, Netlify, Vercel or any static host.

## What's in it

| Area | What it does |
|---|---|
| Hero | Short promise ("Wealth, made simple."), two CTAs and credentials (AMFI ARN-87401, since 2011) |
| Solutions | 8 goal-first services, including the new SEBI **Specialized Investment Funds (SIF)** category |
| Goal planner | Inflation-adjusted goal cost, **step-up SIP** solver and live projection chart |
| Money health check | 5-question quiz that gives a score and tips for the gaps it finds |
| What's new | SIFs, GIFT City, step-up SIPs, Account Aggregator, nominations, fraud safety |
| About / values | Personalised · Objective · Transparent · Simple |
| Insights, FAQ, Contact | Knowledge bank cards, FAQ (with schema) and a lead form |
| Compliance footer | ARN, CIN, SEBI SCORES / SMART ODR links, the standard mutual fund risk disclaimer |

## Built-in modern practices

- **AI search (GEO/AEO):** `FinancialService` + `FAQPage` JSON-LD, `llms.txt`, and `robots.txt` that allows AI crawlers
- **Accessibility:** skip link, visible focus, ARIA live regions, `prefers-reduced-motion`, semantic landmarks
- **Themes:** light and dark modes that follow system preference, with a manual toggle
- **Performance:** no framework, about 30 KB of HTML/CSS/JS, inline SVG instead of images
- **Mobile-first:** checked at 390 px with no horizontal scroll

## Before go-live (TODO)

1. **Content:** swap placeholder insight articles, team details and contact info for real ones. The live site could not be crawled from the build environment.
2. **Lead form:** connect `#contact-form` to a CRM or WhatsApp Business API. It is front-end only today.
3. **Compliance review:** check all copy against the SEBI/AMFI MFD code of conduct. In particular, an MFD should not present itself as an "adviser" (see the note on the company's LinkedIn name, "…Advisors…").
4. **Analytics:** add consent-aware analytics and track planner and quiz completions as conversion events.
5. **Images:** add an OG share image (1200×630) and real team photos.
