# Writing Twin AI — Bug Tracker

> Log bugs here when found. One entry per bug. Move to `## Resolved` when fixed.
> **Last Updated:** 2026-05-30

---

## Format

```
### BUG-NNN — Short title
- **Found:** YYYY-MM-DD
- **Sprint Found In:** Sprint N
- **Severity:** Critical | High | Medium | Low
- **Symptoms:** What the user/developer observes
- **Root Cause:** Why it happens (fill in when known)
- **Fix:** How it was resolved (fill in when fixed)
- **Fixed In:** Sprint N / commit SHA
```

---

## 🔴 Critical (Blocks launch or causes data loss)

*None yet.*

---

## 🟠 High (Degrades core feature, no workaround)

*None yet.*

---

## 🟡 Medium (Degrades feature, workaround exists)

*None yet.*

---

## 🟢 Low (Minor UX, cosmetic, or edge case)

*None yet.*

---

## ✅ Resolved

*None yet.*

---

## Known Technical Debt (Not Bugs, But Track Here)

| Item | Sprint Added | Sprint to Fix | Notes |
|---|---|---|---|
| Google OAuth stub only | S1 | S7 | JWT auth works; OAuth deferred |
| Email verification stub only | S1 | S7 | Registration works without verification |
| No Stripe billing | — | S7 | Freemium enforced by DB flag, not payment |
| No rate limiting on DNA extraction | — | S2 | Add slowapi limit: 5 extractions/hour/user |
