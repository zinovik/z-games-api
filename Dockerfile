FROM node:12.7.0

# Create work directory
WORKDIR /app

# Copy app config files
COPY package.json ./
COPY package-lock.json ./

# Install app dependencies
RUN npm install

# Copy source-code
COPY src ./src
COPY nodemon-debug.json *.env ./
COPY nodemon.json ./
COPY tsconfig.build.json ./
COPY tsconfig.json ./
COPY tslint.json ./

# Build and run the app
CMD npm run start:dev
