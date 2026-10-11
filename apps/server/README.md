![Nest Logo](https://nestjs.com/img/logo-small.svg)

A progressive [Node.js](http://nodejs.org) framework for building efficient and scalable server-side applications.

![NPM Version](https://img.shields.io/npm/v/@nestjs/core.svg)![Package License](https://img.shields.io/npm/l/@nestjs/core.svg)![NPM Downloads](https://img.shields.io/npm/dm/@nestjs/common.svg)![CircleCI](https://img.shields.io/circleci/build/github/nestjs/nest/master)![Discord](https://img.shields.io/badge/discord-online-brightgreen.svg)![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)![Donate us](https://img.shields.io/badge/Donate-PayPal-ff3f59.svg) ![Support us](https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg)![Follow us on Twitter](https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow)

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ yarn install
```



## Compile and run the project

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```



## Run tests

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```



## Prisma Studio на сервере

Studio на проде запускается без `--hostname` (флаг убран в Prisma 7) и слушает только `127.0.0.1`, поэтому открыть напрямую по IP:порт не получится — нужен SSH-туннель.

1. На сервере, в фоне (не в интерактивном терминале, иначе `Ctrl+C` убьёт процесс):

```bash
cd /var/www/scena/apps/server
nohup npx prisma studio --port 5555 --browser none > studio.log 2>&1 &
```

   или через `tmux`/`screen`:

```bash
tmux new -s studio
npx prisma studio --port 5555 --browser none
# Ctrl+B, затем D — отсоединиться
```

1. У себя локально пробросить порт:

```bash
ssh -L 5555:localhost:5555 root@147.45.100.109
```

1. Открыть в браузере `http://localhost:5555`.

Проверить, что Studio жива и слушает именно `127.0.0.1:5555`:

```bash
ss -tlnp | grep 5555
```



## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ yarn install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).



## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)



## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).