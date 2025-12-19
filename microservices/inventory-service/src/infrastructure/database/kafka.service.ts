import { Injectable, Logger } from '@nestjs/common';
import { Kafka } from 'kafkajs';

@Injectable()
export class KafkaService {
  private kafka: Kafka;
  private producer: any;
  private readonly logger = new Logger(KafkaService.name);

  constructor() {
    const brokers = (process.env.KAFKA_BROKERS || 'kafka:9092').split(',');
    this.kafka = new Kafka({ brokers, clientId: 'inventory-service' });
  }

  async publishEvent(topic: string, payload: any) {
    try {
      if (!this.producer) {
        this.producer = this.kafka.producer();
        await this.producer.connect();
        this.logger.log('Kafka producer connected');
      }
      await this.producer.send({
        topic,
        messages: [{ value: JSON.stringify(payload) }],
      });
      this.logger.log(`Event published to ${topic}`);
    } catch (err) {
      this.logger.error(`Failed to publish event: ${(err as any)?.message || String(err)}`);
    }
  }
}
