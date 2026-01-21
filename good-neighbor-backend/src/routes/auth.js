const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/connection');
const { body, validationResult } = require('express-validator');
const { logAuth } = require('../services/loggerService');

// Argon2 is optional - only needed for new registrations
let argon2;
try {
  argon2 = require('argon2');
} catch (err) {
  console.warn('Argon2 not installed. New registrations will require it.');
  argon2 = null;
}

// Validation rules
// Support both login_id (for superadmins) and phone/email (for regular users)
const loginValidation = [
  body('password').notEmpty().withMessage('Пароль обов\'язковий'),
  body().custom((value) => {
    // At least one of login_id, phone, or email must be provided
    if (!value.login_id && !value.phone && !value.email) {
      throw new Error('Потрібно вказати ID користувача, телефон або email');
    }
    return true;
  })
];

const activateValidation = [
  body('invitation_code').notEmpty().withMessage('Код запрошення обов\'язковий'),
  body('password').isLength({ min: 6 }).withMessage('Пароль має бути мінімум 6 символів'),
  body('full_name').notEmpty().withMessage('ПІБ обов’язкове'),
  body('phone').notEmpty().withMessage('Телефон обов’язковий')
];

// Helper to generate token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      role: user.role, 
      apartment_id: user.apartment_id,
      full_name: user.full_name,
      osbb_id: user.osbb_id  // Include osbb_id for super_admin checks
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// POST /api/auth/login
router.post('/login', loginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { login_id, phone, email, password } = req.body;

  try {
    let user = null;
    let identifier = null;

    // Determine login method based on provided credentials
    // Architectural separation:
    // - SuperAdmin users: login with login_id (no phone/email)
    // - Regular users: login with phone or email (no login_id)
    // 
    // Backward compatibility: If login_id is provided, check if it's a phone/email pattern
    // and route accordingly, otherwise check login_id column
    
    if (login_id) {
      // Check if login_id looks like a phone number or email
      const isPhonePattern = /^\+380\d{9}$/.test(login_id);
      const isEmailPattern = login_id.includes('@');
      
      if (isPhonePattern) {
        // Treat as phone number (regular user)
        const result = await db.query('SELECT * FROM users WHERE phone = $1', [login_id]);
        user = result.rows[0];
        identifier = login_id;
      } else if (isEmailPattern) {
        // Treat as email (regular user)
        const result = await db.query('SELECT * FROM users WHERE email = $1', [login_id]);
        user = result.rows[0];
        identifier = login_id;
      } else {
        // Treat as login_id (superadmin)
        const result = await db.query('SELECT * FROM users WHERE login_id = $1', [login_id]);
        user = result.rows[0];
        identifier = login_id;
      }
    } else if (phone) {
      // Regular user login: use phone
      const result = await db.query('SELECT * FROM users WHERE phone = $1', [phone]);
      user = result.rows[0];
      identifier = phone;
    } else if (email) {
      // Regular user login: use email
      const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      user = result.rows[0];
      identifier = email;
    }

    if (!user) {
      // Log failed login attempt
      await logAuth.loginFailed(identifier || 'unknown', 'User not found', req);
      return res.status(401).json({ error: 'Невірні дані для входу або пароль' });
    }

    // Support both bcrypt and Argon2 password hashes
    // Detect hash type by format:
    // - bcrypt: starts with $2a$, $2b$, or $2y$
    // - Argon2: starts with $argon2id$ or $argon2i$ or $argon2d$
    let isValid = false;
    const hash = user.password_hash;
    
    if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
      // Bcrypt hash (legacy users)
      try {
        isValid = await bcrypt.compare(password, hash);
      } catch (err) {
        console.error('Bcrypt verification error:', err);
        isValid = false;
      }
    } else if (hash.startsWith('$argon2')) {
      // Argon2 hash (new registrations)
      if (!argon2) {
        console.error('Argon2 not available but hash requires it');
        isValid = false;
      } else {
        try {
          isValid = await argon2.verify(hash, password);
        } catch (err) {
          console.error('Argon2 verification error:', err);
          isValid = false;
        }
      }
    } else {
      // Unknown hash format - try both (fallback)
      console.warn('Unknown hash format, trying both methods');
      if (argon2) {
        try {
          isValid = await argon2.verify(hash, password);
        } catch (err) {
          // Argon2 failed, try bcrypt
          try {
            isValid = await bcrypt.compare(password, hash);
          } catch (bcryptErr) {
            isValid = false;
          }
        }
      } else {
        // Only bcrypt available
        try {
          isValid = await bcrypt.compare(password, hash);
        } catch (bcryptErr) {
          isValid = false;
        }
      }
    }
    
    if (!isValid) {
      // Log failed login attempt
      await logAuth.loginFailed(identifier || 'unknown', 'Invalid password', req);
      return res.status(401).json({ error: 'Невірні дані для входу або пароль' });
    }

    const token = generateToken(user);
    
    // Get apartment info if exists
    let apartment = null;
    if (user.apartment_id) {
        const aptResult = await db.query('SELECT number, area FROM apartments WHERE id = $1', [user.apartment_id]);
        apartment = aptResult.rows[0];
    }

    // Log successful login
    await logAuth.loginSuccess(user.id, req);

    res.json({
      token,
      user: {
        id: user.id,
        role: user.role,
        full_name: user.full_name,
        apartment
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/activate
router.post('/activate', activateValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Activation Validation Errors:', errors.array()); // <--- Added log
    return res.status(400).json({ errors: errors.array() });
  }

  const { invitation_code, password, full_name, phone } = req.body;

  try {
    // 1. Check invitation code
    const codeResult = await db.query(
      'SELECT * FROM invitation_codes WHERE code = $1 AND is_used = FALSE', 
      [invitation_code]
    );
    const invitation = codeResult.rows[0];

    if (!invitation) {
      console.log('Activation Failed: Invalid or used code:', invitation_code); // <--- Added log
      return res.status(400).json({ error: 'Код недійсний або вже використаний' });
    }

    // 2. Check if phone already exists
    const phoneResult = await db.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (phoneResult.rows.length > 0) {
        console.log('Activation Failed: Phone already exists:', phone); // <--- Added log
        return res.status(400).json({ error: 'Користувач з таким телефоном вже існує' });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Get apartment's osbb_id
    const aptResult = await db.query('SELECT osbb_id FROM apartments WHERE id = $1', [invitation.apartment_id]);
    const osbbId = aptResult.rows[0]?.osbb_id || null;

    // 5. Create user
    const userResult = await db.query(
      `INSERT INTO users (phone, password_hash, full_name, role, apartment_id, osbb_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, role, apartment_id, full_name, osbb_id`,
      [phone, hashedPassword, full_name, invitation.role, invitation.apartment_id, osbbId]
    );
    const newUser = userResult.rows[0];

    // 6. Mark code as used
    await db.query(
        'UPDATE invitation_codes SET is_used = TRUE, used_at = NOW() WHERE id = $1', 
        [invitation.id]
    );

    // 7. Generate token
    const token = generateToken(newUser);

     // Get apartment info
    const aptInfoResult = await db.query('SELECT number, area FROM apartments WHERE id = $1', [newUser.apartment_id]);
    const apartment = aptInfoResult.rows[0];

    // Log account activation
    await logAuth.activation(newUser.id, invitation_code, req);

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        role: newUser.role,
        full_name: newUser.full_name,
        apartment,
        osbb_id: newUser.osbb_id
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
