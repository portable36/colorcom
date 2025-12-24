#!/bin/sh
set -e

DBS="colorcom_shipments colorcom_crm colorcom_inventory colorcom_payments"
for db in $DBS; do
  echo "Checking database $db"
  exists=$(psql -U "$POSTGRES_USER" -tAc "SELECT 1 FROM pg_database WHERE datname='$db'")
  if [ "$exists" != "1" ]; then
    echo "Creating database $db"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
      CREATE DATABASE $db;
      GRANT ALL PRIVILEGES ON DATABASE $db TO $POSTGRES_USER;
EOSQL
  else
    echo "Database $db already exists"
  fi
done

echo "Done"