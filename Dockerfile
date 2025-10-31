FROM python:3.11-slim

WORKDIR /app

# Copy all repository files
COPY . .

# Install dependencies if requirements.txt exists
RUN pip install --no-cache-dir -r requirements.txt || true

# Run the daily brief generation script
CMD ["python", "scripts/generate_daily_brief.py"]
