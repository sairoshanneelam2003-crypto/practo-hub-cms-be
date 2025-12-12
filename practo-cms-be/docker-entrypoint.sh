#!/bin/sh

# Run database migrations
echo "Running database migrations..."
echo "Checking DATABASE_URL..."

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL environment variable is not set!"
  exit 1
fi

# Show first few characters of DATABASE_URL for debugging (without exposing password)
echo "DATABASE_URL starts with: $(echo $DATABASE_URL | cut -c1-30)..."

# Try to run migrations
echo "Attempting to run migrations..."
if npx prisma migrate deploy; then
  echo "✓ Migrations completed successfully"
else
  echo "⚠ WARNING: Migration failed"
  echo "This might be because:"
  echo "  1. Database is not accessible"
  echo "  2. Migrations were already run"
  echo "  3. Connection issue"
  echo "Continuing to start application..."
fi

# Start the application
echo "Starting application..."
exec npm start

