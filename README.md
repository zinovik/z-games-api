![img](./logo.png)

## What ##

Z-Games is a tiny board games portal.

It contains these [game](https://github.com/zinovik/z-games-base-game)s at the moment:
- [No, Thanks](https://github.com/zinovik/z-games-no-thanks) [[wiki](https://en.wikipedia.org/wiki/No_Thanks!_(game))]
- [Perudo](https://github.com/zinovik/z-games-perudo) [[wiki](https://en.wikipedia.org/wiki/Dudo)]
- [6 nimmt!](https://github.com/zinovik/z-games-six-nimmt) (in development) [[wiki](https://en.wikipedia.org/wiki/6_Nimmt!)]
- [Lost cities](https://github.com/zinovik/z-games-lost-cities) (in development) [[wiki](https://en.wikipedia.org/wiki/Lost_Cities)]

## Where ##

There are two environments where you can check current versions:
1. Development (dev branch) (https://z-games-dev.herokuapp.com)
2. Production (master branch) (https://z-games.herokuapp.com)

## How ###

Also, you can run development environment on your local machine.
The project consists from two main parts and several games modules:
1. [Back-end](https://github.com/zinovik/z-games-api)
2. [Fron-end](https://github.com/zinovik/z-games)
- [Game template](https://github.com/zinovik/z-games-base-game)
- [No, Thanks game](https://github.com/zinovik/z-games-no-thanks)
- [Perudo game](https://github.com/zinovik/z-games-perudo)
- [6 nimmt! game](https://github.com/zinovik/z-games-six-nimmt)
- [Lost cities game](https://github.com/zinovik/z-games-lost-cities)

Before you start answer two questions?
1. Do you want to work with this part (Back-end **or** Front-end) or the whole project (Back-end **and** Front-end)?
2. Do you want to use (Docker)[https://docker.com] (the easiest way)?

We have 4 variants:
1. This part with Docker
2. This part without Docker
3. The whole project with Docker
4. The whole project without Docker

Let's start!

- If you want to use Docker please install it from (here)[https://docker.com], if you don't want to use it install Node.js with npm from (here)[https://nodejs.org] and install yarn with this command:

```js
npm install -global yarn
```

- If you want to run only this part - clone only this repository, else clone both

```js
git clone https://github.com/zinovik/z-games-api
git clone https://github.com/zinovik/z-games
```

- create .env file in each cloned repository (if you use Docker you can use Docker database: DATABASE_URL='postgres://postgres:dbpass123@database:5432/z-games').

- If you use docker and want to run the whole project go to cloned front-ed part repository folder, build containers and run its, that's all, check [https://localhost:9000](https://localhost:9000)!

```js
cd z-games
docker-compose run --build
```

- Now, if you use docker and want to run only one part go to cloned repository folder, build container and run it, that's all, check ([https://localhost:4000](https://localhost:4000) or [https://localhost:9000](https://localhost:9000))!

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

or frone-end part

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

- Then go to run part you want to run or both parts, that's all, check ([https://localhost:4000](https://localhost:4000) or [https://localhost:3000](https://localhost:3000))!

```js
// for back-end part (start)
cd z-games-api
yarn start serve
// for back-end part (end)
// for front-end part (start)
cd z-games
yarn run dev
// for front-end part (end)
```

If you want to change the separate game - clone it's repository!

## Help ##

If you want to help check current [issues](https://github.com/zinovik/z-games-api/issues) (you can use [ZenHub](https://zenhub.com)) or create the new one!

Thank you, [Richard Caseres](https://github.com/richardbmx) for the amazing Logo!

## Technologies ##

1. Typescript
2. NodeJS
3. Socket.io
4. Express
5. React
6. Redux

## License ##

[Apache License 2.0](/LICENSE)
