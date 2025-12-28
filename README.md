# 🐿️ Social

A production-ready social media API built with Go, featuring real-time feed generation, JWT authentication, Redis caching, and rate limiting. Deployed on Google Cloud Run with a React frontend on Vercel.

[![Go Version](https://img.shields.io/badge/Go-1.21+-00ADD8?style=flat&logo=go)](https://golang.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Deploy](https://img.shields.io/badge/Cloud%20Run-Deployed-4285F4?logo=googlecloud)](https://social-414651752832.us-east4.run.app)

**[Live Demo](https://social-one-liart.vercel.app)** · **[API Docs](https://social-414651752832.us-east4.run.app/v1/swagger/index.html)** · **[Preview](https://social-7zi0s2sqj-anuj-guptas-projects-22956776.vercel.app)**

---

## 📐 Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                   Client                                     │
│                          (React + TypeScript + Vite)                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API Gateway                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │    CORS     │→ │Rate Limiter │→ │  JWT Auth   │→ │  Request Handler    │ │
│  │ Middleware  │  │ (Fixed Win) │  │ Middleware  │  │                     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
            ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
            │   Redis     │    │  PostgreSQL │    │  SendGrid   │
            │   Cache     │    │  (Supabase) │    │   Mailer    │
            └─────────────┘    └─────────────┘    └─────────────┘
```

---

## 🛠 Tech Stack

| Layer          | Technology      | Why                                                       |
| -------------- | --------------- | --------------------------------------------------------- |
| **Language**   | Go 1.21+        | Excellent concurrency, fast compilation, strong typing    |
| **Router**     | chi             | Lightweight, idiomatic, middleware-friendly               |
| **Database**   | PostgreSQL      | ACID compliance, full-text search with `pg_trgm`          |
| **Cache**      | Redis           | Sub-millisecond latency, perfect for session/user caching |
| **Auth**       | JWT + bcrypt    | Stateless auth, secure password hashing                   |
| **Docs**       | Swagger/OpenAPI | Auto-generated from code annotations                      |
| **Deployment** | Cloud Run       | Auto-scaling, pay-per-use, container-native               |

---

## ✨ Key Features & Implementation Details

### 🚦 Rate Limiting (Fixed Window Algorithm)

I implemented a **fixed-window rate limiter** to protect the API from abuse while maintaining simplicity. The trade-off here was choosing fixed-window over sliding-window or token bucket algorithms.

**Why Fixed Window?**

- Simpler to implement and reason about
- Lower memory footprint (no need to store individual request timestamps)
- Acceptable for our use case where burst tolerance at window boundaries is okay

```go
// internal/ratelimiter/ratelimiter.go
type FixedWindowLimiter struct {
    sync.RWMutex
    clients         map[string]int
    limit           int
    window          time.Duration
}

func (rl *FixedWindowLimiter) Allow(ip string) (bool, time.Duration) {
    rl.Lock()
    defer rl.Unlock()

    count, exists := rl.clients[ip]
    if !exists {
        rl.clients[ip] = 1
        return true, 0
    }

    if count >= rl.limit {
        return false, rl.window // Return retry-after duration
    }

    rl.clients[ip]++
    return true, 0
}
```

The limiter resets all counters on a configurable interval using a background goroutine:

```go
func (rl *FixedWindowLimiter) run() {
    ticker := time.NewTicker(rl.window)
    for range ticker.C {
        rl.Lock()
        rl.clients = make(map[string]int)
        rl.Unlock()
    }
}
```

---

### 🔐 JWT Authentication with Role-Based Access Control

The auth system uses **JWT tokens** stored client-side with a middleware chain that validates tokens and injects user context.

**Why JWT over Sessions?**

- Stateless = horizontal scaling without sticky sessions
- Self-contained claims reduce database lookups
- Works seamlessly with mobile clients and SPAs

```go
// cmd/api/middleware.go
func (app *application) AuthTokenMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        authHeader := r.Header.Get("Authorization")
        if authHeader == "" {
            app.unauthorizedErrorResponse(w, r, fmt.Errorf("authorization header is missing"))
            return
        }

        parts := strings.Split(authHeader, " ")
        if len(parts) != 2 || parts[0] != "Bearer" {
            app.unauthorizedErrorResponse(w, r, fmt.Errorf("authorization header is malformed"))
            return
        }

        token := parts[1]
        jwtToken, err := app.authenticator.ValidateToken(token)
        if err != nil {
            app.unauthorizedErrorResponse(w, r, err)
            return
        }

        claims := jwtToken.Claims.(jwt.MapClaims)
        userID, _ := strconv.ParseInt(fmt.Sprintf("%.f", claims["sub"]), 10, 64)

        // Inject user into request context
        user, err := app.getUser(r.Context(), userID)
        if err != nil {
            app.unauthorizedErrorResponse(w, r, err)
            return
        }

        ctx := context.WithValue(r.Context(), userCtx, user)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

**Role-Based Post Ownership:**

```go
func (app *application) checkPostOwnership(requiredRole string, next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        user := getUserFromCtx(r)
        post := getPostFromCtx(r)

        // Owner always has access
        if post.UserID == user.ID {
            next.ServeHTTP(w, r)
            return
        }

        // Check role precedence for non-owners
        allowed, _ := app.checkRolePrecedence(r.Context(), user, requiredRole)
        if !allowed {
            app.forbiddenError(w, r)
            return
        }

        next.ServeHTTP(w, r)
    }
}
```

---

### ⚡ Redis Caching Layer

Implemented a **write-through cache** for user lookups to reduce database load. User data is cached on first access and invalidated on updates.

**Why Write-Through?**

- Ensures cache consistency with database
- Simpler than write-behind (no async complexity)
- Acceptable write latency for our use case

```go
// internal/store/cache/users.go
type UserStore struct {
    rdb *redis.Client
}

func (s *UserStore) Get(ctx context.Context, userID int64) (*store.User, error) {
    cacheKey := fmt.Sprintf("user-%d", userID)

    data, err := s.rdb.Get(ctx, cacheKey).Result()
    if err == redis.Nil {
        return nil, nil // Cache miss - caller fetches from DB
    }
    if err != nil {
        return nil, err
    }

    var user store.User
    if err := json.Unmarshal([]byte(data), &user); err != nil {
        return nil, err
    }

    return &user, nil
}

func (s *UserStore) Set(ctx context.Context, user *store.User) error {
    cacheKey := fmt.Sprintf("user-%d", user.ID)

    data, err := json.Marshal(user)
    if err != nil {
        return err
    }

    return s.rdb.SetEX(ctx, cacheKey, data, UserExpTime).Err()
}
```

**Cache Integration in Middleware:**

```go
func (app *application) getUser(ctx context.Context, userID int64) (*store.User, error) {
    // Skip cache if Redis disabled
    if !app.config.redisCfg.enabled {
        return app.store.Users.GetByID(ctx, userID)
    }

    // Try cache first
    user, err := app.cacheStorage.Users.Get(ctx, userID)
    if err != nil {
        return nil, err
    }

    if user == nil {
        // Cache miss - fetch from DB and populate cache
        user, err = app.store.Users.GetByID(ctx, userID)
        if err != nil {
            return nil, err
        }

        app.cacheStorage.Users.Set(ctx, user) // Fire and forget
    }

    return user, nil
}
```

---

### 🔄 Graceful Shutdown

The server handles `SIGINT` and `SIGTERM` signals gracefully, allowing in-flight requests to complete before shutting down.

**Why This Matters:**

- Zero dropped requests during deployments
- Proper cleanup of database connections
- Required for container orchestration (Cloud Run, Kubernetes)

```go
// cmd/api/api.go
func (app *application) run(mux http.Handler) error {
    srv := &http.Server{
        Addr:         app.config.addr,
        Handler:      mux,
        WriteTimeout: time.Second * 30,
        ReadTimeout:  time.Second * 10,
        IdleTimeout:  time.Minute,
    }

    shutdown := make(chan error)

    go func() {
        quit := make(chan os.Signal, 1)
        signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
        s := <-quit

        app.logger.Infow("signal caught", "signal", s.String())

        ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
        defer cancel()

        shutdown <- srv.Shutdown(ctx)
    }()

    app.logger.Infow("server has started", "addr", app.config.addr)

    err := srv.ListenAndServe()
    if !errors.Is(err, http.ErrServerClosed) {
        return err
    }

    err = <-shutdown
    if err != nil {
        return err
    }

    app.logger.Infow("server has stopped gracefully")
    return nil
}
```

---

### 📊 Database Design & Indexing

Used PostgreSQL with carefully designed indexes for optimal query performance.

**Schema Overview:**

```sql
-- Users with role-based access
CREATE TABLE users (
    id          BIGSERIAL PRIMARY KEY,
    email       CITEXT UNIQUE NOT NULL,
    username    VARCHAR(255) UNIQUE NOT NULL,
    password    BYTEA NOT NULL,
    role_id     INT REFERENCES roles(id) NOT NULL,
    is_active   BOOLEAN DEFAULT false,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts with full-text search
CREATE TABLE posts (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    content     TEXT NOT NULL,
    tags        VARCHAR(100)[],
    version     INT DEFAULT 0,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Followers (many-to-many self-reference)
CREATE TABLE followers (
    user_id     BIGINT REFERENCES users(id) ON DELETE CASCADE,
    follower_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, follower_id)
);
```

**Strategic Indexing:**

```sql
-- Full-text search with trigram similarity
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_posts_title ON posts USING gin (title gin_trgm_ops);
CREATE INDEX idx_posts_tags ON posts USING gin (tags);
CREATE INDEX idx_users_username ON users USING gin ((username::text) gin_trgm_ops);

-- Foreign key indexes for JOIN performance
CREATE INDEX idx_posts_user_id ON posts (user_id);
CREATE INDEX idx_comments_post_id ON comments (post_id);
```

**Why GIN Indexes?**

- Optimal for array containment queries (`tags @> '{go, api}'`)
- Excellent for trigram similarity searches (`ILIKE '%search%'`)
- Trade-off: Slower writes, but reads are critical path

---

### 🔁 Database Migrations

Used `golang-migrate` for version-controlled schema changes with up/down migrations.

```bash
# Create new migration
migrate create -ext sql -dir cmd/migrate/migrations -seq add_followers_table

# Apply migrations
make migrate-up

# Rollback
make migrate-down
```

**Example Migration:**

```sql
-- 000007_add_followers_table.up.sql
CREATE TABLE IF NOT EXISTS followers (
    user_id     BIGINT NOT NULL,
    follower_id BIGINT NOT NULL,
    created_at  TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT NOW(),

    PRIMARY KEY (user_id, follower_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 000007_add_followers_table.down.sql
DROP TABLE IF EXISTS followers;
```

---

### 📧 Email Service with SendGrid

Implemented transactional emails using SendGrid with HTML templates and retry logic.

```go
func (m *SendGridMailer) Send(templateFile, username, email string, data any, isSandbox bool) (int, error) {
    from := mail.NewEmail(FromName, m.fromEmail)
    to := mail.NewEmail(username, email)

    // Parse embedded template
    tmpl, err := template.ParseFS(FS, "templates/"+templateFile)
    if err != nil {
        return -1, err
    }

    subject := new(bytes.Buffer)
    tmpl.ExecuteTemplate(subject, "subject", data)

    body := new(bytes.Buffer)
    tmpl.ExecuteTemplate(body, "body", data)

    message := mail.NewSingleEmail(from, subject.String(), to, "", body.String())
    message.SetMailSettings(&mail.MailSettings{
        SandboxMode: &mail.Setting{Enable: &isSandbox},
    })

    // Retry with exponential backoff
    for i := 0; i < MaxRetries; i++ {
        response, err := m.client.Send(message)
        if err != nil {
            time.Sleep(time.Second * time.Duration(i+1))
            continue
        }
        return response.StatusCode, nil
    }

    return -1, fmt.Errorf("failed after %d retries", MaxRetries)
}
```

---

## 📁 Project Structure

```
.
├── cmd/
│   ├── api/              # Application entrypoint & handlers
│   │   ├── main.go       # Config, DI, server setup
│   │   ├── api.go        # Router & middleware chain
│   │   ├── auth.go       # Login/register handlers
│   │   ├── posts.go      # CRUD handlers
│   │   ├── users.go      # User management
│   │   ├── feed.go       # Feed generation
│   │   ├── middleware.go # Auth, rate limiting
│   │   └── errors.go     # Error response helpers
│   └── migrate/          # Database migrations
├── internal/
│   ├── auth/             # JWT implementation
│   ├── env/              # Environment helpers
│   ├── mailer/           # SendGrid integration
│   ├── ratelimiter/      # Rate limiting
│   └── store/            # Data access layer
│       ├── cache/        # Redis caching
│       ├── users.go      # User repository
│       ├── posts.go      # Post repository
│       └── storage.go    # Repository interfaces
├── web/                  # React frontend
├── docs/                 # Swagger documentation
├── Dockerfile
├── docker-compose.yml
└── Makefile
```

---

## 🚀 Getting Started

### Prerequisites

- Go 1.21+
- Docker & Docker Compose
- Node.js 18+ (for frontend)

### Quick Start

```bash
# Clone
git clone https://github.com/yourusername/social.git
cd social

# Start infrastructure (Postgres, Redis)
docker compose up -d

# Setup environment
cp .envrc.example .envrc
direnv allow

# Run migrations
make migrate-up

# Start backend (with hot reload)
make dev

# In another terminal - start frontend
cd web && npm install && npm run dev
```

### Environment Variables

```bash
# Server
ADDR=:8080
ENV=development

# Database
DB_ADDR=postgres://admin:adminpassword@localhost/social?sslmode=disable

# Redis
REDIS_ADDR=localhost:6379
REDIS_ENABLED=true

# Auth
AUTH_TOKEN_SECRET=your-secret-key

# Email
SENDGRID_API_KEY=SG.xxx
FROM_EMAIL=noreply@yourdomain.com
```

---

## 📚 API Endpoints

| Method   | Endpoint                     | Description           | Auth           |
| -------- | ---------------------------- | --------------------- | -------------- |
| `POST`   | `/v1/authentication/user`    | Register new user     | ❌             |
| `POST`   | `/v1/authentication/token`   | Login & get JWT       | ❌             |
| `PUT`    | `/v1/users/activate/{token}` | Activate account      | ❌             |
| `GET`    | `/v1/users`                  | List all users        | ✅             |
| `GET`    | `/v1/users/{id}`             | Get user profile      | ✅             |
| `PUT`    | `/v1/users/{id}/follow`      | Follow user           | ✅             |
| `PUT`    | `/v1/users/{id}/unfollow`    | Unfollow user         | ✅             |
| `GET`    | `/v1/users/feed`             | Get personalized feed | ✅             |
| `POST`   | `/v1/posts`                  | Create post           | ✅             |
| `GET`    | `/v1/posts/{id}`             | Get post              | ✅             |
| `PATCH`  | `/v1/posts/{id}`             | Update post           | ✅ Owner/Mod   |
| `DELETE` | `/v1/posts/{id}`             | Delete post           | ✅ Owner/Admin |
| `POST`   | `/v1/posts/{id}/comments`    | Add comment           | ✅             |

**Full API documentation available at `/v1/swagger/index.html`**

---

## 🧪 Testing

```bash
# Run all tests
go test ./...

# Run with coverage
go test -cover ./...

# Run specific package
go test ./cmd/api/...
```

---

## 📦 Deployment

### Google Cloud Run

```bash
# Build and push
gcloud builds submit --tag gcr.io/PROJECT_ID/social

# Deploy
gcloud run deploy social \
  --image gcr.io/PROJECT_ID/social \
  --platform managed \
  --region us-east4 \
  --allow-unauthenticated
```

### Environment Variables for Production

Set these in Cloud Run:

- `DB_ADDR` - Supabase/Cloud SQL connection string
- `REDIS_ENABLED=false` - Disable if not using managed Redis
- `ENV=production`
- `SENDGRID_API_KEY`
- `CORS_ALLOWED_ORIGIN` - Frontend URL

---

## 🎯 Performance Considerations

| Optimization             | Implementation                              |
| ------------------------ | ------------------------------------------- |
| **Connection Pooling**   | Max 30 open connections, 15min idle timeout |
| **Query Timeouts**       | 5 second context timeout on all DB calls    |
| **Response Compression** | Handled by Cloud Run/CDN                    |
| **Pagination**           | Cursor-based with configurable limits       |
| **Caching**              | Redis with TTL for user lookups             |

---

## 📄 License

MIT License - feel free to use this for your own projects!

---

<p align="center">
  Built with ☕ and Go
</p>
