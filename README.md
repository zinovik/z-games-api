![img](./logo.png)

## What ##

Z-Games is a tiny board games portal.

The project consists of two main parts and several games modules:
1. [Back-end](https://github.com/zinovik/z-games-api)
2. [Fron-end](https://github.com/zinovik/z-games)
- [Game template](https://github.com/zinovik/z-games-base-game)
- [No, Thanks game](https://github.com/zinovik/z-games-no-thanks) [[wiki](https://en.wikipedia.org/wiki/No_Thanks!_(game))]
- [Perudo game](https://github.com/zinovik/z-games-perudo) [[wiki](https://en.wikipedia.org/wiki/Dudo)]
- [6 nimmt! game](https://github.com/zinovik/z-games-six-nimmt) (in development) [[wiki](https://en.wikipedia.org/wiki/6_Nimmt!)]
- [Lost cities game](https://github.com/zinovik/z-games-lost-cities) (in development) [[wiki](https://en.wikipedia.org/wiki/Lost_Cities)]

## Where ##

There are two environments where you can check current versions:
1. Development (dev branch) (https://z-games-dev.herokuapp.com)
2. Production (master branch) (https://z-games.herokuapp.com)

## How ###

Also, you can run a development environment on your local machine.

Before you start answer two questions:
1. Do you want to work with this part (Back-end **or** Front-end) or the whole project (Back-end **and** Front-end)?
2. Do you want to use [Docker](https://docker.com) (the easiest way)?

Let's start!

- If you want to use [Docker](https://docker.com) please install it and docker-compose (if you are going to work with the whole project), else install [Node.js with npm](https://nodejs.org) and install yarn with this command:

```js
npm install -global yarn
```

- If you want to run only this part - clone only this repository, else clone both:

```js
git clone https://github.com/zinovik/z-games-api
git clone https://github.com/zinovik/z-games
```

- create .env file in each cloned repository (if you use Docker you can use Docker database: DATABASE_URL='postgres://postgres:dbpass123@database:5432/z-games').

- If you use docker and want to run the whole project go to cloned front-end part repository folder, build containers and run it, that's all, check [https://localhost:3000](https://localhost:3000)!

```js
cd z-games
docker-compose up --build
```

- Now, if you use docker and want to run only one part go to cloned repository folder, build container and run it, that's all, check ([https://localhost:4000](https://localhost:4000) or [https://localhost:3000](https://localhost:3000))!

back-end part:

```js
cd z-games-api
docker build -t z-games-api .
docker run z-games-api
```

or (if you use Docker database)

```js
cd z-games-api
docker-compose run --build
```

or front-end part

```js
cd z-games
docker build -t z-games .
docker run z-games
```

- If you don't use Docker install all dependencies by running these commands for cloned repositories

```js
// for back-end part (start)
cd z-games-api
yarn
cd ..
// for back-end part (end)
// for front-end part (start)
cd z-games
yarn
cd ..
// for front-end part (end)
```

- Then go to the folder and run part you want to run or both parts, that's all, check ([https://localhost:4000](https://localhost:4000) or [https://localhost:3000](https://localhost:3000))!

```js
// for back-end part (start)
cd z-games-api
yarn start start:dev
// for back-end part (end)
// for front-end part (start)
cd z-games
yarn run dev
// for front-end part (end)
```

If you want to change the separate game - clone it's repository!

P. S. If you want to use docker for database separately (don't know why) run this:
```js
cd z-games-api
cd database
docker-comopose up
```

## Help ##

If you want to help check current [issues](https://github.com/zinovik/z-games-api/issues) (you can use [ZenHub](https://zenhub.com)) or create the new one!

Thank you, [Richard Caseres](https://github.com/richardbmx) for the amazing Logo!

## Technologies ##

1. Typescript
2. NodeJS
3. Socket.io
4. NestJS
5. React
6. Redux

## License ##

[Apache License 2.0](/LICENSE)
