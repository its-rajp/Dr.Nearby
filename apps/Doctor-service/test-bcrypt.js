import bcrypt from 'bcryptjs';

const hash = '$2b$10$6sVBGyv6VerYJQHBdxVD0.ZUR/uuWePn4xo27QZZd0eKpxzswnBia';
const password = 'password123';

(async () => {
  const ok = await bcrypt.compare(password, hash);
  console.log('compare:', ok);
})(); 
