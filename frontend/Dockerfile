FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# NEXT_PUBLIC_* vars are baked into the bundle at build time
ARG NEXT_PUBLIC_API_URL=https://api.writingtwinai.com
ARG NEXT_PUBLIC_POSTHOG_KEY=""
ARG NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=""
ARG NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY=""

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY
ENV NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=$NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY
ENV NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY=$NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public 2>/dev/null || true

EXPOSE 3000
CMD ["npm", "start"]
