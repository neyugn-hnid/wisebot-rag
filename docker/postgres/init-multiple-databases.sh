#!/bin/sh
set -e

create_db() {
  db_name="$1"
  echo "Creating database ${db_name}"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<-EOSQL
    SELECT 'CREATE DATABASE ${db_name}'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${db_name}')\gexec
EOSQL
}

create_db "wisebot_user_database"
create_db "wisebot_document_database"
create_db "wisebot_chat_database"
create_db "wisebot_widget_database"
create_db "wisebot_billing_database"
create_db "wisebot_embedding_database"
create_db "wisebot_ai_database"
