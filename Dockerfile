# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend

# Allow Render to pass VITE_API_URL during the build process
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Setup the Node.js backend
FROM node:20-alpine AS backend
WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm install

COPY backend/ ./

# Copy the built frontend from Stage 1 into the backend's relative path
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

EXPOSE 10000

ENV PORT=10000

CMD ["npm", "start"]
