# Backend

A FastAPI application created with Poetry.

## Setup

Make sure you have Poetry installed. If not, you can install it following the instructions at [https://python-poetry.org/docs/#installation](https://python-poetry.org/docs/#installation).

## Installation

The dependencies are already installed if you've run `poetry add "fastapi[all]" uvicorn`. If not, run:

```bash
cd backend
poetry install
```

## Running the application

To run the FastAPI application:

```bash
cd backend
poetry run uvicorn backend.main:app --reload
```

The API will be available at [http://localhost:8000](http://localhost:8000).

## API Documentation

FastAPI automatically generates interactive API documentation:
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)
