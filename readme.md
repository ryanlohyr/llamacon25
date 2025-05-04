# Project Setup and Usage Guide

This project consists of a FastAPI backend and a Next.js frontend.

## Prerequisites

### Backend
- Python 3.13+
- Poetry (for Python dependency management)
  ```
  pipx install poetry
  ```

If you do not have pipx, you can run `brew install pipx`

## Setup

To set up the project, run:

```
make setup
```


## Running the Project

### Start the Frontend

```
make start-frontend
```

### Start the Backend

```
make start-backend
```

This will start the FastAPI server with Uvicorn in reload mode.

## Project Structure

The project follows a standard structure with frontend and backend code separated:
- `/frontend`: Next.js frontend application
- `/backend`: FastAPI backend application
