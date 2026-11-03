# Validation — November 3, 2026

- JavaScript syntax checks and `node scripts/verify.mjs` passed.
- Both languages render six main sections with unique IDs and valid anchor destinations.
- Twelve photo slots, three galleries and all local asset paths checked.
- Removed decorative Q label/caption and old vague Arabic phrases verified absent.
- Four muted, inline, looping video previews and four service-finder choices checked.
- Browser review: desktop Arabic; responsive frames 320 px English, 390 px Arabic and 768 px Arabic. Their inner content widths were 305, 375 and 753 px due to desktop scrollbars. No horizontal overflow after fixing the narrow header.
- Actual autoplay observed when the advertising service entered the viewport; video was muted and time advanced. Offscreen previews remained paused. Manual pause checked. Tablet autoplay also observed.
- Reduced-motion/data-saving guards and blocked-playback fallback are implemented; not tested on a physical mobile device.
- Service finder updated selected state, recommendation and destination. Mobile menu navigation and gallery next-image controls checked.
- Language switching retained a typed form value.
- Contact validation and escaping checked. Empty contact settings disable submission. Sample contact values used only inside the test context.
- No real inquiry was sent. No backend submission or analytics tracking is configured.
- Original logo, fonts, video files and photo placeholder paths retained; exact brand color tokens retained.

Still needed before a public launch: twelve real photographs, six verified contact values, and real portfolio details in place of illustrative cards. GitHub Pages serving the main branch is not changed by a draft pull request.
