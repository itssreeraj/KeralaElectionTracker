# -------- Build stage --------
FROM node:25.2-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG NEXT_PUBLIC_API_BASE
ARG NEXT_BACKEND_API_BASE
ARG NEXT_PUBLIC_POSTER_BASE
ARG NEXT_PUBLIC_ENV

ENV NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE
ENV NEXT_BACKEND_API_BASE=$NEXT_BACKEND_API_BASE
ENV NEXT_PUBLIC_POSTER_BASE=$NEXT_PUBLIC_POSTER_BASE
ENV NEXT_PUBLIC_ENV=$NEXT_PUBLIC_ENV

RUN npm run build

# -------- Runtime stage --------
FROM node:25.2-slim

WORKDIR /app

COPY --from=builder /app/.next .next
COPY --from=builder /app/public public
COPY --from=builder /app/package.json .
COPY --from=builder /app/next.config.* ./
COPY --from=builder /app/node_modules node_modules

EXPOSE 3333

CMD ["npm", "run", "start", "--", "-H", "0.0.0.0", "-p", "3333"]
