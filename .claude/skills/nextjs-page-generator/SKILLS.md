# Next.js Page Generator

## Purpose
Generate production-ready Next.js pages and components based on approved specifications and task definitions, following modern best practices and project conventions.

## Used by
- frontend-engineer

## Overview
Next.js page generation is the specialized skill of creating React Server Components, Client Components, pages, layouts, and routing structures using Next.js App Router. This skill combines React patterns, Next.js conventions, TypeScript, and Tailwind CSS to build performant, accessible, and maintainable frontend applications.

## Core Concepts

### Server vs. Client Components
```typescript
// SERVER COMPONENT (default)
// - Runs on server only
// - Can use async/await for data fetching
// - Cannot use hooks or browser APIs
// - Better performance, smaller bundle

async function ProductsPage() {
  const products = await getProducts(); // Server-side data fetch

  return (
    <div>
      <h1>Products</h1>
      <ProductList products={products} />
    </div>
  );
}

// CLIENT COMPONENT
// - Runs on client (browser)
// - Can use hooks (useState, useEffect)
// - Can use browser APIs
// - Interactive elements

'use client';

import { useState } from 'react';

function AddToCartButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await addToCart(productId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={loading}>
      {loading ? 'Adding...' : 'Add to Cart'}
    </button>
  );
}
```

## Page Generation Patterns

### Pattern 1: Simple Page
```typescript
// app/about/page.tsx
export const metadata = {
  title: 'About Us',
  description: 'Learn more about our company'
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">About Us</h1>
      <p className="text-lg text-gray-700">
        We are a company dedicated to...
      </p>
    </div>
  );
}
```

### Pattern 2: Dynamic Page with Data Fetching
```typescript
// app/products/[id]/page.tsx
import { notFound } from 'next/navigation';

interface ProductPageProps {
  params: { id: string };
}

async function getProduct(id: string) {
  const res = await fetch(`https://api.example.com/products/${id}`, {
    next: { revalidate: 60 } // Revalidate every 60 seconds
  });

  if (!res.ok) return null;
  return res.json();
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProduct(params.id);

  if (!product) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">{product.name}</h1>
      <p className="text-xl text-gray-600 mt-2">${product.price}</p>
      <p className="mt-4">{product.description}</p>

      <AddToCartButton productId={product.id} />
    </div>
  );
}

// Generate static params for static generation
export async function generateStaticParams() {
  const products = await fetch('https://api.example.com/products').then(r => r.json());
  return products.map((product: any) => ({ id: product.id }));
}
```

### Pattern 3: Form with Client Interaction
```typescript
// app/contact/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ContactPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      message: formData.get('message')
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      router.push('/contact/success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <h1 className="text-3xl font-bold mb-6">Contact Us</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-1">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            required
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  );
}
```

### Pattern 4: Layout with Navigation
```typescript
// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    template: '%s | My App',
    default: 'My App'
  },
  description: 'Welcome to My App',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navigation />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

## Component Patterns

### Reusable Card Component
```typescript
// components/Card.tsx
interface CardProps {
  title: string;
  description: string;
  imageUrl?: string;
  href?: string;
  children?: React.ReactNode;
}

export default function Card({ title, description, imageUrl, href, children }: CardProps) {
  const CardContent = () => (
    <>
      {imageUrl && (
        <img src={imageUrl} alt={title} className="w-full h-48 object-cover" />
      )}
      <div className="p-4">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
        {children}
      </div>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className="block border rounded-lg overflow-hidden hover:shadow-lg transition"
      >
        <CardContent />
      </a>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <CardContent />
    </div>
  );
}
```

### Loading State
```typescript
// app/products/loading.tsx
export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border rounded p-4">
              <div className="h-48 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Error Boundary
```typescript
// app/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h2 className="text-2xl font-bold text-red-600 mb-4">
        Something went wrong!
      </h2>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <button
        onClick={reset}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  );
}
```

## Tailwind CSS Best Practices

```typescript
// Use Tailwind utility classes
<div className="container mx-auto px-4 py-8">
  <h1 className="text-3xl font-bold text-gray-900 mb-4">Title</h1>
  <p className="text-lg text-gray-600">Description</p>
</div>

// Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards */}
</div>

// Custom components with Tailwind
<button className="btn-primary">
  {/* Define btn-primary in tailwind.config.js or globals.css */}
  Click Me
</button>
```

## Data Fetching Strategies

### 1. Server-Side Fetch (Recommended)
```typescript
async function getData() {
  const res = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 } // Cache for 1 hour
  });
  return res.json();
}

export default async function Page() {
  const data = await getData();
  return <div>{data.title}</div>;
}
```

### 2. Client-Side Fetch
```typescript
'use client';

import { useEffect, useState } from 'react';

export default function Page() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data')
      .then(r => r.json())
      .then(data => {
        setData(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  return <div>{data.title}</div>;
}
```

## Accessibility

```typescript
// Good accessibility practices
<button
  onClick={handleClick}
  aria-label="Add to cart"
  className="btn"
>
  <ShoppingCartIcon aria-hidden="true" />
  <span className="sr-only">Add to cart</span>
</button>

// Form labels
<label htmlFor="email" className="block mb-1">
  Email Address
</label>
<input
  type="email"
  id="email"
  name="email"
  required
  aria-required="true"
  aria-describedby="email-error"
  className="w-full px-3 py-2 border rounded"
/>
{error && (
  <p id="email-error" className="text-red-600 text-sm mt-1">
    {error}
  </p>
)}
```

## Best Practices

### DO:
✅ Use Server Components by default
✅ Add 'use client' only when needed (interactivity)
✅ Implement loading and error states
✅ Use TypeScript for type safety
✅ Make components responsive (mobile-first)
✅ Follow accessibility guidelines (WCAG 2.1 AA)
✅ Optimize images with next/image
✅ Use semantic HTML elements
✅ Implement proper SEO with metadata
✅ Cache API responses appropriately

### DON'T:
❌ Mark everything as 'use client'
❌ Fetch data in client components unnecessarily
❌ Ignore loading and error states
❌ Skip TypeScript types
❌ Forget mobile responsiveness
❌ Neglect accessibility
❌ Use regular <img> tags
❌ Use divs for everything
❌ Forget meta tags
❌ Over-fetch data

## Related Skills
- **Code Generation**: General coding principles
- **Validation**: Testing frontend components
- **Technical Documentation**: Documenting components
- **Responsive Testing**: Validating layouts
