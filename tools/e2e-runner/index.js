#!/usr/bin/env node
const { execSync, spawn } = require('child_process');
const axios = require('axios');
const { Kafka } = require('kafkajs');

function runCmd(cmd) {
  console.log('> ' + cmd);
  return execSync(cmd, { stdio: 'inherit' });
}

async function waitForUrl(url, timeoutMs = 120000, interval = 2000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await axios.get(url, { timeout: 2000 });
      if (res.status === 200) return true;
    } catch (e) {
      // ignore
    }
    await new Promise((r) => setTimeout(r, interval));
  }
  throw new Error(`Timeout waiting for ${url}`);
}

async function run() {
  const args = process.argv.slice(2);
  const noCompose = args.includes('--no-compose');

  try {
    if (!noCompose) {
      console.log('Bringing up docker compose stack (background)');
      runCmd('docker compose up -d --build');
    }

    console.log('Waiting for Order service health endpoint...');
    await waitForUrl('http://localhost:3005/orders/health', 120000, 2000);
    console.log('Order service is healthy');

    // Create test order
    const payload = {
      cartItems: [
        {
          productId: 'cmja0y4vw0003wkvmt10dpys6',
          vendorId: 'cmja362u70001un43npwy2jzc',
          name: 'Wireless Headphones',
          price: 199.99,
          quantity: 1
        }
      ],
      shippingAddress: {
        street: '789 New Rd',
        city: 'Dhaka',
        state: 'BD',
        zipCode: '1207',
        country: 'Bangladesh'
      },
      taxAmount: 10,
      shippingFee: 3
    };

    console.log('Posting test order to Order service...');
    const res = await axios.post('http://localhost:3005/orders', payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': 'store-1',
        'x-user-id': 'user-123'
      },
      timeout: 10000
    });

    if (!res.data || !res.data.id) {
      throw new Error('Order creation response missing id');
    }

    const orderId = res.data.id;
    console.log('Created order id:', orderId);

    // Consume Kafka message
    console.log('Connecting Kafka consumer to localhost:9092 to verify order.created...');
    const kafka = new Kafka({ brokers: ['localhost:9092'] });
    const consumer = kafka.consumer({ groupId: `colorcom-e2e-${Date.now()}` });
    await consumer.connect();
    await consumer.subscribe({ topic: 'order.created', fromBeginning: true });

    let found = false;
    const timeoutMs = 60000;
    const start = Date.now();

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const value = message.value ? message.value.toString() : '';
          if (value.includes(orderId)) {
            console.log('Found order.created message for orderId:', orderId);
            found = true;
            // allow consumer to disconnect
            setTimeout(async () => {
              try {
                await consumer.disconnect();
              } catch (e) {}
              // If not using compose teardown here, the process will exit below
            }, 500);
          } else {
            console.log('Received message (not match):', value.substring(0, 200));
          }
        } catch (err) {
          console.error('Error parsing message', err.message);
        }
      }
    });

    // wait until found or timeout
    while (!found && Date.now() - start < timeoutMs) {
      await new Promise((r) => setTimeout(r, 500));
    }

    if (!found) {
      throw new Error('Did not receive order.created message within timeout');
    }

    console.log('E2E test succeeded');

  } catch (err) {
    console.error('E2E test failed:', err && err.message ? err.message : err);
    process.exitCode = 1;
  } finally {
    if (!process.argv.includes('--no-teardown')) {
      try {
        console.log('Tearing down docker compose stack (if we started it)');
        runCmd('docker compose down -v --remove-orphans');
      } catch (e) {
        console.error('Error during teardown:', e && e.message ? e.message : e);
      }
    }
  }
}

run();
