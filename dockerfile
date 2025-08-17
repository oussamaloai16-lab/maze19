FROM node:20-alpine

WORKDIR /app

# Install dependencies required for bcrypt compilation
RUN apk add --no-cache python3 make g++

COPY . .

# Install dependencies for Node backend with proper bcrypt rebuild
RUN cd Node && npm install && npm install axios && npm rebuild bcrypt --build-from-source

# Install dependencies for React frontend
RUN cd React && npm install && npm install axios

EXPOSE 3001 5173

# Use --host flag for Vite to make it accessible outside the container
CMD ["sh", "-c", "cd Node && npm start & cd React && npm run dev -- --host"]