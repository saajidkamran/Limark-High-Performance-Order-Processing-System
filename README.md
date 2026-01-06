# High-Performance Order Management System

A modern, high-performance frontend application built with React and Vite, designed to handle large-scale order management with real-time updates, virtualization, and optimized rendering for datasets of 10,000+ records.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Setup & Installation](#setup--installation)
- [Project Structure](#project-structure)
- [Performance Optimizations](#performance-optimizations)
- [Virtualization](#virtualization)
- [Key Features](#key-features)
- [Testing](#testing)
- [Development Guidelines](#development-guidelines)
- [Future Enhancements](#future-enhancements)

## 🎯 Overview

This application is a high-performance order management system capable of efficiently handling and displaying large datasets (10,000+ orders) with real-time status updates, search functionality, and comprehensive analytics. The system is optimized for memory efficiency, render performance, and scalability.

### Key Capabilities

- **Large Dataset Handling**: Efficiently manages 10,000+ orders with consistent performance
- **Real-time Updates**: Live status updates and system metrics monitoring
- **Virtualized Rendering**: Only renders visible rows for optimal memory usage
- **Search & Filtering**: Fast, debounced search across customer names
- **Batch Operations**: Upload and process orders in batches with idempotency support
- **System Monitoring**: Real-time performance metrics, memory usage, and bottleneck detection
- **Stress Testing**: Built-in stress testing capabilities for performance validation

## 🛠 Tech Stack

### Core Framework
- **React 19.2.3** - Modern React with latest features
- **Vite 6.2.0** - Fast build tool and dev server
- **TypeScript 5.8.2** - Type-safe development

### State Management
- **Zustand 5.0.3** - Lightweight, performant state management
- **TanStack Query (React Query) 5.62.7** - Server state management and caching

### Routing
- **React Router DOM 7.1.3** - Client-side routing

### Performance & Rendering
- **react-window 1.8.10** - Virtualization for large lists
- **React.memo** - Component memoization
- **useMemo/useCallback** - Hook-based optimizations

### Data Visualization
- **Recharts 2.15.0** - Charts and analytics visualization

### HTTP Client
- **Axios 1.13.2** - HTTP requests with interceptors

### Testing
- **Jest 29.7.0** - Unit testing framework
- **React Testing Library 16.0.0** - Component testing utilities
- **Jest DOM** - DOM matchers for Jest

### Build & Development
- **Babel** - JavaScript transpilation
- **Vite Plugin React** - React HMR support

## 🏗 Architecture

### Design Patterns

#### 1. **Component Architecture**
- **Container/Presentational Pattern**: Separation of logic and presentation
- **Compound Components**: Reusable, composable component structures
- **Memoization Strategy**: Strategic use of `React.memo`, `useMemo`, and `useCallback`

#### 2. **State Management Architecture**

```
┌─────────────────────────────────────────┐
│         React Query (Server State)      │
│  - API calls                            │
│  - Caching & refetching                 │
│  - Background updates                   │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Zustand (Client State)          │
│  - Orders array & map                   │
│  - UI state (modals, filters)           │
│  - System metrics                       │
│  - Performance data                     │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Component Layer                 │
│  - Memoized components                  │
│  - Granular selectors                   │
│  - Optimized re-renders                 │
└─────────────────────────────────────────┘
```

#### 3. **Data Flow**

```
API Request → React Query → Zustand Store → Memoized Components
     ↓              ↓              ↓                ↓
  Caching      Background      Selective      Virtualized
              Updates         Updates         Rendering
```

#### 4. **Performance Optimization Layers**

1. **Network Layer**: React Query caching, stale-while-revalidate
2. **State Layer**: Zustand with granular selectors, batched updates
3. **Component Layer**: Memoization, virtualization, debouncing
4. **Rendering Layer**: Virtual scrolling, overscan optimization

### Key Architectural Decisions

1. **Zustand over Redux**: Lighter weight, less boilerplate, better TypeScript support
2. **React Query**: Handles server state, caching, and background sync automatically
3. **react-window**: More performant than react-virtualized for our use case
4. **Granular Selectors**: Prevents unnecessary re-renders by selecting only needed state slices
5. **Debounced Search**: Reduces computation during typing
6. **Batch Updates**: Groups state updates to prevent render thrashing

## 🚀 Setup & Installation

### Prerequisites

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher (or yarn/pnpm)
- **Backend Server**: The application expects a backend API running on `http://localhost:3002`

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd h-o-s
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (if needed)
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Start the backend server** (in a separate terminal)
   ```bash
   cd server
   npm install
   npm start
   ```

6. **Access the application**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:3002`

### Build for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## 📁 Project Structure

```
h-o-s/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ErrorBoundary.tsx # Error boundary wrapper
│   │   ├── Layout.tsx        # Main layout component
│   │   ├── OrderTable.tsx    # Virtualized order table
│   │   └── UploadModal.tsx   # Batch upload modal
│   ├── hooks/                # Custom React hooks
│   │   └── useDebounce.ts    # Debounce hook for search
│   ├── pages/                # Page components
│   │   ├── Analytics.tsx     # Analytics dashboard
│   │   ├── Dashboard.tsx     # Main dashboard
│   │   └── OrderDetail.tsx  # Order detail view
│   ├── services/             # API services
│   │   ├── api.ts            # API client & mock functions
│   │   └── api.test.ts       # API service tests
│   ├── store/                # State management
│   │   ├── store.ts          # Zustand store definition
│   │   └── store.test.ts     # Store tests
│   ├── test/                 # Test utilities
│   │   ├── integration/      # Integration tests
│   │   │   └── orderFlow.test.ts
│   │   └── setup.ts          # Test configuration
│   └── types.ts              # TypeScript type definitions
├── server/                   # Backend server (separate)
│   └── src/
│       ├── routes/           # API routes
│       ├── services/         # Business logic
│       ├── middleware/       # Express middleware
│       └── store/            # Server-side stores
├── public/                   # Static assets
├── dist/                     # Production build output
├── index.html                # HTML entry point
├── index.tsx                 # React entry point
├── App.tsx                   # Root component
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
├── jest.config.cjs           # Jest configuration
└── package.json              # Dependencies & scripts
```

## ⚡ Performance Optimizations

### 1. Virtualization

The application uses `react-window` to virtualize large lists, rendering only visible rows plus a small overscan buffer.

**Benefits:**
- Constant memory usage regardless of dataset size
- Smooth scrolling performance
- Reduced initial render time

**Implementation:**
```typescript
<List
  height={600}
  itemCount={orders.length}
  itemSize={60}
  overscanCount={5}  // Renders 5 extra rows above/below viewport
>
  {Row}
</List>
```

### 2. Component Memoization

Strategic use of `React.memo` to prevent unnecessary re-renders:

- **OrderTable**: Memoized to prevent re-renders when unrelated state changes
- **Row Component**: Custom comparison function checks if order data actually changed
- **StatusBadge**: Memoized to prevent re-renders when parent updates

### 3. Granular State Selectors

Zustand selectors are used to subscribe only to needed state slices:

```typescript
const state = useOrderStore();

const orders = useOrderStore(s => s.orders);
const ordersCount = useOrderStore(s => s.orders.length);
```

### 4. Debounced Search

Search input is debounced (300ms) to reduce filter computations:

```typescript
const debouncedSearchTerm = useDebounce(searchTerm, 300);
```

### 5. Batch State Updates

State updates are batched using `requestAnimationFrame` to prevent render thrashing:

```typescript
requestAnimationFrame(() => {
  // Multiple updates batched together
  updateOrderStatus(id1, status1);
  updateOrderStatus(id2, status2);
});
```

### 6. React Query Configuration

Optimized caching and refetching strategy:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,  // Prevents unnecessary refetches
      staleTime: 5000,              // Data considered fresh for 5s
    },
  },
});
```

### 7. Efficient Cleanup

Proper cleanup of intervals and listeners:

```typescript
useEffect(() => {
  const interval = setInterval(updateMetrics, 1500);
  return () => clearInterval(interval);  // Cleanup on unmount
}, [dependencies]);
```

### 8. Memory Management

- Limited history arrays (last 30 entries for metrics)
- Order limit cap (15,000 orders max)
- Efficient object references using maps for O(1) lookups

## 🎨 Virtualization

### How It Works

Virtualization renders only the rows visible in the viewport plus a small overscan buffer. This dramatically reduces DOM nodes and memory usage.

```
┌─────────────────────────────────┐
│  Header (fixed)                  │
├─────────────────────────────────┤
│  Row 0  ← overscan (hidden)     │
│  Row 1  ← overscan (hidden)     │
│  Row 2  ← overscan (hidden)     │
│  Row 3  ← overscan (hidden)     │
│  Row 4  ← overscan (hidden)     │
├─────────────────────────────────┤ ← Viewport Start
│  Row 5  ← VISIBLE               │
│  Row 6  ← VISIBLE               │
│  Row 7  ← VISIBLE               │
│  ...                            │
│  Row 14 ← VISIBLE               │
├─────────────────────────────────┤ ← Viewport End
│  Row 15 ← overscan (hidden)     │
│  Row 16 ← overscan (hidden)     │
│  Row 17 ← overscan (hidden)     │
│  Row 18 ← overscan (hidden)     │
│  Row 19 ← overscan (hidden)     │
└─────────────────────────────────┘
```

### Configuration

- **Item Height**: 60px (fixed for consistent scrolling)
- **Overscan Count**: 5 rows (renders 5 extra rows above/below viewport)
- **Viewport Height**: 600px
- **Total Visible Rows**: ~10 rows at a time

### Benefits

1. **Memory Efficiency**: Only ~15-20 DOM nodes instead of 10,000+
2. **Fast Initial Render**: Renders in milliseconds regardless of dataset size
3. **Smooth Scrolling**: 60fps scrolling performance
4. **Scalability**: Performance remains constant as data grows

## ✨ Key Features

### 1. Order Management
- View orders in a virtualized table
- Real-time status updates
- Quick actions (approve/reject)
- Order detail view with full information

### 2. Search & Filtering
- Real-time search by customer name
- Debounced input for performance
- Case-insensitive matching
- Live result count

### 3. Batch Operations
- Upload orders via JSON file
- Generate test data (1k orders)
- Idempotency support for duplicate prevention
- Batch processing with progress tracking

### 4. System Monitoring
- Real-time performance metrics
- Memory usage tracking
- Throughput monitoring (RPS)
- Latency tracking
- System health percentage
- Bottleneck detection and logging

### 5. Analytics Dashboard
- Visual charts for throughput
- Latency trends
- System health indicators
- Historical data visualization

### 6. Stress Testing
- Built-in stress test mode
- Simulates high-load scenarios
- Performance degradation monitoring
- Bottleneck identification

## 🧪 Testing

### Current Test Coverage

The project includes unit tests for:
- ✅ API services (`src/services/api.test.ts`)
- ✅ Store logic (`src/store/store.test.ts`)
- ✅ Integration tests (`src/test/integration/orderFlow.test.ts`)

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Configuration

- **Framework**: Jest with jsdom environment
- **Utilities**: React Testing Library
- **Coverage**: Configured to collect coverage from `src/**/*.{ts,tsx}`

### Pending Test Implementation

The following testing areas are **pending implementation**:

#### 1. **Playwright E2E Tests**
- End-to-end user flows
- Cross-browser testing
- Visual regression testing
- Performance benchmarking

**Planned Test Scenarios:**
- Complete order upload flow
- Search functionality
- Status update workflows
- Navigation between pages
- Stress test mode activation
- Large dataset rendering performance

#### 2. **Integration Tests**
- API integration testing
- WebSocket/SSE connection testing
- Real-time update flows
- Error handling scenarios
- Batch operation workflows

**Setup Required:**
```bash
# Install Playwright (when implementing)
npm install -D @playwright/test
npx playwright install
```

**Example Integration Test Structure:**
```typescript
// tests/e2e/order-management.spec.ts
test('should upload and display orders', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="upload-button"]');
  // ... test implementation
});
```

## 📝 Development Guidelines

### Code Style

- **TypeScript**: Strict mode enabled
- **Components**: Functional components with hooks
- **Naming**: PascalCase for components, camelCase for functions/variables
- **File Structure**: One component per file, co-located tests

### Performance Best Practices

1. **Always use memoization** for expensive computations
2. **Use granular selectors** when accessing Zustand store
3. **Debounce user inputs** that trigger heavy operations
4. **Batch state updates** when possible
5. **Clean up intervals/listeners** in useEffect cleanup
6. **Measure performance** using React DevTools Profiler
7. **Monitor memory usage** in browser DevTools

### Component Design Principles

1. **Single Responsibility**: Each component has one clear purpose
2. **Composition over Inheritance**: Build complex UIs from simple components
3. **Props Interface**: Define clear TypeScript interfaces for props
4. **Memoization Strategy**: Memoize at the right level (not everything)
5. **Extensibility**: Design components to support future features (pagination, sorting, filtering)

### State Management Guidelines

1. **Server State**: Use React Query for API data
2. **Client State**: Use Zustand for UI state and derived data
3. **Local State**: Use `useState` for component-specific state
4. **Avoid Prop Drilling**: Use Zustand or Context for deeply nested props

### Adding New Features

1. **Create types** in `src/types.ts`
2. **Add API methods** in `src/services/api.ts`
3. **Update store** if global state is needed
4. **Create components** following the existing patterns
5. **Add tests** for new functionality
6. **Update README** if architecture changes

## 🔮 Future Enhancements

### Planned Features

1. **Pagination**
   - Server-side pagination support
   - Infinite scroll option
   - Page size configuration

2. **Advanced Filtering**
   - Filter by status, date range, amount
   - Multi-criteria filtering
   - Saved filter presets

3. **Sorting**
   - Column-based sorting
   - Multi-column sorting
   - Sort persistence

4. **Data Streaming**
   - WebSocket integration for real-time updates
   - Server-Sent Events (SSE) support
   - Optimistic updates

5. **Export Functionality**
   - CSV export
   - PDF reports
   - Excel export

6. **Advanced Analytics**
   - Custom date range selection
   - Comparative analytics
   - Export analytics data

7. **Accessibility**
   - ARIA labels and roles
   - Keyboard navigation
   - Screen reader support

8. **Internationalization**
   - Multi-language support
   - Locale-specific formatting
   - RTL language support

### Performance Improvements

1. **Service Worker**: Offline support and caching
2. **Code Splitting**: Route-based code splitting
3. **Lazy Loading**: Lazy load heavy components
4. **Image Optimization**: Optimize and lazy load images
5. **Bundle Analysis**: Regular bundle size monitoring

### Testing Enhancements

1. **Playwright E2E Tests**: Complete user flow testing
2. **Visual Regression**: Screenshot comparison tests
3. **Performance Testing**: Lighthouse CI integration
4. **Load Testing**: Stress test automation
5. **Accessibility Testing**: Automated a11y checks

## 🔧 Troubleshooting

### Common Issues

**Issue**: Slow rendering with large datasets
- **Solution**: Ensure virtualization is enabled and overscan is optimized

**Issue**: Memory leaks
- **Solution**: Check for proper cleanup in useEffect hooks

**Issue**: Stale data
- **Solution**: Adjust React Query staleTime or invalidate queries

**Issue**: Excessive re-renders
- **Solution**: Use React DevTools Profiler to identify causes, add memoization

## 📄 License

[Add your license information here]

## 👥 Contributors

[Add contributor information here]

---

**Note**: This application is optimized for handling large datasets efficiently. For best performance, ensure your backend API is also optimized for high-throughput scenarios.

