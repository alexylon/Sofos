# Stage 1: Build the production assets
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your application code
COPY . .

# Build the production assets; this creates the .next directory
RUN npm run build

# Stage 2: Run the production app
FROM node:22-alpine AS runner

WORKDIR /app

# Copy only the necessary files from the builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# (Optional) Copy any other files you need in production
# COPY --from=builder /app/src ./src

# Install only production dependencies
RUN npm ci --production

# Expose the port your app listens on
EXPOSE 3000

# Start the production server
CMD ["npm", "run", "start"]
