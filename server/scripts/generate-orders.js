const fs = require('fs');

const orders = Array.from({ length: 1000 }, (_, i) => ({
  id: `ORD-${i + 1}`,
  status: 'PENDING',
  amount: Math.floor(Math.random() * 1000),
  createdAt: Date.now(),
  updatedAt: Date.now()
}));

fs.writeFileSync(
  'mock-orders-1000.json',
  JSON.stringify(orders, null, 2)
);

console.log('✅ mock-orders-1000.json generated');
