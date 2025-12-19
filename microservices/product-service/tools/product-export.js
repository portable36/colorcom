#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function main() {
  const out = process.argv[2] || 'products_export.json';
  const url = (process.env.PRODUCT_SERVICE_URL || 'http://localhost:3000') + '/products/export?format=json';
  const tenant = process.env.TENANT_ID || 'default';
  const resp = await axios.get(url, { headers: { 'x-tenant-id': tenant } });
  fs.writeFileSync(out, JSON.stringify(resp.data, null, 2));
  console.log('Exported to', out);
}

main().catch((err) => { console.error(err?.message || err); process.exit(1); });
