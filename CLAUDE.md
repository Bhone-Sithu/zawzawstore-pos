# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ZawZaw Store POS & Inventory Management System

This is a Next.js 15 application built with TypeScript, React 19, and Tailwind CSS 4. It's a multi-branch retail POS system with role-based access control for Admin, Cashier, and Boss roles.

## Theme

This application is built with Tailwind CSS 4 and shadcn/ui components. The theme is light mode with a modern and clean design. The primary color is orange. As a POS system, the design should be simple and easy to use.

## How to write code

Think like a senior software engineer and write code that is maintainable, readable, and scalable. Use React/NextJS best practices and write clean, concise, and efficient code.

## Development Commands

```bash
# Development server with Turbopack
pnpm dev

# Build the application
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint
```

## Architecture Overview

### Authentication & Authorization

- **Authentication**: Clerk.js integration with custom login page at `/login`
- **Authorization**: Role-based access control (RBAC) with middleware enforcement
- **Roles**: admin, cashier, boss with specific route permissions:
  - admin: `/admin`, `/dashboard`
  - cashier: `/pos`, `/dashboard`
  - boss: `/reports`, `/dashboard`
- **Middleware**: `middleware.ts` handles route protection and role-based redirects

### Database Architecture

- **Database**: Supabase PostgreSQL with custom types and schemas
- **Schema Location**: `/database/schema.sql` and setup scripts (`setup-step1.sql` through `setup-step5.sql`)
- **Key Entities**: branches, users, products, categories, inventory, transactions, stock_transfers
- **Bilingual Support**: Products and categories have both English (`_en`) and Myanmar (`_mm`) fields

### Application Structure

- **App Router**: Next.js 15 app directory structure
- **Main Routes**:
  - `/` - Landing page
  - `/login` - Custom login page
  - `/admin` - Admin dashboard and management
  - `/pos` - Point of sale interface for cashiers
  - `/reports` - Reporting dashboard for bosses
  - `/dashboard` - Common dashboard accessible by all roles
  - `/access-denied` - Access denied page

### Component Architecture

- **UI Components**: Radix UI components in `/components/ui/` (shadcn/ui pattern)
- **Business Components**: Domain-specific components in `/components/`
  - `/components/inventory/` - Inventory management components
- **Styling**: Tailwind CSS 4 with custom configuration

### Data Layer

- **Database Client**: Supabase client in `/lib/supabase.ts`
- **Type Definitions**: Comprehensive TypeScript types in `/types/database.types.ts`
- **Auth Utils**: Authentication utilities in `/lib/auth-utils.ts`

## Key Features & Business Logic

### Multi-Branch Operations

- Support for 3 store locations (Rawang, Kuala Lumpur, Sungai Buloh)
- Branch-specific inventory management
- Inter-branch stock transfers with approval workflow

### Inventory Management

- Low stock alerts (threshold: 3 items or less)
- Barcode scanning integration
- Stock transfer between branches with pending/complete workflow
- Automatic quantity updates without duplication for same barcodes

### POS System

- Barcode scanning for checkout
- Staff item tracking (monthly consumption tracking)
- Transaction processing with multiple payment methods

### Reporting & Analytics

- Daily, weekly, monthly, and yearly sales reports
- Branch performance comparisons
- Staff performance metrics

## Development Guidelines

### Type Safety

- All database entities have TypeScript interfaces
- Custom enums for user roles, transaction status, and transfer status
- Strict TypeScript configuration enabled

### Authentication Flow

1. User accesses protected route
2. Middleware checks authentication via Clerk
3. If authenticated, fetch user role from Supabase users table
4. Validate role permissions for requested route
5. Redirect to appropriate default route if unauthorized

### Database Schema Updates

- Use the setup scripts in `/database/` for schema changes
- Run scripts in sequence (step1 through step5)
- Add new users via `/scripts/add-user.sql`

### Internationalization

- All user-facing content should support English and Myanmar
- Use `_en` and `_mm` suffixes for bilingual database fields
- Product names, categories, and descriptions require both languages

## Environment Variables Required

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- Clerk authentication environment variables

## Testing & Quality Assurance

- ESLint configuration via `eslint.config.mjs`
- TypeScript strict mode enabled
- Always run `pnpm lint` before committing changes

## Path Aliases

- `@/*` maps to the root directory for cleaner imports
