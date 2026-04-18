FROM python:3.13-slim

WORKDIR /app

# Install poetry
RUN pip install poetry

# Copy dependency files
COPY pyproject.toml poetry.lock* ./

# Install dependencies
RUN poetry config virtualenvs.create false \
    && poetry install --only main --no-root --no-interaction --no-ansi

# Copy application code
COPY . .

# Create data directory for persistent storage
RUN mkdir -p /data

# Expose port
EXPOSE 8080

# Set database path environment variable
ENV DATABASE_PATH=/data/plaid.db

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
