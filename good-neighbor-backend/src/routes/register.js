const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const argon2 = require('argon2');
const db = require('../db/connection');
const { body, validationResult } = require('express-validator');
const { verifyEDRPOU, verifyHeadIdentity } = require('../services/mockRegistry');

// Configure multer for PDF uploads
const uploadDir = path.join(__dirname, '../../uploads/protocols');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-edrpou-rnokpp.pdf
    const timestamp = Date.now();
    const edrpou = req.body.edrpou || 'unknown';
    const rnokpp = req.body.head_rnokpp || 'unknown';
    const filename = `${timestamp}-${edrpou}-${rnokpp}.pdf`;
    // Store relative path for database
    req.fileRelativePath = `protocols/${filename}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Step 1: Verify EDRPOU and get OSBB data
// POST /api/register/verify-edrpou
router.post('/verify-edrpou',
  [
    body('edrpou').matches(/^\d{8}$/).withMessage('EDRPOU must be exactly 8 digits')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { edrpou } = req.body;

    try {
      // Check if OSBB already registered
      const existingOsbb = await db.query(
        'SELECT id, status FROM osbb_organizations WHERE edrpou = $1',
        [edrpou]
      );

      if (existingOsbb.rows.length > 0) {
        const osbb = existingOsbb.rows[0];
        if (osbb.status === 'approved') {
          return res.status(400).json({ 
            error: 'Це ОСББ вже зареєстровано в системі' 
          });
        }
        if (osbb.status === 'pending') {
          return res.status(400).json({ 
            error: 'Заявка на реєстрацію цього ОСББ вже подана і очікує розгляду' 
          });
        }
      }

      // Call Mock EDR API
      const osbbData = verifyEDRPOU(edrpou);

      if (!osbbData) {
        return res.status(404).json({ 
          error: 'ОСББ з таким EDRPOU не знайдено в ЄДР' 
        });
      }

      // Store or update OSBB in database (status: pending)
      let osbbId;
      if (existingOsbb.rows.length > 0) {
        await db.query(
          `UPDATE osbb_organizations 
           SET full_name = $1, address_city = $2, address_street = $3, 
               address_building = $4, authorized_person = $5, status = 'pending'
           WHERE edrpou = $6
           RETURNING id`,
          [
            osbbData.full_name,
            osbbData.address.city,
            osbbData.address.street,
            osbbData.address.building,
            osbbData.authorized_person,
            edrpou
          ]
        );
        osbbId = existingOsbb.rows[0].id;
      } else {
        const result = await db.query(
          `INSERT INTO osbb_organizations 
           (edrpou, full_name, address_city, address_street, address_building, authorized_person, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'pending')
           RETURNING id`,
          [
            edrpou,
            osbbData.full_name,
            osbbData.address.city,
            osbbData.address.street,
            osbbData.address.building,
            osbbData.authorized_person
          ]
        );
        osbbId = result.rows[0].id;
      }

      res.json({
        osbb_id: osbbId,
        edrpou: osbbData.edrpou,
        full_name: osbbData.full_name,
        address: osbbData.address,
        authorized_person: osbbData.authorized_person,
        status: osbbData.status
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Step 2: Verify Head identity
// POST /api/register/verify-head
router.post('/verify-head',
  [
    body('edrpou').matches(/^\d{8}$/).withMessage('EDRPOU must be exactly 8 digits'),
    body('head_rnokpp').matches(/^\d{10}$/).withMessage('RNOKPP must be exactly 10 digits'),
    body('head_full_name').notEmpty().withMessage('Full name is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { edrpou, head_rnokpp, head_full_name } = req.body;

    try {
      // Verify OSBB exists in our database
      const osbbResult = await db.query(
        'SELECT id FROM osbb_organizations WHERE edrpou = $1',
        [edrpou]
      );

      if (osbbResult.rows.length === 0) {
        return res.status(400).json({ 
          error: 'Спочатку перевірте EDRPOU' 
        });
      }

      // Call Mock Registry to verify identity
      const verification = verifyHeadIdentity(edrpou, head_rnokpp, head_full_name);

      if (!verification.valid) {
        return res.status(400).json({ 
          error: verification.error || 'Не вдалося підтвердити особу Голови ОСББ' 
        });
      }

      res.json({
        verified: true,
        osbb_data: verification.osbbData,
        properties: verification.properties,
        total_voting_weight: verification.totalVotingWeight
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Step 3: Submit registration with PDF
// POST /api/register/submit
router.post('/submit',
  upload.single('protocol_pdf'),
  [
    body('edrpou').matches(/^\d{8}$/).withMessage('EDRPOU must be exactly 8 digits'),
    body('head_rnokpp').matches(/^\d{10}$/).withMessage('RNOKPP must be exactly 10 digits'),
    body('head_full_name').notEmpty().withMessage('Full name is required'),
    body('head_email').isEmail().withMessage('Valid email is required'),
    body('head_phone').matches(/^\+380\d{9}$/).withMessage('Phone must be in format +380XXXXXXXXX'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Protocol PDF is required' });
    }

    const { edrpou, head_rnokpp, head_full_name, head_email, head_phone, password } = req.body;

    console.log('Registration submit request:', {
      edrpou,
      head_rnokpp,
      head_full_name,
      head_email,
      head_phone,
      hasPassword: !!password,
      hasFile: !!req.file,
      filePath: req.file?.path
    });

    try {
      console.log('Step 1: Verifying OSBB exists...');
      // Verify OSBB exists
      const osbbResult = await db.query(
        'SELECT id FROM osbb_organizations WHERE edrpou = $1',
        [edrpou]
      );

      if (osbbResult.rows.length === 0) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'OSBB not found. Please verify EDRPOU first.' });
      }

      const osbbId = osbbResult.rows[0].id;
      console.log('OSBB found, ID:', osbbId);

      console.log('Step 2: Verifying head identity...');
      // Verify identity again (security check)
      const verification = verifyHeadIdentity(edrpou, head_rnokpp, head_full_name);
      if (!verification.valid) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: verification.error });
      }
      console.log('Head identity verified');

      console.log('Step 3: Checking for existing users...');
      // Check if email or phone already exists
      // First check if email column exists
      const emailColumnCheck = await db.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'email'
      `);
      const hasEmailColumn = emailColumnCheck.rows.length > 0;
      
      let existingUser;
      if (hasEmailColumn) {
        existingUser = await db.query(
          'SELECT id FROM users WHERE email = $1 OR phone = $2',
          [head_email, head_phone]
        );
      } else {
        // If no email column, only check phone
        existingUser = await db.query(
          'SELECT id FROM users WHERE phone = $1',
          [head_phone]
        );
      }

      if (existingUser.rows.length > 0) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Користувач з таким email або телефоном вже існує' });
      }
      console.log('No existing user found');

      console.log('Step 4: Checking for existing registration requests...');
      // Check if registration request already exists
      const existingRequest = await db.query(
        'SELECT id FROM osbb_registration_requests WHERE edrpou = $1 AND head_rnokpp = $2 AND status = $3',
        [edrpou, head_rnokpp, 'pending']
      );

      if (existingRequest.rows.length > 0) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Заявка на реєстрацію вже подана і очікує розгляду' });
      }
      console.log('No existing registration request found');

      console.log('Step 5: Hashing password...');
      // Hash password with Argon2
      const passwordHash = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 65536, // 64 MB
        timeCost: 3,
        parallelism: 4
      });
      console.log('Password hashed successfully');

      console.log('Step 6: Creating registration request...');
      const protocolPath = req.fileRelativePath || req.file.filename;
      console.log('Protocol path:', protocolPath);
      
      // Create registration request (store password hash for later account creation)
      const result = await db.query(
        `INSERT INTO osbb_registration_requests 
         (osbb_id, edrpou, head_rnokpp, head_full_name, head_email, head_phone, protocol_path, status, password_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)
         RETURNING id, created_at`,
        [
          osbbId,
          edrpou,
          head_rnokpp,
          head_full_name,
          head_email,
          head_phone,
          protocolPath,
          passwordHash
        ]
      );
      console.log('Registration request created, ID:', result.rows[0].id);

      res.status(201).json({
        message: 'Заявку на реєстрацію успішно подано. Очікуйте розгляду адміністратором.',
        request_id: result.rows[0].id,
        status: 'pending'
      });
    } catch (err) {
      // Clean up file on error
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (fileErr) {
          console.error('Error deleting file:', fileErr);
        }
      }
      
      console.error('=== REGISTRATION SUBMIT ERROR ===');
      console.error('Error message:', err.message);
      console.error('Error code:', err.code);
      console.error('Error detail:', err.detail);
      console.error('Error constraint:', err.constraint);
      console.error('Error table:', err.table);
      console.error('Error column:', err.column);
      console.error('Request body:', {
        edrpou,
        head_rnokpp,
        head_full_name,
        head_email,
        head_phone,
        hasPassword: !!password,
        hasFile: !!req.file,
        filePath: req.file?.path
      });
      console.error('Stack:', err.stack);
      console.error('================================');
      
      res.status(500).json({ 
        error: 'Server error while processing registration',
        ...(process.env.NODE_ENV === 'development' && {
          details: err.message,
          code: err.code
        })
      });
    }
  }
);

module.exports = router;

