#!/bin/bash

set -e

POSTGRES_MULTIPLE_DATABASES="colorcom_auth,colorcom_products,colorcom_vendors,colorcom_cart,colorcom_orders"

function create_user_and_databases() {
    local database=$1
    echo "Creating database '$database'"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
        CREATE DATABASE $database;
        GRANT ALL PRIVILEGES ON DATABASE $database TO $POSTGRES_USER;
EOSQL
}

if [ -n "$POSTGRES_MULTIPLE_DATABASES" ]; then
    echo "Multiple databases creation requested: $POSTGRES_MULTIPLE_DATABASES"
    for db in $(echo $POSTGRES_MULTIPLE_DATABASES | tr ',' ' '); do
        create_user_and_databases $db
    done
    echo "Multiple databases created"
fi
