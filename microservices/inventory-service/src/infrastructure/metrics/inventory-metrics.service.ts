import { Injectable } from '@nestjs/common';
import { Counter, Gauge, Histogram } from 'prom-client';

@Injectable()
export class InventoryMetricsService {
  // Counters for operations
  private reservationsSuccessCounter: Counter;
  private reservationsFailedCounter: Counter;
  private releaseSuccessCounter: Counter;
  private confirmSuccessCounter: Counter;
  private transferSuccessCounter: Counter;
  private damageCounter: Counter;
  private stockUpdateCounter: Counter;
  private alertsCreatedCounter: Counter;

  // Gauges for state
  private currentStockGauge: Gauge;
  private currentReservedGauge: Gauge;
  private currentDamagedGauge: Gauge;
  private lowStockAlertsGauge: Gauge;

  // Histograms for latency
  private reservationDurationHistogram: Histogram;
  private stockUpdateDurationHistogram: Histogram;

  constructor() {
    // Initialize counters
    this.reservationsSuccessCounter = new Counter({
      name: 'inventory_reservations_success_total',
      help: 'Total successful stock reservations',
      labelNames: ['tenant_id', 'warehouse_id'],
    });

    this.reservationsFailedCounter = new Counter({
      name: 'inventory_reservations_failed_total',
      help: 'Total failed stock reservations',
      labelNames: ['tenant_id', 'warehouse_id', 'reason'],
    });

    this.releaseSuccessCounter = new Counter({
      name: 'inventory_releases_success_total',
      help: 'Total successful stock releases',
      labelNames: ['tenant_id', 'warehouse_id'],
    });

    this.confirmSuccessCounter = new Counter({
      name: 'inventory_confirms_success_total',
      help: 'Total confirmed reservations',
      labelNames: ['tenant_id', 'warehouse_id'],
    });

    this.transferSuccessCounter = new Counter({
      name: 'inventory_transfers_total',
      help: 'Total stock transfers between warehouses',
      labelNames: ['tenant_id', 'from_warehouse', 'to_warehouse'],
    });

    this.damageCounter = new Counter({
      name: 'inventory_damaged_units_total',
      help: 'Total units marked as damaged',
      labelNames: ['tenant_id', 'warehouse_id'],
    });

    this.stockUpdateCounter = new Counter({
      name: 'inventory_stock_updates_total',
      help: 'Total stock update operations',
      labelNames: ['tenant_id', 'warehouse_id', 'operation'],
    });

    this.alertsCreatedCounter = new Counter({
      name: 'inventory_alerts_created_total',
      help: 'Total alerts created (low stock, out of stock, etc)',
      labelNames: ['tenant_id', 'alert_type', 'severity'],
    });

    // Initialize gauges
    this.currentStockGauge = new Gauge({
      name: 'inventory_total_stock',
      help: 'Current total stock units across all warehouses',
      labelNames: ['tenant_id', 'warehouse_id', 'product_id'],
    });

    this.currentReservedGauge = new Gauge({
      name: 'inventory_reserved_units',
      help: 'Current reserved units',
      labelNames: ['tenant_id', 'warehouse_id', 'product_id'],
    });

    this.currentDamagedGauge = new Gauge({
      name: 'inventory_damaged_units',
      help: 'Current damaged units',
      labelNames: ['tenant_id', 'warehouse_id', 'product_id'],
    });

    this.lowStockAlertsGauge = new Gauge({
      name: 'inventory_low_stock_alerts_active',
      help: 'Number of active low stock alerts',
      labelNames: ['tenant_id'],
    });

    // Initialize histograms
    this.reservationDurationHistogram = new Histogram({
      name: 'inventory_reservation_duration_seconds',
      help: 'Time taken to complete a reservation',
      labelNames: ['tenant_id'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    });

    this.stockUpdateDurationHistogram = new Histogram({
      name: 'inventory_stock_update_duration_seconds',
      help: 'Time taken to update stock',
      labelNames: ['tenant_id'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    });
  }

  // Counter methods
  recordReservationSuccess(tenantId: string, warehouseId: string, count = 1) {
    this.reservationsSuccessCounter.labels(tenantId, warehouseId).inc(count);
  }

  recordReservationFailed(tenantId: string, warehouseId: string, reason: string, count = 1) {
    this.reservationsFailedCounter.labels(tenantId, warehouseId, reason).inc(count);
  }

  recordReleaseSuccess(tenantId: string, warehouseId: string, count = 1) {
    this.releaseSuccessCounter.labels(tenantId, warehouseId).inc(count);
  }

  recordConfirmSuccess(tenantId: string, warehouseId: string, count = 1) {
    this.confirmSuccessCounter.labels(tenantId, warehouseId).inc(count);
  }

  recordTransfer(tenantId: string, fromWarehouse: string, toWarehouse: string, count = 1) {
    this.transferSuccessCounter.labels(tenantId, fromWarehouse, toWarehouse).inc(count);
  }

  recordDamaged(tenantId: string, warehouseId: string, quantity: number) {
    this.damageCounter.labels(tenantId, warehouseId).inc(quantity);
  }

  recordStockUpdate(tenantId: string, warehouseId: string, operation: string, count = 1) {
    this.stockUpdateCounter.labels(tenantId, warehouseId, operation).inc(count);
  }

  recordAlertCreated(tenantId: string, alertType: string, severity: string) {
    this.alertsCreatedCounter.labels(tenantId, alertType, severity).inc();
  }

  // Gauge methods
  setCurrentStock(tenantId: string, warehouseId: string, productId: string, quantity: number) {
    this.currentStockGauge.labels(tenantId, warehouseId, productId).set(quantity);
  }

  setCurrentReserved(tenantId: string, warehouseId: string, productId: string, quantity: number) {
    this.currentReservedGauge.labels(tenantId, warehouseId, productId).set(quantity);
  }

  setCurrentDamaged(tenantId: string, warehouseId: string, productId: string, quantity: number) {
    this.currentDamagedGauge.labels(tenantId, warehouseId, productId).set(quantity);
  }

  setLowStockAlerts(tenantId: string, count: number) {
    this.lowStockAlertsGauge.labels(tenantId).set(count);
  }

  // Histogram methods
  recordReservationDuration(tenantId: string, seconds: number) {
    this.reservationDurationHistogram.labels(tenantId).observe(seconds);
  }

  recordStockUpdateDuration(tenantId: string, seconds: number) {
    this.stockUpdateDurationHistogram.labels(tenantId).observe(seconds);
  }
}
