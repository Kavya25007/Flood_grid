const TYPES = ['food', 'medical', 'rescue', 'shelter'];
const URGENCY = ['low', 'medium', 'high', 'critical'];

// strip characters used for XSS payloads
function clean(s) {
  return String(s || '').trim().replace(/[<>]/g, '');
}

function validateLogin(req, res, next) {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email) || email.length > 150) {
    return res.status(400).json({ message: 'Valid email required' });
  }
  if (typeof password !== 'string' || password.length < 6 || password.length > 100) {
    return res.status(400).json({ message: 'Password must be 6-100 characters' });
  }
  next();
}

function validateRequest(req, res, next) {
  const { type, urgency, location, description } = req.body || {};
  if (!TYPES.includes(type)) return res.status(400).json({ message: 'Invalid type' });
  if (!URGENCY.includes(urgency)) return res.status(400).json({ message: 'Invalid urgency' });
  const loc = clean(location);
  if (loc.length < 3 || loc.length > 200) {
    return res.status(400).json({ message: 'Location must be 3-200 characters' });
  }
  const desc = clean(description);
  if (desc.length > 500) return res.status(400).json({ message: 'Description too long' });
  req.body.location = loc;
  req.body.description = desc;
  next();
}

module.exports = { validateLogin, validateRequest };
