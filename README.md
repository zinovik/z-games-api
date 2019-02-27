![img](./logo.png)

# What #

Z-Games is a tiny board games portal.

The project consists of two main parts and several games modules:
1. [Back-end](https://github.com/zinovik/z-games-api)
2. [Front-end](https://github.com/zinovik/z-games)
- [Game template](https://github.com/zinovik/z-games-base-game)
- [No, Thanks game](https://github.com/zinovik/z-games-no-thanks) [[wiki](https://en.wikipedia.org/wiki/No_Thanks!_(game))]
- [Perudo game](https://github.com/zinovik/z-games-perudo) [[wiki](https://en.wikipedia.org/wiki/Dudo)]
- [Lost cities game](https://github.com/zinovik/z-games-lost-cities) [[wiki](https://en.wikipedia.org/wiki/Lost_Cities)] (in development)
- [6 nimmt! game](https://github.com/zinovik/z-games-six-nimmt) [[wiki](https://en.wikipedia.org/wiki/6_Nimmt!)] (in development)

# Where #

There are two environments where you can check current versions:
1. Development (dev branch) (https://z-games-dev.herokuapp.com)
2. Production (master branch) (https://z-games.herokuapp.com)

# How #

Also, you can run a development environment on your local machine.

Please, select the option that suits you best:
1. Run the whole project with [docker and docker-compose](https://docker.com) (the easiest way).
2. Run only back-end part with databases with [docker and docker-compose](https://docker.com).
3. Run only databases with [docker and docker-compose](https://docker.com).
4. Run only back-end part with [docker](https://docker.com).
5. Run only front-end part with [docker](https://docker.com).
6. Working without [docker](https://docker.com).

NB: If you want to use [docker (and docker-compose)](https://docker.com) please install it, else install [node.js with npm](https://nodejs.org) then install [yarn](https://yarnpkg.com) with this command:

```bash
npm install yarn --global
```

Let's start!



## 1. Run the whole project with docker and docker-compose (the easiest way) ##

1.1. Clone repositories:

```bash
git clone https://github.com/zinovik/z-games-api
git clone https://github.com/zinovik/z-games
```

1.2. Create .env file in each cloned repository (use .env.example for help).

1.3. Build containers and run it:

```bash
cd z-games
docker-compose up --build
```

That's it!
Check front-end here: [http://localhost:3000](http://localhost:3000)!
Check back-end here: [http://localhost:4000](http://localhost:4000)!



## 2. Run only back-end part with databases with docker and docker-compose ##

2.1. Clone repository:

```bash
git clone https://github.com/zinovik/z-games-api
```

2.2. Create .env file in the repository folder (use .env.example for help).

2.3. Build containers and run it:

```bash
cd z-games-api
docker-compose up --build
```

That's it!
Check back-end here: [http://localhost:4000](http://localhost:4000)!



## 3. Run only databases with docker and docker-compose ##

3.1. Clone repository:

```bash
git clone https://github.com/zinovik/z-games-api
```

3.2. Enter in special folder and run docker database separately:

```bash
cd z-games-api
cd database
docker-compose up --build
```

or

```bash
cd z-games-api
cd database_mongo
docker-compose up --build
```

That's it!



## 4. Run only back-end part with docker ##

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



## 5. Run only front-end part with docker ##

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



## 6. Working without docker ##

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
yarn
cd ..
```

or/and

```bash
cd z-games
yarn
cd ..
```

6.4. Then go to the folder and run part you want to run or both parts:

```bash
cd z-games-api
yarn start start:dev
```

or/and

```bash
cd z-games
yarn run dev
```
That's it!
Check front-end here: [http://localhost:3000](http://localhost:3000)!
Check back-end here: [http://localhost:4000](http://localhost:4000)!



P.S. If you want to change the separate game - clone it's repository! You can work with it using [npm link](https://docs.npmjs.com/cli/link.html) command.

# Help #

If you want to help check current [issues](https://github.com/zinovik/z-games-api/issues) (you can use [ZenHub](https://zenhub.com)) or create the new one! Also, you can write any comment.

Thank you, [Richard Caseres](https://github.com/richardbmx), for the amazing Logo!

# Technologies #

1. Typescript
2. NodeJS
3. Socket.io
4. NestJS
5. React
6. Redux

# License #

[Apache License 2.0](/LICENSE)
