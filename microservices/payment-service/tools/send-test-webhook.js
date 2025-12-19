#!/usr/bin/env node
const { argv } = require('process');

async function main() {
  const url = process.env.WEBHOOK_URL || argv[2] || 'http://localhost:3009/payment/webhook/bkash';
  const payload = {
    tenantId: process.env.TENANT || 'default',
    orderId: process.env.ORDER_ID || 'test-order-1',
    amount: process.env.AMOUNT || 100.0,
    trxID: process.env.TXN || 'txn-12345',
    status: process.env.STATUS || 'completed'
  };

  console.log('Posting test webhook to', url, 'payload:', payload);
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const text = await res.text();
    console.log('Response', res.status, text);
  } catch (err) {
    console.error('Failed to post webhook', err);
    process.exit(1);
  }
}

main();
