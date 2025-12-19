const { Kafka } = require('kafkajs');

const brokers = (process.env.KAFKA_BROKERS || 'kafka:9092').split(',');
const topic = process.env.TOPIC || 'order.created';

async function run() {
  const kafka = new Kafka({ clientId: 'kafka-consumer', brokers });
  const consumer = kafka.consumer({ groupId: 'colorcom-consumers' });

  await consumer.connect();
  console.log('Kafka consumer connected to', brokers);

  await consumer.subscribe({ topic, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const key = message.key ? message.key.toString() : null;
        const value = message.value ? message.value.toString() : null;
        console.log(`Received message topic=${topic} partition=${partition} key=${key}`);
        console.log('payload=', value);
      } catch (err) {
        console.error('Failed to process message', err);
      }
    },
  });
}

run().catch((err) => {
  console.error('Consumer error', err);
  process.exit(1);
});
