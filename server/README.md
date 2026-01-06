# Order Processing Backend Server

A high-performance, scalable backend server built with **Fastify** for processing large batches of orders with idempotency, caching, and real-time streaming capabilities.

## 📋 Table of Contents

- [Overview](#overview)
- [Why Fastify Instead of Express?](#why-fastify-instead-of-express)
- [Architecture](#architecture)
- [Core Features](#core-features)
- [Setup & Installation](#setup--installation)
- [API Endpoints](#api-endpoints)
- [Idempotency](#idempotency)
- [In-Memory Cache](#in-memory-cache)
- [Validation Layer](#validation-layer)
- [Processing Layer](#processing-layer)
- [Batch Processing Flow](#batch-processing-flow)
- [Middleware Architecture](#middleware-architecture)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Performance Considerations](#performance-considerations)

## 🎯 Overview

This backend server is designed to handle high-throughput order processing with:
- **Batch Processing**: Efficiently processes thousands of orders in configurable batches
- **Idempotency**: Prevents duplicate processing using idempotency keys
- **Caching**: In-memory cache for fast order lookups
- **Real-time Streaming**: Server-Sent Events (SSE) for live order updates
- **Validation**: Multi-layer validation for data integrity
- **Stress Testing**: Built-in stress testing capabilities

## 🚀 Why Fastify Instead of Express?

### Performance Benefits

**Fastify** was chosen over Express for several critical performance reasons:

1. **2x Faster Request Handling**
   - Fastify uses a highly optimized JSON parser
   - Faster route matching with a radix tree router
   - Lower overhead per request

2. **Built-in Schema Validation**
   - Native JSON Schema validation support
   - Automatic request/response validation
   - Type-safe route definitions

3. **Better TypeScript Support**
   - First-class TypeScript support
   - Better type inference for routes and middleware
   - Compile-time type safety

4. **Async/Await Native**
   - Built from the ground up for async/await
   - No callback overhead
   - Better error handling with async hooks

5. **Plugin Architecture**
   - Lightweight plugin system
   - Better code organization
   - Encapsulation and reusability

6. **Lower Memory Footprint**
   - More efficient memory usage
   - Better garbage collection patterns
   - Optimized for high-concurrency scenarios

### Benchmark Comparison

```
Express:  ~15,000 req/s
Fastify:  ~30,000+ req/s  (2x faster)
```

For a high-throughput order processing system handling 10,000+ orders, this performance difference is critical.

### Code Example: Fastify vs Express

**Express (Traditional):**
```javascript
app.post('/api/orders/batch', (req, res) => {
  // Manual validation
  // Manual error handling
  // Callback-based
});
```

**Fastify (Our Implementation):**
```typescript
app.post('/batch', {
  preHandler: [idempotencyMiddleware, validateOrdersBatchMiddleware],
}, async (req, reply) => {
  // Type-safe request
  // Automatic validation
  // Async/await native
  // Better error handling
});
```

## 🏗 Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Request                        │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│              Fastify Server (Port 3002)                 │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Middleware Layer (Validation)             │  │
│  │  - Idempotency Middleware                         │  │
│  │  - Order Validation Middleware                    │  │
│  │  - ID Validation Middleware                      │  │
│  └──────────────────┬────────────────────────────────┘  │
│                     ↓                                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │            Route Handlers                          │  │
│  │  - POST /api/orders/batch                         │  │
│  │  - GET  /api/orders/:id                           │  │
│  │  - PUT  /api/orders/:id/status                    │  │
│  │  - GET  /api/orders/stream                        │  │
│  └──────────────────┬────────────────────────────────┘  │
│                     ↓                                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Service Layer (Business Logic)            │  │
│  │  - Order Service                                  │  │
│  │  - Stream Service                                │  │
│  │  - Stress Test Service                           │  │
│  └──────────────────┬────────────────────────────────┘  │
│                     ↓                                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Store Layer (Data Access)                 │  │
│  │  - OrderStore (In-memory Map)                    │  │
│  │  - OrderCacheStore (TTL-based cache)             │  │
│  │  - IdempotencyStore (Response cache)            │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
Request → Middleware → Route → Service → Store → Response
   ↓         ↓          ↓        ↓        ↓        ↓
Validate  Idempotency Process  Cache   Update   Stream
```

## ✨ Core Features

### 1. Batch Processing
- Configurable batch sizes (default: 100, max: 1000)
- Sequential batch processing for consistency
- Progress tracking and error aggregation
- Environment-based configuration

### 2. Idempotency
- Industry-standard idempotency key support
- Prevents duplicate processing
- Cached responses for retries
- 24-hour TTL for idempotency keys

### 3. In-Memory Caching
- Fast order lookups with cache hit/miss tracking
- TTL-based expiration (5 minutes default)
- Automatic cache invalidation on updates
- Cache age headers for monitoring

### 4. Real-time Streaming
- Server-Sent Events (SSE) for live updates
- Order creation and status change events
- Heartbeat mechanism for connection health
- Automatic cleanup on disconnect

### 5. Multi-Layer Validation
- Request shape validation
- Order structure validation
- Batch size validation
- ID format validation

## 🚀 Setup & Installation

### Prerequisites

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **TypeScript**: v5.9.3 or higher

### Installation

1. **Navigate to server directory**
   ```bash
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set environment variables** (optional)
   Create a `.env` file:
   ```env
   PORT=3002
   HOST=0.0.0.0
   BATCH_SIZE=100
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   npm start
   ```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3002` | Server port |
| `HOST` | `0.0.0.0` | Server host |
| `BATCH_SIZE` | `100` | Default batch size for processing |

## 📡 API Endpoints

### POST `/api/orders/batch`

Upload and process a batch of orders.

**Headers:**
- `Idempotency-Key`: Required. Unique key for idempotency (UUID or alphanumeric, 1-128 chars)

**Request Body:**
```json
[
  {
    "id": "ORD-10001",
    "status": "PENDING",
    "amount": 150.50,
    "createdAt": 1234567890,
    "updatedAt": 1234567890
  }
]
```

**Response:**
```json
{
  "success": true,
  "total": 1000,
  "processed": 950,
  "failed": 50,
  "batches": 10,
  "batchResults": [...]
}
```

### GET `/api/orders/:id`

Get order by ID with caching.

**Response Headers:**
- `X-Cache`: `HIT` or `MISS`
- `X-Cache-Age`: Cache age in seconds (if cached)

**Response:**
```json
{
  "id": "ORD-10001",
  "status": "PENDING",
  "amount": 150.50,
  "createdAt": 1234567890,
  "updatedAt": 1234567890
}
```

### PUT `/api/orders/:id/status`

Update order status.

**Request Body:**
```json
{
  "status": "PROCESSING"
}
```

### GET `/api/orders/stream`

Server-Sent Events stream for real-time order updates.

**Events:**
- `order.created`: New order created
- `order.statusChanged`: Order status updated
- `heartbeat`: Connection health check (every 30s)

## 🔄 Idempotency

### What is Idempotency?

Idempotency ensures that making the same request multiple times produces the same result. This is critical for:
- **Network retries**: Safe to retry failed requests
- **Duplicate prevention**: Prevents processing the same batch twice
- **Client reliability**: Clients can safely retry without side effects

### Implementation

#### 1. **Idempotency Key Requirement**

Every batch request **must** include an `Idempotency-Key` header:

```typescript
headers: {
  'Idempotency-Key': '550e8400-e29b-41d4-a716-446655440000'
}
```

#### 2. **Key Validation**

The middleware validates:
- Key exists (required)
- Format: 1-128 alphanumeric characters, hyphens, underscores
- Pattern: `/^[a-zA-Z0-9_-]{1,128}$/`

#### 3. **Response Caching**

When a request with an idempotency key is processed:
1. Check if key exists in `IdempotencyStore`
2. If found, return cached response immediately
3. If not found, process request and cache the response
4. Cache includes: response body, status code, timestamp

#### 4. **TTL and Cleanup**

- **TTL**: 24 hours (configurable)
- **Cleanup**: Automatic cleanup every hour
- **Storage**: In-memory Map (production: use Redis)

### Flow Diagram

```
Client Request with Idempotency-Key
           ↓
    [Idempotency Middleware]
           ↓
    Key exists in store?
    ├─ YES → Return cached response (same status code)
    └─ NO  → Process request
                  ↓
           Cache response
                  ↓
          Return response
```

### Example Usage

```typescript
// First request
POST /api/orders/batch
Headers: { 'Idempotency-Key': 'abc123' }
Body: [1000 orders]
→ Processes orders, returns result, caches response

// Retry with same key (network error, timeout, etc.)
POST /api/orders/batch
Headers: { 'Idempotency-Key': 'abc123' }
Body: [1000 orders]
→ Returns cached response immediately (no processing)
```

### Industry Standards

This implementation follows patterns used by:
- **Stripe**: Uses idempotency keys for all POST requests
- **PayPal**: Idempotency for payment processing
- **AWS**: Idempotency tokens for API operations

## 💾 In-Memory Cache

### Purpose

The in-memory cache (`OrderCacheStore`) provides:
- **Fast lookups**: O(1) order retrieval
- **Reduced store access**: Minimize direct Map lookups
- **Performance monitoring**: Cache hit/miss tracking

### Implementation

#### Cache Structure

```typescript
interface OrderCacheEntry {
  order: Order;
  timestamp: number;    // When cached
  expiresAt: number;    // When it expires
}
```

#### Cache Operations

1. **Get**: Check cache, return if valid, otherwise fetch from store
2. **Set**: Cache order with TTL (default: 5 minutes)
3. **Invalidate**: Remove from cache (on updates)
4. **Cleanup**: Automatic cleanup every minute

### Cache Flow

```
GET /api/orders/:id
      ↓
Check OrderCacheStore
      ↓
  Cache Hit?
  ├─ YES → Return cached order + X-Cache: HIT
  └─ NO  → Fetch from OrderStore
              ↓
         Cache the order
              ↓
      Return order + X-Cache: MISS
```

### Cache Invalidation

Cache is automatically invalidated when:
- Order status is updated
- Order is modified

This ensures data consistency.

### TTL Configuration

- **Default TTL**: 5 minutes (300,000ms)
- **Configurable**: Can be adjusted per cache entry
- **Cleanup**: Expired entries removed every minute

### Why In-Memory?

**Current Implementation**: In-memory Map
- Fast: No network overhead
- Simple: No external dependencies
- Suitable for: Single-server deployments, development

**Production Recommendation**: Redis
- Distributed caching
- Persistence across restarts
- Better for multi-server deployments

## ✅ Validation Layer

The validation layer ensures data integrity through multiple validation stages.

### Validation Middleware Stack

```
Request
  ↓
[Idempotency Middleware]     → Validates idempotency key
  ↓
[Validate Orders Batch]      → Validates request shape
  ↓
[Validate Order ID]          → Validates ID format (for GET/PUT)
  ↓
Route Handler
```

### 1. `validateBatchSize()`

Validates batch size using environment configuration.

**Location**: `src/validators/order.validator.ts`

**Function**:
```typescript
validateBatchSize(batchSize?: number): BatchSizeValidation
```

**Validation Rules**:
- Must be a number
- Minimum: 1
- Maximum: 1000
- Defaults to `BATCH_SIZE` env var or 100

**Returns**:
```typescript
{
  valid: boolean;
  error?: string;
  batchSize: number;  // Validated batch size to use
}
```

### 2. `validateOrder()`

Validates single order structure.

**Location**: `src/validators/order.validator.ts`

**Function**:
```typescript
validateOrder(order: Order): boolean
```

**Validation Rules**:
- `id`: Required, must be string
- `status`: Must be one of: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`
- `amount`: Must be number, >= 0
- `createdAt`: Must be number, > 0
- `updatedAt`: Must be number, > 0

**Returns**: `true` if valid, `false` otherwise

### 3. `validateOrdersInput()`

Validates request body shape (middleware).

**Location**: `src/middleware/ordersValidate.middleware.ts`

**Validation Rules**:
- Body must be an array
- Array cannot be empty
- Each item must be an object
- Each order must have: `id`, `status`, `amount`
- Maximum orders per request: 1000

**Error Responses**:
- `400`: Invalid shape or missing fields
- `413`: Too many orders (exceeds MAX_ORDERS_PER_REQUEST)

### Validation Flow

```
POST /api/orders/batch
      ↓
[validateOrdersInput] → Check body is array, has required fields
      ↓
[validateBatchSize]    → Check batch size is valid (uses env config)
      ↓
[processOrdersBatch]   → Process orders
      ↓
For each order:
  [validateOrder]      → Validate order structure
      ↓
  Process or reject
```

## ⚙️ Processing Layer

The processing layer handles the core business logic of order processing.

### Core Functions

#### 1. `processOrder()`

Processes a single order.

**Function**:
```typescript
processOrder(order: Order): ProcessResult
```

**Steps**:
1. Validate order structure (`validateOrder()`)
2. Insert into `OrderStore`
3. Broadcast order created event
4. Return success/failure result

**Returns**:
```typescript
{
  success: boolean;
  order: Order;
  error?: string;  // If failed
}
```

#### 2. `processBatch()`

Processes an array of orders in a batch.

**Function**:
```typescript
processBatch(batch: Order[], batchIndex: number): Promise<BatchResult>
```

**Steps**:
1. Process each order in batch (`processOrder()`)
2. Count processed vs failed
3. Aggregate errors
4. Return batch result

**Returns**:
```typescript
{
  batchIndex: number;
  processed: number;
  failed: number;
  errors?: string[];  // If any failures
}
```

#### 3. `processOrdersBatch()`

Main entry point for processing all orders in batches.

**Function**:
```typescript
processOrdersBatch(
  orders: Order[],
  batchSize?: number
): Promise<BatchProcessResult>
```

**Steps**:
1. Validate batch size (`validateBatchSize()`)
2. Split orders into batches (`splitIntoBatches()`)
3. Process batches sequentially (`processBatchesSequentially()`)
4. Aggregate results (`aggregateBatchResults()`)
5. Return final result

**Returns**:
```typescript
{
  totalProcessed: number;
  totalFailed: number;
  batchResults: BatchResult[];
}
```

### Utility Functions

#### `splitIntoBatches()`

Splits array into chunks of specified size.

**Function**:
```typescript
splitIntoBatches<T>(items: T[], batchSize: number): T[][]
```

**Example**:
```typescript
splitIntoBatches([1,2,3,4,5,6,7,8,9,10], 3)
// Returns: [[1,2,3], [4,5,6], [7,8,9], [10]]
```

#### `aggregateBatchResults()`

Combines batch results into totals.

**Function**:
```typescript
aggregateBatchResults(
  batchResults: BatchResult[]
): { totalProcessed: number; totalFailed: number }
```

**Example**:
```typescript
aggregateBatchResults([
  { processed: 95, failed: 5 },
  { processed: 98, failed: 2 }
])
// Returns: { totalProcessed: 193, totalFailed: 7 }
```

#### `calculateProgress()`

Calculates progress percentage.

**Function**:
```typescript
calculateProgress(
  processedBatches: number,
  totalOrders: number,
  batchSize: number
): Progress
```

**Returns**:
```typescript
{
  processed: number;
  total: number;
  percentage: number;  // 0-100
}
```

## 🔀 Why Split Into Chunks?

Splitting large order arrays into smaller chunks (batches) is a critical design decision that provides multiple benefits:

### 1. **Memory Management**

**Problem**: Processing 10,000 orders at once can cause:
- High memory usage (all orders in memory simultaneously)
- Risk of running out of memory
- Poor garbage collection performance

**Solution**: Chunking processes orders in smaller groups:
- Only 100 orders in memory per batch (configurable)
- Constant memory footprint regardless of total order count
- Better garbage collection between batches

**Example**:
```
❌ Without Chunking:
Process 10,000 orders → All 10,000 in memory → High memory usage

✅ With Chunking (batch size: 100):
Process 10,000 orders → 100 at a time → Constant memory usage
```

### 2. **Error Handling & Recovery**

**Problem**: If processing fails halfway through 10,000 orders:
- No way to know which orders succeeded
- Must restart from beginning
- Difficult to identify problematic orders

**Solution**: Chunking provides granular error tracking:
- Each batch reports success/failure independently
- Failed batches can be retried separately
- Clear visibility into which orders failed

**Example**:
```
Processing 10,000 orders in 100 batches:
- Batch 0-9: ✅ Success (1000 orders processed)
- Batch 10: ❌ Failed (100 orders failed)
- Batch 11-99: ✅ Success (8900 orders processed)

Result: 9900 processed, 100 failed
→ Can retry only Batch 10
```

### 3. **Progress Tracking**

**Problem**: Processing 10,000 orders provides no feedback:
- No way to show progress to client
- Client doesn't know if server is working or stuck
- Difficult to estimate completion time

**Solution**: Chunking enables progress reporting:
- Track progress per batch (e.g., "Processing batch 5/100")
- Calculate percentage complete
- Provide real-time updates to clients

**Example**:
```
Batch 1/10: 10% complete
Batch 2/10: 20% complete
...
Batch 10/10: 100% complete
```

### 4. **Timeout Prevention**

**Problem**: Processing 10,000 orders might exceed:
- HTTP request timeout limits
- Server timeout limits
- Client connection timeouts

**Solution**: Chunking keeps processing time manageable:
- Each batch processes quickly (< 1 second)
- Can return partial results if timeout occurs
- Client can make multiple smaller requests if needed

**Example**:
```
❌ Single Request: 10,000 orders → 30 seconds → Timeout!

✅ Chunked: 100 orders per batch → 0.3 seconds per batch
   → 10 batches × 0.3s = 3 seconds total → Success!
```

### 5. **Database/Store Performance**

**Problem**: Bulk inserting 10,000 orders at once:
- Can lock the database/store
- Slow transaction commit
- Risk of transaction rollback on error

**Solution**: Chunking uses smaller transactions:
- Each batch is a smaller transaction
- Faster commits
- Less lock contention
- Better concurrency

**Example**:
```
❌ Single Transaction: INSERT 10,000 orders
   → Long lock time → Blocks other operations

✅ Chunked Transactions: INSERT 100 orders × 10 times
   → Short lock times → Better concurrency
```

### 6. **Scalability & Resource Control**

**Problem**: Processing all orders at once:
- Consumes all available CPU/memory
- Blocks other requests
- No way to throttle processing

**Solution**: Chunking provides control:
- Process one batch at a time (sequential)
- Can add delays between batches
- Can process batches in parallel (future enhancement)
- Better resource utilization

### 7. **Debugging & Monitoring**

**Problem**: Hard to debug issues with 10,000 orders:
- Which order caused the problem?
- Where did processing fail?
- Performance bottlenecks unclear

**Solution**: Chunking provides granular insights:
- Track performance per batch
- Identify slow batches
- Isolate problematic orders to specific batches
- Better logging and monitoring

**Example**:
```
Batch 0: 95ms
Batch 1: 98ms
Batch 2: 1200ms ← Performance issue detected!
Batch 3: 97ms
...
```

### 8. **Flexibility & Configuration**

**Problem**: Fixed processing approach:
- Can't adjust for different scenarios
- One size doesn't fit all

**Solution**: Configurable batch size:
- Small batches (10-50): For complex validation
- Medium batches (100): Default balanced approach
- Large batches (500-1000): For simple, fast processing
- Adjustable via environment variable

**Example**:
```env
# Development: Smaller batches for easier debugging
BATCH_SIZE=50

# Production: Larger batches for better throughput
BATCH_SIZE=200

# High-load: Maximum batch size
BATCH_SIZE=1000
```

### Real-World Analogy

Think of chunking like **loading a truck**:

**❌ Without Chunking**: Try to load all boxes at once
- Overwhelming
- Risk of dropping everything
- Can't track progress
- If something goes wrong, start over

**✅ With Chunking**: Load boxes in groups of 100
- Manageable
- Can track how many groups loaded
- If one group has issues, fix just that group
- Can pause/resume between groups

### Performance Impact

**Chunking Overhead**: Minimal
- Array splitting: O(n) - very fast
- Batch iteration: O(n) - same as processing all at once
- Result aggregation: O(batches) - negligible

**Benefits**: Significant
- Better memory usage
- Better error handling
- Better progress tracking
- Better scalability

### When NOT to Chunk?

Chunking is beneficial for:
- ✅ Large datasets (100+ items)
- ✅ Complex processing per item
- ✅ Need for progress tracking
- ✅ Error recovery requirements

Chunking may be unnecessary for:
- ❌ Very small datasets (< 10 items)
- ❌ Trivial processing (simple transformations)
- ❌ Atomic requirements (all-or-nothing)

## 📊 Batch Processing Flow

### Complete Flow Diagram

```
1. processOrdersBatch([1000 orders])
      ↓
2. validateBatchSize() → uses BATCH_SIZE from env
      ↓
3. splitIntoBatches() → splits orders into chunks
      ↓
4. processBatchesSequentially() → processes each batch
      ↓
5. processBatch() → processes orders in batch
      ↓
6. processOrder() → validates & inserts each order
      ↓
7. aggregateBatchResults() → combines all results
      ↓
8. Returns BatchProcessResult
```

### Detailed Example

**Input**: `processOrdersBatch([1000 orders])`

**Step 1**: Validate batch size
- Uses `BATCH_SIZE` env var (default: 100)
- Validates: 1 <= batchSize <= 1000
- ✅ Valid

**Step 2**: Split into batches
```typescript
splitIntoBatches(1000 orders, 100)
// Creates 10 batches of 100 orders each
// Batch 0: orders[0-99]
// Batch 1: orders[100-199]
// ...
// Batch 9: orders[900-999]
```

**Step 3**: Process batches sequentially
```typescript
For each batch → processBatch()
  ↓
  For each order → processOrder()
    ↓
    Returns BatchResult { processed: 95, failed: 5 }
```

**Step 4**: Aggregate results
```typescript
aggregateBatchResults([
  { processed: 95, failed: 5 },   // Batch 0
  { processed: 98, failed: 2 },   // Batch 1
  { processed: 100, failed: 0 },   // Batch 2
  // ... 7 more batches
])
// Returns: { totalProcessed: 950, totalFailed: 50 }
```

**Step 5**: Return final result
```typescript
{
  totalProcessed: 950,
  totalFailed: 50,
  batchResults: [/* 10 batch results */]
}
```

### Why Sequential Batch Processing?

**Sequential** (current implementation):
- ✅ Maintains order consistency
- ✅ Predictable memory usage
- ✅ Easier error handling
- ✅ Simpler to debug

**Parallel** (future enhancement):
- ⚡ Faster processing
- ⚠️ Higher memory usage
- ⚠️ More complex error handling
- ⚠️ Potential race conditions

For production, consider parallel batch processing with controlled concurrency.

## 🛡️ Middleware Architecture

### Middleware Stack

The server uses a layered middleware approach:

```
Request
  ↓
┌─────────────────────────────────────┐
│  1. Idempotency Middleware          │
│     - Validates idempotency key     │
│     - Checks cache for duplicate    │
│     - Returns cached response if found│
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│  2. Validation Middleware           │
│     - validateOrdersBatchMiddleware │
│     - validateOrderIdMiddleware     │
│     - validateStressTestMiddleware  │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│  3. Route Handler                   │
│     - Business logic                │
│     - Service calls                 │
│     - Response formatting           │
└─────────────────────────────────────┘
  ↓
Response
```

### Middleware Details

#### 1. Idempotency Middleware

**File**: `src/middleware/idempotency.middleware.ts`

**Purpose**: Prevents duplicate request processing

**Flow**:
1. Extract `Idempotency-Key` from headers
2. Validate key format
3. Check `IdempotencyStore` for cached response
4. If found: return cached response immediately
5. If not: attach key to request for later caching

#### 2. Order Validation Middleware

**File**: `src/middleware/ordersValidate.middleware.ts`

**Purpose**: Validates request body shape

**Flow**:
1. Check body is array
2. Check array is not empty
3. Validate each order has required fields
4. Check order count <= MAX_ORDERS_PER_REQUEST
5. Attach validated orders to request

#### 3. ID Validation Middleware

**File**: `src/middleware/validateId.middleware.ts`

**Purpose**: Validates order ID format

**Flow**:
1. Extract ID from route params
2. Validate ID format
3. Return 400 if invalid

#### 4. Stress Test Validation Middleware

**File**: `src/middleware/stressTestValidate.middleware.ts`

**Purpose**: Validates stress test configuration

**Flow**:
1. Validate order count
2. Validate batch size
3. Validate concurrent batches (if provided)

## 📁 Project Structure

```
server/
├── src/
│   ├── app.ts                    # Fastify app setup
│   ├── server.ts                 # Server entry point
│   ├── config/
│   │   └── index.ts             # Configuration (batch size, etc.)
│   ├── middleware/
│   │   ├── idempotency.middleware.ts      # Idempotency handling
│   │   ├── ordersValidate.middleware.ts   # Order validation
│   │   ├── validateId.middleware.ts      # ID validation
│   │   └── stressTestValidate.middleware.ts # Stress test validation
│   ├── routes/
│   │   ├── orders.routes.ts     # Order routes
│   │   └── system.routes.ts     # System/health routes
│   ├── services/
│   │   ├── order.service.ts     # Order processing logic
│   │   ├── stream.service.ts    # SSE streaming
│   │   └── stress-test.service.ts # Stress testing
│   ├── store/
│   │   ├── order.store.ts       # In-memory order storage
│   │   ├── idempotency.store.ts # Idempotency key cache
│   │   └── cache/
│   │       └── order.store.ts   # Order cache with TTL
│   ├── types/
│   │   ├── order.ts             # Order type definitions
│   │   └── order.service.ts    # Service type definitions
│   ├── utils/
│   │   ├── batch.utils.ts      # Batch processing utilities
│   │   └── metrics.ts          # Performance metrics
│   └── validators/
│       └── order.validator.ts  # Order validation functions
├── package.json
├── tsconfig.json
└── README.md
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Test Coverage

The server includes tests for:
- ✅ Idempotency middleware
- ✅ Order validation middleware
- ✅ Order service (processing logic)
- ✅ Stream service
- ✅ System routes
- ✅ Store implementations

### Test Structure

```
server/src/
├── middleware/
│   ├── idempotency.middleware.test.ts
│   ├── ordersValidate.middleware.test.ts
│   └── validateId.middleware.test.ts
├── services/
│   ├── order.service.test.ts
│   └── stream.service.test.ts
├── routes/
│   └── system.routes.test.ts
└── store/
    └── idempotency.store.test.ts
```

## ⚡ Performance Considerations

### Optimization Strategies

1. **In-Memory Storage**
   - Fast Map-based storage for orders
   - O(1) lookup time
   - Suitable for high-throughput scenarios

2. **Batch Processing**
   - Configurable batch sizes
   - Sequential processing for consistency
   - Error aggregation for efficiency

3. **Caching**
   - TTL-based cache for frequent lookups
   - Automatic invalidation on updates
   - Cache hit/miss tracking

4. **Idempotency Caching**
   - Prevents duplicate processing
   - Reduces load on duplicate requests
   - Automatic cleanup of expired keys

5. **Efficient Validation**
   - Early validation (fail fast)
   - Minimal overhead per request
   - Type-safe validation

### Production Recommendations

1. **Replace In-Memory Stores with Redis**
   - Distributed caching
   - Persistence across restarts
   - Better for multi-server deployments

2. **Add Database Layer**
   - Persistent storage for orders
   - Better data integrity
   - Query capabilities

3. **Implement Rate Limiting**
   - Prevent abuse
   - Fair resource allocation
   - DDoS protection

4. **Add Monitoring**
   - Request metrics
   - Error tracking
   - Performance monitoring

5. **Consider Parallel Batch Processing**
   - For very large batches
   - With controlled concurrency
   - Careful error handling

## 📝 License

[Add your license information here]

---

**Note**: This server is optimized for high-throughput order processing. For production deployments, consider replacing in-memory stores with Redis and adding a persistent database layer.

