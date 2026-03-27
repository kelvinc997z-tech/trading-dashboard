#!/bin/bash

# Manual trigger for trial cron
# Usage: ./scripts/run-trial-check.sh

# Load environment variables from .env.local if exists
if [ -f ".env.local" ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

# Check if ADMIN_SECRET_KEY is set
if [ -z "$ADMIN_SECRET_KEY" ]; then
  echo "⚠️  ADMIN_SECRET_KEY not set. Some features may not work."
  echo "Please set it in .env.local or export it manually."
  echo ""
  echo "Continuing in DRY_RUN mode..."
  export DRY_RUN="true"
fi

# Run the monitor
node scripts/trial-monitor.js
