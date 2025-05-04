setup:
	cd frontend && npm install
	cd backend && poetry install

start-frontend:
	cd frontend && npm run dev

start-backend:
	cd backend && poetry run uvicorn src.main:app --reload