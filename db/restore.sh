#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: ./restore.sh <backup-file.sql.gz>"
  exit 1
fi

BACKUP_FILE=$1

DB_NAME="keralavotes"
DB_USER="keralavotes"
DB_HOST="localhost"
DB_PORT="5432"

echo "Restoring from $BACKUP_FILE ..."

gunzip -c "$BACKUP_FILE" | psql \
  -U "$DB_USER" \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  "$DB_NAME"

echo "Restore complete"

