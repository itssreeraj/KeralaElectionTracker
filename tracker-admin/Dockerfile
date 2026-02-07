# -------- Build stage --------
FROM node:25.2-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# -------- Runtime stage --------
FROM node:25.2-slim

WORKDIR /app

# IMPORTANT: Secrets (ADMIN_USER, ADMIN_PASS, JWT_SECRET) should NOT be passed as build ARG
# They will be injected at runtime via environment variables
# Only NEXT_PUBLIC_* variables can be build-time args (they are embedded in the frontend bundle)

ARG NEXT_PUBLIC_ENV=production
ARG NEXT_PUBLIC_API_BASE
ARG NEXT_PUBLIC_POSTER_BASE

# Set only public environment variables for Next.js build output
ENV NEXT_PUBLIC_ENV=${NEXT_PUBLIC_ENV}
ENV NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE}
ENV NEXT_PUBLIC_POSTER_BASE=${NEXT_PUBLIC_POSTER_BASE}

COPY --from=builder /app/.next .next
COPY --from=builder /app/public public
COPY --from=builder /app/package.json .
COPY --from=builder /app/next.config.* ./
COPY --from=builder /app/node_modules node_modules

EXPOSE 3333

# Use sh -c to allow environment variable expansion
# PORT defaults to 3333, but can be overridden (e.g., by Render)
CMD ["npm", "run", "start", "--", "-H", "0.0.0.0", "-p", "3333"]