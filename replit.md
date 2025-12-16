# Network Cartographer

## Overview

Network Cartographer is an educational sandbox visualization tool designed to teach networking concepts to novices. It provides an interactive "solar system" style network map where users can explore fictional but realistic network scenarios (home IoT, small business, public WiFi) and learn about devices, IP/MAC addresses, network layers, and security concepts without touching real network data.

The application uses a full-stack TypeScript architecture with React frontend and Express backend, featuring a visual network canvas, "Layer Goggles" for viewing different network layers (Link, Network, Transport, Application), and interactive learning prompts.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React useState for local UI state
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Build Tool**: Vite with path aliases (@/ for client/src, @shared for shared)

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Server**: HTTP server with support for Vite dev middleware in development
- **API Pattern**: RESTful JSON API at /api/* endpoints
- **Data Storage**: In-memory storage using predefined scenario objects (MemStorage class)

### Data Flow
- Scenarios are defined in shared/scenarios.ts and stored in memory on server startup
- Frontend fetches scenario list via /api/scenarios, then individual scenarios via /api/scenarios/:id
- No database persistence currently - all data is static/predefined

### Key Design Decisions

**Fictional Data Only**: The app uses realistic but completely fictional network data for security training environments where real device identifiers cannot be exposed.

**Layer Goggles Pattern**: A 4-mode toggle (link/network/transport/application) that changes what information is displayed across all visualization components, teaching OSI layer concepts through interaction.

**Orbit Visualization**: Devices are rendered in concentric rings around a central router, organized by network zone (main/guest/IoT), making network topology intuitive.

**Shared Schema**: TypeScript types and Zod schemas in shared/schema.ts are used by both frontend and backend, ensuring type safety across the stack.

## External Dependencies

### Database
- **Drizzle ORM**: Configured for PostgreSQL (drizzle.config.ts points to DATABASE_URL)
- **Current State**: Database schema exists but application uses in-memory storage; Postgres can be provisioned later

### UI Components
- **shadcn/ui**: Full component library installed (Radix UI primitives + Tailwind)
- **Lucide React**: Icon library for device and UI icons

### Build & Development
- **Vite**: Frontend bundler with React plugin and Replit-specific plugins
- **esbuild**: Server bundling for production builds
- **tsx**: TypeScript execution for development

### Fonts
- System fonts only (no external dependencies): sans-serif, serif, monospace system stack
- CSP-compliant: No external font calls per strict privacy requirements

## Recent Changes (December 2024)

### Internationalization (i18n) - December 16, 2024
- Implemented react-i18next for multi-language support
- Languages: English (default), Latvian (LV), Russian (RU) for Latvia market
- Translation files in client/src/i18n/locales/{en,lv,ru}.json
- LanguageSwitcher component in header for easy language switching
- Key i18n decisions:
  - Networking terminology (IP, MAC, TCP, UDP, etc.) remains untranslated per i18n best practices
  - Browser language detection with localStorage persistence
  - Nested translation keys (app.title, layers.network, etc.)

### Events System
- Added EventNotifications component that triggers on scenario load (onEnter) and device clicks (onDeviceClick)
- Events display as dismissible toast notifications at top of screen

### Unknown Device Modal
- Added "What Would You Do?" interactive modal when clicking unknown/suspicious devices
- Three response options (Investigate, Block, Ignore) with educational feedback

### CSP Compliance
- Removed Google Fonts, using system fonts only
- Updated CSP headers to block all external calls
- Strict privacy compliance: no analytics, no third-party scripts

### Layer Visualization Improvements
- Transport layer: Shows service names (HTTP, HTTPS, SSH) instead of raw port numbers
- Application layer: Added encryption status indicators (lock/unlock icons)
- Visual legend showing encryption status on canvas