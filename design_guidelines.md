# Design Guidelines: Network Cartographer (Sandbox Visualizer)

## Design Approach: Material Design System

**Rationale**: Educational data visualization tool requiring clear information hierarchy, excellent interaction patterns for complex state changes (Layer Goggles), and strong accessibility support.

## Layout Architecture

**Primary Layout Structure:**

- **Top Bar (h-16)**: Scenario selector dropdown + title + Layer Goggles control
- **Main Canvas (flex-1)**: Central visualization area with network orbit view
- **Right Panel (w-96)**: Device details, learning prompts, contextual information
- **Bottom Bar (h-12)**: Active layer legend + view status indicators

**Spacing System:**
Use Tailwind units: 2, 4, 6, 8, 12, 16 for consistent rhythm

- Component padding: p-4 to p-6
- Section spacing: mb-8, gap-6 for grids
- Canvas margins: Minimal (p-2) to maximize visualization space

## Typography Hierarchy

**Font Families** (via Google Fonts CDN):

- Primary: Inter (UI elements, body text, labels)
- Monospace: JetBrains Mono (IP addresses, MAC addresses, technical identifiers)

**Type Scale:**

- H1 (Scenario Title): text-2xl font-semibold
- H2 (Device Name in Panel): text-xl font-semibold
- H3 (Section Headers): text-lg font-medium
- Body (Descriptions): text-base font-normal
- Technical Labels: text-sm font-mono
- Micro-text (Legends): text-xs

## Component Library

### Navigation & Controls

**Top Bar:**

- Scenario Selector: Custom dropdown with chevron icon (Heroicons), min-w-64
- Layer Goggles Toggle: 4-button segmented control with active state indicator
- Reset Button: Icon button (refresh icon) positioned far right

**Layer Goggles Control:**

- Horizontal button group with equal-width segments
- Active state: elevated appearance with subtle shadow
- Labels: "Link/Local", "Network", "Transport", "Application"
- Responsive: Stack vertically on mobile (hidden sm:flex)

### Visualization Canvas

**Network Map:**

- SVG-based orbit layout with router at center
- Device nodes: circular (size varies by device type)
- Connection lines: subtle, non-distracting stroke-width: 1-2
- Zones represented by concentric dashed circles
- Device icons from Heroicons (device-phone-mobile, camera, laptop, etc.)

**Interactive States:**

- Default: subtle shadow on device nodes
- Hover: scale slightly (transform scale-105), increase shadow
- Selected: prominent border, connecting line to panel
- Unknown/Flagged: pulsing animation (animate-pulse)

### Right Panel (Device Details)

**Panel Structure:**

- Sticky header with device icon + name
- Tabbed sections: "Details" | "Network Info" | "Learn"
- Scrollable content area

**Information Display:**

- Label-value pairs in definition list format
- Technical identifiers in monospace font
- Risk flags as pill badges (rounded-full px-3 py-1 text-xs)
- Collapsible sections for advanced details

### Learning Prompts

**Micro-Quiz Cards:**

- Contained within panel or as modal overlays
- Question text: text-base font-medium mb-4
- Answer options: Button grid (gap-2) with hover states
- Immediate feedback: checkmark or X icon with brief explanation
- Progress indicator: "3 of 5 prompts completed"

### Bottom Legend Bar

**Layer-Specific Legend:**

- Horizontal layout with icon + label pairs
- Updates dynamically based on active Layer Goggle mode
- Small icons (w-4 h-4) with concise text labels
- Flex layout with justify-between spacing

## Accessibility Features

**Table View Alternative:**

- Toggle button in top bar: "Switch to Table View"
- Full-width data table with sortable columns
- Columns: Device Name | Type | Network | IP | MAC | Status
- Keyboard navigation: Arrow keys to navigate rows, Enter to select

**Keyboard Shortcuts:**

- Tab: Navigate through devices
- Enter/Space: Select device
- 1-4: Switch Layer Goggles modes
- Esc: Deselect device / close panel
- R: Reset scenario

## Responsive Behavior

**Desktop (lg and above):**

- Three-column layout: Canvas center, panel right, legend bottom
- Layer Goggles as horizontal segmented control

**Tablet (md):**

- Right panel becomes slide-over drawer
- Canvas expands to near full-width
- Layer Goggles remains horizontal

**Mobile (base):**

- Full-width canvas with floating controls
- Bottom sheet for device details
- Layer Goggles as dropdown select
- Scenario selector moves to slide-out menu

## Animation Strategy

**Minimal, Purposeful Motion:**

- Device node entrance: Fade in with slight scale (duration-300)
- Layer Goggle transition: Smooth label swap (duration-200)
- Panel slide: Smooth entry/exit (transition-transform duration-300)
- No continuous animations except "Unknown Device" pulse indicator

## State Management Indicators

**Loading States:**

- Skeleton screens for device cards while scenario loads
- Spinner icon for scenario switching

**Empty States:**

- "Select a scenario to begin" message with icon
- "No device selected" in right panel with helpful prompt

**Error States:**

- Inline alerts for learning prompt incorrect answers
- Toast notifications for system messages (bottom-right, auto-dismiss)
