import { Injectable, Logger } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaService {
  private kafka: Kafka;
  private producer: Producer;
  private connected = false;
  private readonly logger = new Logger(KafkaService.name);

  async onModuleInit() {
    // Don't wait for connection on init - connect lazily when needed
    this.initializeKafka().catch((err) => {
      this.logger.warn(`Failed to initialize Kafka on startup: ${err?.message}`);
    });
  }

  private async initializeKafka() {
    if (this.connected) return;

    try {
      this.kafka = new Kafka({
        clientId: 'order-service',
        brokers: [process.env.KAFKA_BROKERS || 'kafka:9092'],
      });

      this.producer = this.kafka.producer();
      await this.producer.connect();
      this.connected = true;
      this.logger.log('Kafka Producer connected');
    } catch (error: any) {
      this.logger.warn(`Kafka connection failed: ${error?.message}`);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.producer) {
      await this.producer.disconnect();
    }
  }

  async publishEvent(topic: string, event: any) {
    try {
      if (!this.connected) {
        await this.initializeKafka();
      }

      await this.producer.send({
        topic,
        messages: [
          {
            key: event.orderId,
            value: JSON.stringify(event),
          },
        ],
      });
      this.logger.log(`Event published to ${topic}: ${event.orderId}`);
    } catch (error: any) {
      this.logger.error(`Failed to publish event: ${error?.message}`);
      // Don't throw - log and continue to keep service running
    }
  }
}
