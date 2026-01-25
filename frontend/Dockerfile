FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
# Robust install
RUN npm install
# Copy rest of the code (though docker-compose volumes will override this, it's good for standalone)
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
