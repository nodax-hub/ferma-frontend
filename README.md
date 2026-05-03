# Online Shop

Монорепозиторий с фронтендом и backend API.

## Структура

- `frontend/` - React, TypeScript, Vite, nginx Docker image.
- `backend/` - Python, FastAPI, SQLAlchemy, JWT, uvicorn Docker image.
- `.github/workflows/docker-publish.yml` - сборка и публикация двух Docker images в GitHub Container Registry.
- `docker-compose.yml` - локальный запуск frontend и backend.

## Локальный запуск через Docker Compose

```powershell
docker compose up --build
```

После запуска:

- frontend: `http://localhost:7777`
- backend healthcheck: `http://localhost:8888/health`
- backend docs: `http://localhost:8888/docs`
- тестовый админ: `admin@example.com` / `admin12345`

Frontend обращается к backend через относительный путь `/api`.

Остановить:

```powershell
docker compose down
```

## Deploy через готовые Docker images

Пример для сервера лежит в `docker-compose.deploy.example.yml`.

Перед запуском замени `SECRET_KEY` на секретное значение. Чтобы создать администратора при старте backend, укажи `ADMIN_EMAIL` и `ADMIN_PASSWORD` в окружении backend. Пароль должен быть не короче 8 символов.

```powershell
docker compose -f docker-compose.deploy.example.yml up -d
```

Watchtower в этом примере обновляет только контейнеры с label `com.centurylinklabs.watchtower.enable=true`.

## Локальный запуск без Docker

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Backend:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## GitHub Packages

При push в `master` workflow собирает и публикует:

- `ghcr.io/<owner>/<repo>/frontend:latest`
- `ghcr.io/<owner>/<repo>/backend:latest`

Также для каждого образа публикуется SHA-tag.
