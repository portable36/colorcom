#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function main() {
  const file = process.argv[2];
  const url = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3000/products/import';
  const tenant = process.env.TENANT_ID || 'default';

  if (!file) {
    console.error('Usage: product-import.js <file.json|file.csv>');
    process.exit(2);
  }

  const ext = path.extname(file).toLowerCase();
  if (ext === '.json') {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const resp = await axios.post(url, data, { headers: { 'x-tenant-id': tenant } });
    console.log(resp.data);
  } else {
    // multipart upload
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', fs.createReadStream(file));
    const resp = await axios.post(url, form, { headers: { ...form.getHeaders(), 'x-tenant-id': tenant } });
    console.log(resp.data);
  }
}

main().catch((err) => { console.error(err?.message || err); process.exit(1); });
