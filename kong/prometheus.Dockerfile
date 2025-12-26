FROM prom/prometheus:latest

# Copy Prometheus config into the image to avoid host bind-mount requirement
COPY prometheus.yml /etc/prometheus/prometheus.yml
