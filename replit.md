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
- **API Pattern**: RESTful JSON API at /api/\* endpoints
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

- **Production-ready i18n for Latvia market launch**
- Languages: English (default), Latvian (LV), Russian (RU)
- **366 translation keys** validated across all locales
- Translation files in client/src/i18n/locales/{en,lv,ru}.json
- LanguageSwitcher component in header for easy language switching
- **Fully localized components**:
  - DeviceFilter: Search placeholder, filter labels, results count
  - LearningPrompts: Quiz UI, progress, scoring, layer badges
  - ScenarioSelector: Scenario titles via scenarioIdToKey mapping
  - ScenarioComparison: Scenario titles/descriptions, metrics labels, zone names, device types
  - EventNotifications: Event messages with scenario-specific lookups
  - NetworkCanvas: Scenario title in info overlay, zone labels, encryption status, security aria-labels
  - LayerGoggles: Legend items (encryption status, data flow indicators)
  - PacketJourney: Step descriptions, timeline labels, connection types
  - UnknownDeviceModal: Response options, feedback, educational content
- **Key i18n decisions**:
  - Networking terminology (IP, MAC, TCP, UDP, etc.) remains untranslated per i18n best practices
  - Browser language detection with localStorage persistence
  - Nested translation keys (app.title, layers.network, filter.searchPlaceholder, etc.)
  - i18next native pluralization syntax for Russian's 4 forms (\_one, \_few, \_many, \_other)
  - Scenario content (titles, descriptions, event messages) fully translated in all 3 languages
- **Dev-mode features**:
  - Missing translation highlighting: shows [MISSING: key] in UI
  - Console warnings for missing keys via missingKeyHandler
  - saveMissing enabled for development debugging
- **i18n Tooling** (Checklist Section B compliant):
  - `i18next-scanner.config.cjs`: Scanner config for extracting keys from code
  - `scripts/i18n-validate.js`: Validation script that checks:
    - Key parity across all locales (EN, LV, RU) - fails CI on missing keys
    - No empty translation values - fails CI on empty values
    - Placeholder consistency ({{var}}) between languages - fails CI on mismatch
    - Proper handling of plural suffixes (\_one, \_few, \_many, \_other)
  - **i18n Commands** (run from project root):
    - `i18n:extract`: `npx i18next-scanner --config i18next-scanner.config.cjs`
    - `i18n:validate`: `node scripts/i18n-validate.js`
    - `i18n:check` (extract + validate): Run both commands sequentially
- **Translation Glossary**: `docs/i18n-glossary.md` defines consistent terminology across locales
- **Fallback Chain**: localStorage → navigator → lv → en (Latvia market default)

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

### Code Quality Improvements - December 16, 2024

- **Memory leak fix**: ScenarioExportImport.tsx now properly cleans up setTimeout references
- **DRY improvement**: scenarioIdToKey mapping extracted to `client/src/lib/scenarioUtils.ts` - all components now import from shared utility
- **Dead code removal**: Removed unused user authentication types from shared/schema.ts
- **Input validation**: Added Zod validation for /api/scenarios/:id route parameter
- **Error handling**: Added ErrorBoundary component inside QueryClientProvider for graceful error recovery
- **Type safety**: Replaced `any` with proper Environment type in home.tsx
- **Localization**: Reset button, footer descriptions now use translation keys

### Translation Mapping Utilities - December 16, 2024

- **Centralized utilities in `client/src/lib/scenarioUtils.ts`**:
  - `scenarioIdToKey`: Maps scenario IDs to translation keys (familyIoT, smallBusiness, hotelPublic)
  - `deviceLabelToKey`: Maps 28 device labels to translation keys (e.g., "Home Router" → "homeRouter")
  - `promptIdToKey`: Maps 14 learning prompt IDs to translation keys (e.g., "prompt_private_ip" → "privateIp")
- **Device labels now fully translated** in all 3 languages:
  - Used in: NetworkCanvas, DeviceDetailsPanel, TableView, EventNotifications, UnknownDeviceModal, ScenarioComparison
  - Translation path: `deviceLabels.{key}` (e.g., `deviceLabels.homeRouter`)
- **Learning prompts fully translated** in all 3 languages:
  - Questions, answers (array indexed), and explanations
  - Translation path: `learningPrompts.{key}.{question|answers.N|explanation}`
- **299 translation keys** validated across all locales (up from 271)

### Security Hardening - December 16, 2024

- **CSP Security**: Content-Security-Policy now uses strict policy in production (no 'unsafe-inline' or 'unsafe-eval'); development mode allows these for Vite HMR/dev tools
- **Production Logging**: ErrorBoundary console.error now gated behind development mode check to prevent stack trace leakage
- **Pattern**: All environment-specific behavior uses `import.meta.env.DEV` (frontend) or `process.env.NODE_ENV` (backend)

### Visual UI Fixes - December 16, 2024

- **Encryption Icon Positioning**: Fixed Application layer encryption icons overlapping device nodes; icons now positioned clearly outside node bounds
- **Mobile Layout**: Fixed 1px horizontal overflow on mobile viewports (375px) by adding overflow-x-hidden to root container
- **Verified**: Device panel risk badges properly spaced, Learning prompts layout correct, Filter popover displays properly

### Educational Onboarding System - December 17, 2024

- **Network Discovery Mission**: Spotlight-based guided tutorial system that teaches (not just shows) each part of the application
- **6 Chapters, 18 Steps**:
  1. Mission Briefing: Welcome and educational overview
  2. Network Map Understanding: Explains solar system visualization metaphor
  3. Scenario Selection: User must select a scenario (gated step)
  4. Layer-by-Layer Exploration: Explores Link, Network, Transport, Application layers (4 gated steps)
  5. Device Investigation: User must click a device to see details (gated step)
  6. Knowledge Testing: Explains learning prompts and quizzes
- **Components**:
  - `SpotlightOverlay.tsx`: Dark overlay with cutout highlighting for target elements
  - `OnboardingProvider.tsx`: React context managing onboarding state and step progression
- **Gating Logic**: Interactive steps require user action (scenario select, layer toggle, device click) before advancing
- **Accessibility**: ARIA dialog roles, reduced-motion support, keyboard navigation
- **localStorage Persistence**: `network-cartographer-onboarding` key stores completion state
- **Full i18n Support**: All 18 steps translated in EN, LV, RU (366 total keys validated)
- **Key data-testid Attributes**:
  - `scenario-selector`, `select-scenario`
  - `layer-goggles`, `layer-button-{link|network|transport|application}`
  - `network-canvas`, `device-details-panel`, `learning-prompts`
  - `onboarding-tooltip`, `button-onboarding-{next|prev|skip}`
