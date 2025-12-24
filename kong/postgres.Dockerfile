FROM postgres:16-alpine

# Copy init script into the official Postgres image so Docker Desktop file-sharing is not needed at runtime
COPY ./kong/init-postgres.sh /docker-entrypoint-initdb.d/init-databases.sh
RUN chmod +x /docker-entrypoint-initdb.d/init-databases.sh
