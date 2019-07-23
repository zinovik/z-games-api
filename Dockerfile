FROM node:12.6.0

# Create work directory
WORKDIR /usr/src/app

# Copy app source to work directory
RUN mkdir /usr/src/app/src
ADD src /usr/src/app/src/

COPY nodemon-debug.json *.env /usr/src/app/
COPY nodemon.json /usr/src/app/
COPY package-lock.json /usr/src/app/
COPY package.json /usr/src/app/
COPY tsconfig.json /usr/src/app/
COPY tslint.json /usr/src/app/

# Install app dependencies
RUN npm install

# Build and run the app
CMD npm run start:dev
