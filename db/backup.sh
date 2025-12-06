#!/bin/bash

# =====================
# PostgreSQL settings
# =====================
DB_NAME="keralavotes"
DB_USER="keralavotes"
DB_HOST="localhost"
DB_PORT="5432"

# Backup folder
BACKUP_DIR="./db/backups/manual"
mkdir -p "$BACKUP_DIR"

# Timestamped filename
FILE_NAME="backup_$(date +'%Y-%m-%d_%H-%M-%S').sql.gz"

echo "Creating backup: $FILE_NAME"

pg_dump \
  -U "$DB_USER" \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  "$DB_NAME" \
  | gzip > "$BACKUP_DIR/$FILE_NAME"

echo "Backup created at $BACKUP_DIR/$FILE_NAME"

