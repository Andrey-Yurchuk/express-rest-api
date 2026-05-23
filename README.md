## Express REST API

REST API для авторизации, JWT-сессий и управления файлами в локальном хранилище

### Требования

- Node.js 24+
- npm
- Docker и Docker Compose

### Клонирование репозитория

```bash
git clone https://github.com/Andrey-Yurchuk/express-rest-api.git
cd express-rest-api
```

### Переменные окружения

Создайте локальный файл окружения:

```bash
cp .env.example .env
```

Перед запуском заполните значения в `.env`

Основные переменные:

- `PORT` - порт API, по умолчанию `3000`
- `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD` - настройки MySQL для Docker Compose
- `MYSQL_PORT` - порт MySQL на хосте
- `DATABASE_URL` - строка подключения Prisma для локальных команд
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` - секреты для подписи JWT
- `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL` - время жизни токенов в секундах
- `UPLOAD_DIR` - директория для загружаемых файлов
- `MAX_UPLOAD_SIZE_MB` - максимальный размер загружаемого файла
- `PAGINATION_DEFAULT_PAGE`, `PAGINATION_DEFAULT_LIST_SIZE` - значения пагинации по умолчанию

При запуске API через Docker Compose переменная `DATABASE_URL` переопределяется так, чтобы API подключался к MySQL по имени сервиса `mysql`

### Запуск через Docker Compose

Собрать и запустить сервисы:

```bash
docker compose up -d --build
```

Применить миграции Prisma:

```bash
docker compose exec api npx prisma migrate deploy
```

Проверить health endpoint:

```bash
curl http://localhost:3000/api/health
```

Swagger UI:

```text
http://localhost:3000/api/docs
```

### NPM-скрипты

- `npm run dev` - собрать и запустить API в watch mode
- `npm run build` - скомпилировать TypeScript в `dist`
- `npm start` - запустить собранное приложение из `dist/server.js`
- `npm run lint` - запустить ESLint для исходного кода
- `npm run format` - отформатировать файлы через Prettier
- `npm test` - запустить Jest-тесты
- `npm run test:watch` - запустить Jest в watch mode
- `npm run test:cov` - запустить Jest с отчетом покрытия
- `npm run prisma:generate` - сгенерировать Prisma Client
- `npm run prisma:migrate` - применить миграции Prisma в dev-режиме

### Основные endpoints

Auth:

- `POST /api/signup`
- `POST /api/signin`
- `POST /api/signin/new_token`
- `GET /api/info`
- `GET /api/logout`

Files:

- `POST /api/file/upload`
- `GET /api/file/list`
- `GET /api/file/:id`
- `GET /api/file/download/:id`
- `PUT /api/file/update/:id`
- `DELETE /api/file/delete/:id`

Health:

- `GET /api/health`
