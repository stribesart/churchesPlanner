# Churches Planner - Design System

## General Style

The application must follow a modern SaaS UX/UI design inspired by Planning Center.

Use:
- Clean layouts
- Rounded corners
- Soft shadows
- Responsive design
- Consistent spacing
- Blue as primary color
- White cards over gradient backgrounds

---

# Colors

## Main background

```tsx
bg-gradient-to-br from-blue-50 via-white to-blue-50
```

## Primary color

```tsx
blue-700
```

Use for:
- Buttons
- Links
- Active states
- Badges
- Sidebar active items

## Text colors

Primary text:

```tsx
text-slate-900
```

Secondary text:

```tsx
text-slate-600
```

Disabled text:

```tsx
text-slate-400
```

---

# Cards

Primary card:

```tsx
rounded-2xl bg-white shadow-sm border
```

Important card:

```tsx
rounded-3xl bg-white shadow-xl
```

---

# Buttons

Primary button:

```tsx
bg-blue-700 hover:bg-blue-800 text-white rounded-full
```

Secondary button:

```tsx
border bg-white hover:bg-slate-50 rounded-full
```

---

# Inputs

```tsx
rounded-xl border-slate-200 h-11
focus:ring-2 focus:ring-blue-200
```

---

# Layout

Page wrapper:

```tsx
min-h-screen
```

Container:

```tsx
mx-auto max-w-7xl px-6
```

Spacing:

```tsx
px-6 py-20
gap-4
gap-6
gap-8
```

---

# Responsive Design

Always use responsive classes.

Breakpoints:

```tsx
sm:
md:
lg:
xl:
```

Examples:

```tsx
grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
```

```tsx
text-3xl sm:text-4xl lg:text-5xl
```

---

# UX/UI Rules

- Keep interfaces clean and minimal.
- Use consistent spacing.
- Avoid overcrowded screens.
- Prefer cards instead of plain containers.
- Use subtle hover animations.
- All pages must be mobile responsive.
- Maintain consistent paddings and margins.
- Use soft shadows instead of hard borders when possible.
- Prefer rounded corners.
- Maintain accessibility and readable contrast.
- Use reusable components whenever possible.
- Recuerda utilizar los componentes que se usan de shadcn ui

---

# Preferred Components

- shadcn/ui
- Tailwind CSS
- Lucide React icons

---

# Architecture

The project uses:
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- MongoDB

The backend and frontend live in the same Next.js project.