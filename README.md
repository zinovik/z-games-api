[![Build Status](https://travis-ci.org/zinovik/z-games-api.svg?branch=master)](https://travis-ci.org/zinovik/z-games-api)

![img](./logo.png)

# What

Z-Games is a tiny board games portal.

The project consists of two main parts and several games modules:

1. [Back-end](https://github.com/zinovik/z-games-api)
2. [Front-end](https://github.com/zinovik/z-games)

- [Game template](https://github.com/zinovik/z-games-base-game)
- [No, Thanks game](https://github.com/zinovik/z-games-no-thanks) [[wiki](<https://en.wikipedia.org/wiki/No_Thanks!_(game)>)]
- [Perudo game](https://github.com/zinovik/z-games-perudo) [[wiki](https://en.wikipedia.org/wiki/Dudo)]
- [Lost cities game](https://github.com/zinovik/z-games-lost-cities) [[wiki](https://en.wikipedia.org/wiki/Lost_Cities)]
- [6 nimmt! game](https://github.com/zinovik/z-games-six-nimmt) [[wiki](https://en.wikipedia.org/wiki/6_Nimmt!)]

# Where

There are two environments where you can check current versions:

1. Development (dev branch) (https://z-games-dev.netlify.com)
2. Production (master branch) (https://z-games.club)

# How

Also, you can run a development environment on your local machine.

Please, select the option that suits you best:

1. Run the whole project with [docker and docker-compose](https://docker.com) (the easiest way).
2. Run only back-end part with databases with [docker and docker-compose](https://docker.com).
3. Run only databases with [docker and docker-compose](https://docker.com).
4. Run only back-end part with [docker](https://docker.com).
5. Run only front-end part with [docker](https://docker.com).
6. Working without [docker](https://docker.com).

NB: If you want to use [docker (and docker-compose)](https://docker.com) please install it, else install [node.js with npm](https://nodejs.org).

Let's start!

## 1. Run the whole project with docker and docker-compose (the easiest way)

1.1. Clone repositories:

```bash
git clone https://github.com/zinovik/z-games-api
git clone https://github.com/zinovik/z-games
```

1.2. Create .env file in each cloned repository (use .env.example for help).

1.3. Build containers and run it:

```bash
cd z-games
docker-compose up
```

That's it!
Check front-end here: [http://localhost:3000](http://localhost:3000)!
Check back-end here: [http://localhost:4000](http://localhost:4000)!

## 2. Run only back-end part with databases with docker and docker-compose

2.1. Clone repository:

```bash
git clone https://github.com/zinovik/z-games-api
```

2.2. Create .env file in the repository folder (use .env.example for help).

2.3. Build containers and run it:

```bash
cd z-games-api
docker-compose up
```

That's it!
Check back-end here: [http://localhost:4000](http://localhost:4000)!

## 3. Run only databases with docker and docker-compose

3.1. Clone repository:

```bash
git clone https://github.com/zinovik/z-games-api
```

3.2. Enter in special folder and run docker database separately:

```bash
cd z-games-api
cd database_postgresql
docker-compose up
```

or

```bash
cd z-games-api
cd database_mongodb
docker-compose up
```

That's it!

## 4. Run only back-end part with docker

4.1. Clone repository:

```bash
git clone https://github.com/zinovik/z-games-api
```

4.2. Create .env file in the repository folder (use .env.example for help).

4.3. Build container and run it:

```bash
cd z-games-api
docker build -t z-games-api .
docker run z-games-api
```

That's it!
Check front-end here: [http://localhost:3000](http://localhost:3000)!

## 5. Run only front-end part with docker

5.1. Clone repository:

```bash
git clone https://github.com/zinovik/z-games
```

5.2. Create .env file in the repository folder (use .env.example for help).

5.3. Build container and run it:

```bash
cd z-games
docker build -t z-games .
docker run z-games
```

That's it!
Check front-end here: [http://localhost:3000](http://localhost:3000)!

## 6. Working without docker

6.1. Clone repositories you want to run:

```bash
git clone https://github.com/zinovik/z-games-api
```

or/and

```bash
git clone https://github.com/zinovik/z-games
```

6.2. Create .env file in each cloned repository (use .env.example for help).

6.3. Install all dependencies by running these commands for cloned repositories:

```bash
cd z-games-api
npm install
cd ..
```

or/and

```bash
cd z-games
npm install
cd ..
```

6.4. Then go to the folder and run part you want to run or both parts:

```bash
cd z-games-api
npm run start:dev
```

or/and

```bash
cd z-games
npm run start:dev
```

That's it!
Check front-end here: [http://localhost:3000](http://localhost:3000)!
Check back-end here: [http://localhost:4000](http://localhost:4000)!

P.S. If you want to change the separate game - clone it's repository! You can work with it using [npm link](https://docs.npmjs.com/cli/link.html) command.

# Contributing

Please contribute using [Github Flow](https://guides.github.com/introduction/flow). Create a branch, add commits, and [open a pull request](https://github.com/zinovik/z-games-api/compare).

# Help

If you want to help check current issues on [project board](https://github.com/users/zinovik/projects/1) or create the new one in any project repository! Also, you can write any comment.

Thank you, [Richard Caseres](https://github.com/richardbmx), for the amazing Logo!

# Technologies

1. Typescript
2. NodeJS
3. Socket.io
4. NestJS
5. React
6. Redux
7. Docker

# Services

1. namecheap.com
2. heroku.com
3. netlify.com
4. mongodb.com
5. sendgrid.com
6. developers.google.com
7. firebase.google.com
8. travis-ci.org
9. hub.docker.com

# Scheme

```bash
              USER
      z-games.club (NameCheap)
                |
                |
                |
        Front-end (Netlify) <------------------------------------------------------------------- |
   [        Components         ]                                                                 |
   [            |              ]                                                                 |
   [        Containers <---- | ]                                                                 |
   [            |            | ]                                                                 |
   [ | ----> Actions         | ]                                                                 |
   [ |          |            | ]                                                                 |
   [ |       Reducers        | ]                                                                 |
   [ |          |            | ]                                                                 |
   [ |        Store -------> | ]                                                                 |
   [ |          |              ]                                                                 |
   [ | <----- Services         ] ----- Back-end (Heroku)                                         |
                              |      [ Gateway/Controller ]                                      |
                              |      [         |          ]                                      |
                              |      [      Service       ]                                      |
                              |      [         |          ]                                      |
                              |      [      Services      ] ----> DataBase (Mongo)               |
                              |                |            ----> Emails (SendGrid)              |
                              |                |            ----> Authorization (Google)         |
                              |                |            ----> Notifications (Firebase) ----> |
                              |                |
                              - Modules (NPM) -
(z-games-no-thanks, z-games-perudo, z-games-lost-cities, z-games-six-nimmt, ...)
                                    GAMES
```

# Database objects

1. Game
2. User
3. Log
4. Invite

# License

[Apache License 2.0](/LICENSE)
