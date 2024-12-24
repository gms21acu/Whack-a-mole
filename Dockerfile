# Use Node.js image
FROM node:18

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the server files and the public directory
COPY . ./
COPY ../public /app/public

# Expose port 8080
EXPOSE 8080

# Start the server
CMD ["node", "server.js"]

# Copy the public directory from the current directory to /app/public
COPY ./public /app/public