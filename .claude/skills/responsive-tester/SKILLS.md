# Responsive Tester

## Purpose
Validate responsive design and accessibility across multiple devices, browsers, and screen sizes to ensure optimal user experience.

## Used by
- frontend-engineer
- project-orchestrator

## Overview
Responsive testing is the specialized skill of validating web applications across different viewport sizes, devices, browsers, and accessibility standards. This ensures the application provides an optimal user experience regardless of how users access it, following mobile-first principles and WCAG 2.1 AA standards.

## Core Principles

### 1. Mobile-First Approach
- Design and test for mobile screens first
- Progressively enhance for larger screens
- Ensure touch-friendly interface elements
- Optimize for slower network connections

### 2. Breakpoint Strategy
```css
/* Standard Tailwind breakpoints */
sm: 640px   /* Mobile landscape, small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops, small desktops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large desktops */
```

### 3. Testing Dimensions
- **Viewport sizes**: Mobile (320px-640px), Tablet (641px-1024px), Desktop (1025px+)
- **Orientations**: Portrait and landscape
- **Device pixel ratios**: 1x, 2x, 3x (retina displays)
- **Browser compatibility**: Chrome, Firefox, Safari, Edge
- **Accessibility**: WCAG 2.1 AA compliance

## Testing Patterns

### Pattern 1: Viewport Testing
```typescript
// Automated viewport testing with Playwright
import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'Mobile', width: 375, height: 667 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Desktop', width: 1920, height: 1080 },
];

VIEWPORTS.forEach(({ name, width, height }) => {
  test(`responsive layout on ${name}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('http://localhost:3000');

    await expect(page).toHaveScreenshot(`${name}.png`);

    // Check no horizontal overflow
    const scrollWidth = await page.evaluate(() => 
      document.documentElement.scrollWidth
    );
    const clientWidth = await page.evaluate(() => 
      document.documentElement.clientWidth
    );
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});
```

### Pattern 2: Touch Target Testing
```typescript
test('touch targets meet minimum size', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });

  const buttons = await page.locator('button, a').all();

  for (const button of buttons) {
    const box = await button.boundingBox();
    
    // WCAG minimum: 44x44 CSS pixels
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
});
```

### Pattern 3: Accessibility Testing
```typescript
import AxeBuilder from '@axe-core/playwright';

test('page passes accessibility checks', async ({ page }) => {
  await page.goto('http://localhost:3000');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});
```

## Manual Testing Checklist

### Mobile Testing (320px - 640px)
```markdown
- [ ] Navigation menu collapses to hamburger
- [ ] Text is readable without zooming
- [ ] Buttons/links are at least 44x44 CSS pixels
- [ ] No horizontal scrolling
- [ ] Images scale appropriately
- [ ] Forms are usable
- [ ] Content stacks vertically
- [ ] Font sizes are at least 16px
```

### Tablet Testing (641px - 1024px)
```markdown
- [ ] Layout uses available space efficiently
- [ ] Navigation adapts appropriately
- [ ] Multi-column layouts work correctly
- [ ] Touch and mouse interactions both work
```

### Desktop Testing (1025px+)
```markdown
- [ ] Content has max-width constraint
- [ ] Hover states work
- [ ] Keyboard navigation works
- [ ] Multi-column layouts display correctly
```

## Testing Tools

### Browser DevTools
```javascript
// Chrome DevTools Device Emulation
// 1. Open DevTools (F12)
// 2. Toggle device toolbar (Ctrl+Shift+M)
// 3. Select device or set custom dimensions

// Common devices:
// - iPhone 12 Pro (390 x 844)
// - iPad Pro (1024 x 1366)
// - Galaxy S21 (360 x 800)
```

### Lighthouse Audits
```bash
# Run Lighthouse audit
npx lighthouse http://localhost:3000 --view

# Target scores: All > 90
# - Performance
# - Accessibility
# - Best Practices
# - SEO
```

## Common Issues and Fixes

### Issue 1: Horizontal Scroll on Mobile
```css
/* Problem: Fixed-width elements */
.container {
  width: 1200px; /* Too wide */
}

/* Fix: Use max-width */
.container {
  max-width: 1200px;
  width: 100%;
  padding: 0 1rem;
}
```

### Issue 2: Text Too Small
```css
/* Problem */
body {
  font-size: 12px; /* Too small */
}

/* Fix */
body {
  font-size: 16px; /* Base size */
}
```

### Issue 3: Touch Targets Too Small
```css
/* Problem */
button {
  padding: 4px 8px; /* Too small */
}

/* Fix */
button {
  min-width: 44px;
  min-height: 44px;
  padding: 12px 16px;
}
```

### Issue 4: Images Not Responsive
```html
<!-- Problem -->
<img src="image.jpg" width="800" height="600" />

<!-- Fix -->
<img 
  src="image.jpg" 
  srcset="image-400.jpg 400w, image-800.jpg 800w"
  sizes="(max-width: 640px) 100vw, 50vw"
  alt="Description"
  class="w-full h-auto"
/>
```

## Accessibility Testing

### Screen Reader Checklist
```markdown
- [ ] All images have meaningful alt text
- [ ] Form inputs have associated labels
- [ ] Buttons have descriptive text
- [ ] ARIA landmarks used
- [ ] Heading hierarchy is logical
- [ ] Focus order is logical
- [ ] Skip navigation link present
```

## Best Practices

### DO:
✅ Test on real devices when possible
✅ Use mobile-first CSS approach
✅ Implement proper semantic HTML
✅ Test with keyboard navigation
✅ Check color contrast ratios
✅ Optimize images for different screens
✅ Test with network throttling
✅ Use responsive units (rem, em, %)
✅ Implement touch-friendly interactions
✅ Test with screen readers

### DON'T:
❌ Rely solely on desktop testing
❌ Use fixed pixel widths
❌ Forget landscape orientation
❌ Skip accessibility testing
❌ Use small touch targets (< 44px)
❌ Forget to test forms on mobile
❌ Use hover-only interactions
❌ Ignore browser compatibility
❌ Skip visual regression tests

## Performance Optimization

### Image Optimization
```typescript
// Next.js Image component
import Image from 'next/image';

<Image
  src="/photo.jpg"
  width={800}
  height={600}
  alt="Description"
  priority
  placeholder="blur"
/>
```

### Code Splitting
```typescript
// Lazy load components
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
});
```

## Reporting Template

```markdown
# Responsive Testing Report

**Date**: 2024-01-09
**Application**: [App Name]

## Test Coverage
- [x] Mobile (375x667)
- [x] Tablet (768x1024)
- [x] Desktop (1920x1080)

## Results Summary
- **Pass Rate**: 95%
- **Critical Issues**: 0
- **Medium Issues**: 2
- **Accessibility Score**: 98/100

## Issues Found

### M-001: Touch targets too small
- Location: Navigation menu
- Fix: Increase padding

## Recommendations
1. Increase touch target sizes
2. Add max-width constraints
3. Optimize images
```

## Related Skills
- **Next.js Page Generator**: Creating responsive components
- **Code Generation**: Writing responsive CSS
- **Validation**: Testing implementation quality
- **Technical Documentation**: Documenting responsive requirements
