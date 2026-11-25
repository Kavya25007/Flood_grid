'use strict';
// Input validation + sanitisation (defence against XSS / bad data).
const TYPES = ['food', 'medical', 'rescue', 'shelter'];
const URGENCY = ['low', 'medium', 'high', 'critical'];
const clean = (s) => String(s ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/[<>]/g, '').trim();
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

function requestInput(b) {
  const errors = {};
  const type = String(b.type || '').toLowerCase();
  const urgency = String(b.urgency || '').toLowerCase();
  const location = clean(b.location);
  const description = clean(b.description);
  const phone = clean(b.phone || '');
  if (!TYPES.includes(type)) errors.type = 'Type must be food, medical, rescue or shelter.';
  if (!URGENCY.includes(urgency)) errors.urgency = 'Urgency must be low, medium, high or critical.';
  if (location.length < 3 || location.length > 200) errors.location = 'Location must be 3 to 200 characters.';
  if (phone && (phone.length < 7 || phone.length > 25 || !/^[+0-9\s\-()]{7,25}$/.test(phone))) {
    errors.phone = 'Phone number must be 7 to 25 characters (digits, +, -, spaces).';
  }
  if (description.length > 500) errors.description = 'Description can be at most 500 characters.';
  return { errors, value: { type, urgency, location, phone: phone || null, description } };
}
function registerInput(b) {
  const errors = {};
  const name = clean(b.name), email = clean(b.email).toLowerCase(), password = String(b.password || '');
  const role = String(b.role || '').toLowerCase();
  if (name.length < 2 || name.length > 80) errors.name = 'Name must be 2 to 80 characters.';
  if (!EMAIL.test(email)) errors.email = 'Enter a valid email.';
  if (password.length < 8 || password.length > 100 || !/[A-Za-z]/.test(password) || !/\d/.test(password))
    errors.password = 'Password needs 8+ characters with a letter and a number.';
  if (!['citizen', 'volunteer'].includes(role)) errors.role = 'Role must be citizen or volunteer.';
  return { errors, value: { name, email, password, role } };
}
module.exports = { requestInput, registerInput, clean, TYPES, URGENCY };
