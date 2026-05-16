FROM node:22-alpine

WORKDIR /app

ARG VITE_API_BASE_URL=http://api-gateway:9000
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
