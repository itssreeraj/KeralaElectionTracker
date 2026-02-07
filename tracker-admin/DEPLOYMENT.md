# Deployment Guide - Security Best Practices

## Why Secrets Are NOT in Dockerfile

Secrets like `JWT_SECRET`, `ADMIN_USER`, and `ADMIN_PASS` should **never** be:
- Passed as Docker `ARG` (visible in `docker history`)
- Set as `ENV` in Dockerfile (embedded in image layers)
- Committed to git

Instead, they are **injected at runtime** through environment variables directly in the container orchestration platform.

## Docker Compose Setup

Add the `tracker-admin` (next-ui) service to your main `docker-compose.yml`:

```yaml
next-ui:
  build:
    context: ./tracker-admin
    dockerfile: Dockerfile
    args:
      NEXT_PUBLIC_ENV: docker
      NEXT_PUBLIC_API_BASE: http://localhost:3333  # For local dev only
      NEXT_PUBLIC_POSTER_BASE: http://poster-service:4000
  container_name: next-ui
  depends_on:
    - spring-api
  ports:
    - "3333:3333"
  environment:
    # NEXT_PUBLIC_* variables must be set at build time if used in frontend
    NEXT_PUBLIC_ENV: docker
    NEXT_PUBLIC_API_BASE: http://localhost:3333
    NEXT_PUBLIC_POSTER_BASE: http://poster-service:4000
    
    # Secrets injected at runtime - NOT in Dockerfile
    NEXT_BACKEND_API_BASE: http://spring-api:8080/api
    ADMIN_USER: centerrightin
    ADMIN_PASS: IdleBunny@4132
    JWT_SECRET: cbc4ea367dbbd0345e1bb5fb95de28955fd43e6a6e6508f7406b72114f50b199a852cdcb71e21c4145e6672f6fbc112be835f217629327b7cf3186713e1185ee
    JWT_EXP_SECONDS: 3600
    NODE_ENV: development
  networks:
    - backend
```

**Key Points:**
- `NEXT_PUBLIC_*` variables are set at build time (embedded in frontend)
- All other environment variables are injected at runtime
- **Secrets are never stored in the Docker image**

## Cloud Deployment (Kubernetes, ECS, etc.)

### Kubernetes (Recommended for Production)

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: tracker-admin-secrets
type: Opaque
stringData:
  ADMIN_USER: your-admin-username
  ADMIN_PASS: your-secure-password
  JWT_SECRET: your-min-32-character-uuid-or-random-string
  NEXT_BACKEND_API_BASE: http://spring-api:8080/api
  
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: tracker-admin-config
data:
  NEXT_PUBLIC_ENV: production
  NEXT_PUBLIC_API_BASE: https://api.yourdomain.com
  NEXT_PUBLIC_POSTER_BASE: https://poster.yourdomain.com
  JWT_EXP_SECONDS: "43200"
  NODE_ENV: production
  
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tracker-admin
spec:
  replicas: 2
  selector:
    matchLabels:
      app: tracker-admin
  template:
    metadata:
      labels:
        app: tracker-admin
    spec:
      containers:
      - name: next-ui
        image: tracker-admin:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 3333
          name: http
        
        # Load all secrets as environment variables
        envFrom:
        - secretRef:
            name: tracker-admin-secrets
        - configMapRef:
            name: tracker-admin-config
        
        # Or set specific variables (override config)
        env:
        - name: NEXT_PUBLIC_ENV
          valueFrom:
            configMapKeyRef:
              name: tracker-admin-config
              key: NEXT_PUBLIC_ENV
        
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        
        livenessProbe:
          httpGet:
            path: /
            port: 3333
          initialDelaySeconds: 30
          periodSeconds: 10
        
        readinessProbe:
          httpGet:
            path: /
            port: 3333
          initialDelaySeconds: 15
          periodSeconds: 5
```

### AWS ECS

```json
{
  "family": "tracker-admin",
  "containerDefinitions": [
    {
      "name": "next-ui",
      "image": "your-registry/tracker-admin:latest",
      "portMappings": [
        {
          "containerPort": 3333,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NEXT_PUBLIC_ENV",
          "value": "production"
        },
        {
          "name": "NEXT_PUBLIC_API_BASE",
          "value": "https://api.yourdomain.com"
        },
        {
          "name": "NEXT_PUBLIC_POSTER_BASE",
          "value": "https://poster.yourdomain.com"
        },
        {
          "name": "JWT_EXP_SECONDS",
          "value": "43200"
        },
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "ADMIN_USER",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:tracker-admin/admin-user"
        },
        {
          "name": "ADMIN_PASS",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:tracker-admin/admin-pass"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:tracker-admin/jwt-secret"
        },
        {
          "name": "NEXT_BACKEND_API_BASE",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:tracker-admin/backend-api"
        }
      ]
    }
  ]
}
```

### GitHub Actions / Cloud Build

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: |
          docker build \
            --build-arg NEXT_PUBLIC_ENV=production \
            --build-arg NEXT_PUBLIC_API_BASE=https://api.yourdomain.com \
            --build-arg NEXT_PUBLIC_POSTER_BASE=https://poster.yourdomain.com \
            -t tracker-admin:${{ github.sha }} \
            -t tracker-admin:latest \
            ./tracker-admin
      
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/tracker-admin \
            next-ui=tracker-admin:${{ github.sha }} \
            --record
          
          # Note: Secrets (ADMIN_USER, ADMIN_PASS, JWT_SECRET) are already 
          # in Kubernetes Secret resources - never pass them in CI/CD logs!
```

## Environment Variables Summary

### Build-time Variables (NEXT_PUBLIC_*)
Must be passed as `--build-arg` during `docker build`:
- `NEXT_PUBLIC_ENV` - Environment name (production, staging, docker)
- `NEXT_PUBLIC_API_BASE` - Frontend-facing API URL
- `NEXT_PUBLIC_POSTER_BASE` - Frontend-facing poster service URL

### Runtime Variables (Secrets)
Passed at runtime via docker-compose, Kubernetes, ECS, etc.:
- `NEXT_BACKEND_API_BASE` - Backend API URL (server-side only)
- `ADMIN_USER` - Admin username
- `ADMIN_PASS` - Admin password
- `JWT_SECRET` - JWT signing secret (min 32 characters)
- `JWT_EXP_SECONDS` - JWT expiration time

### Other Runtime Variables
- `NODE_ENV` - development, production, etc.

## Security Checklist

- ✅ Secrets are NOT baked into Dockerfile
- ✅ `NEXT_PUBLIC_*` variables only for non-sensitive public data
- ✅ Secrets passed at runtime via platform-native tools
- ✅ `.env.production` is gitignored (not used in cloud)
- ✅ Use 32+ character random string for `JWT_SECRET`
- ✅ Use strong password for `ADMIN_PASS`
- ✅ Use HTTPS in production for all URLs
- ✅ Rotate secrets periodically
- ✅ Never log or print secrets
- ✅ Use platform-native secrets management (Kubernetes Secrets, AWS Secrets Manager, etc.)
