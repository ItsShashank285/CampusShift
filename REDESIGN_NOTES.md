# CampusShift UI redesign notes

This update gives CampusShift a dark navy / violet glassmorphism visual system inspired by the supplied reference image.

## What changed

- Shared navigation and styling across the homepage, jobs listing, job details, student dashboard, business dashboard, and portal selection page.
- CSS motion for staggered entrance, floating hero cards, animated glow, hover lift, and responsive transitions.
- Reduced-motion accessibility through `prefers-reduced-motion`.
- Functional job filters for category, work mode, weekday/weekend shifts, and sorting by match, pay, or distance.
- Application records now store the basic job data the business dashboard displays. Older partial records are rendered with safe fallback labels.
- No new package dependency is required; animations are CSS-based.

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Notes

This is still a frontend prototype. Applications and status updates are stored in the browser's `localStorage`; they are not backed by a shared database, so different browsers/devices will not share the same data.
