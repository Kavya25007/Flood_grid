'use strict';
// Salted password hashing with scrypt (memory-hard, same purpose as bcrypt).
const crypto = require('node:crypto');
const hash = (pw) => {
  const salt = crypto.randomBytes(16);
  const dk = crypto.scryptSync(pw, salt, 64);
  return `scrypt$${salt.toString('hex')}$${dk.toString('hex')}`;
};
const compare = (pw, stored) => {
  const [alg, salt, dk] = String(stored).split('$');
  if (alg !== 'scrypt' || !salt || !dk) return false;
  const test = crypto.scryptSync(pw, Buffer.from(salt, 'hex'), 64);
  return crypto.timingSafeEqual(test, Buffer.from(dk, 'hex'));
};
module.exports = { hash, compare };
