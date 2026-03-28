FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# SQLite database lives on a persistent volume mounted at /data
ENV DB_PATH=/data/desimart.db

EXPOSE 3001
CMD ["node", "index.js"]
