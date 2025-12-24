# Accessibility Notes

This project uses Tailwind and basic semantic HTML. Quick accessibility improvements added:

- Page titles and landmarks (header, nav, main) are in place.
- Buttons and links include `aria-label` when helpful for clarity (cart count, product actions).
- Focus-visible style is applied to improve keyboard navigation.

Suggestions for further improvements:
- Run axe or Lighthouse accessibility audits and fix reported issues.
- Ensure color contrast for brand colors meets WCAG AA.
- Add skip-to-content link for keyboard users.
