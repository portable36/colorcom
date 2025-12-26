# UI Guidelines

This document describes the small design system introduced for the web frontend.

Components:
- `Button` — primary/secondary/ghost, sizes (sm, md, lg)
- `Card` — simple container with shadow and padding
- `ProductCard` — product listing card used across lists

Usage:
- Import components from `microservices/web-frontend/components`.
- Prefer accessible HTML with `aria-*` attributes for interactive widgets.

Running the component demo:
- Start the frontend locally: `cd microservices/web-frontend && npm install && npm run dev`
- Open `http://localhost:3000/components-demo` to see the components in isolation.

Next steps:
- Add Storybook for better visual testing and review
- Add unit and visual snapshot tests for components
