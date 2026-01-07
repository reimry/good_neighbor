# OSBB Registration - PDF Protocol Guide

**Last Updated**: January 3, 2026  
**Status**: ✅ All issues fixed and tested

## What is the PDF Protocol?

The PDF file required for OSBB registration is a **"Protocol of Appointment"** - a document that proves the Head of OSBB was officially appointed by the co-owners. In a real system, this would be a scanned copy of the official meeting protocol.

**For testing purposes**, you can use any PDF file. The system only validates:
- File must be a PDF (`.pdf` extension)
- File size must be under 5MB
- File must have `application/pdf` MIME type

## How It Works

### 1. File Upload Process

When you submit the registration form (Step 3):

1. **Frontend**: The form includes a file input for PDF upload
2. **Backend**: Uses `multer` middleware to handle file uploads
3. **Storage**: Files are saved to `good-neighbor-backend/uploads/protocols/`
4. **Naming**: Files are renamed with format: `{timestamp}-{edrpou}-{rnokpp}.pdf`
5. **Database**: The relative path is stored in `osbb_registration_requests.protocol_path`

### 2. File Validation

The backend validates:
- ✅ File type must be `application/pdf`
- ✅ File size must be ≤ 5MB
- ✅ File must be present (required field)

### 3. File Storage

**Location**: `good-neighbor-backend/uploads/protocols/`

**Filename Format**: `{timestamp}-{edrpou}-{rnokpp}.pdf`

**Example**: `1704321234567-12345678-1234567890.pdf`

### 4. File Access

**For Admins/SuperAdmins:**
- Can download PDFs via: `GET /api/admin/registrations/:id/protocol`
- Can download PDFs via: `GET /api/internal/registrations/:id/protocol`
- Files are served safely (directory traversal prevention)

## Creating a Test PDF

### Option 1: Use the Sample PDF Script

```bash
cd good-neighbor-backend
node dev-scripts/create-test-pdf.js
```

This creates: `uploads/protocols/sample-protocol.pdf`

### Option 2: Create Your Own PDF

You can use any PDF file:

1. **Create a simple PDF**:
   - Use any PDF editor (Adobe, online tools, etc.)
   - Or convert a Word/Text document to PDF
   - Or use a PDF generator

2. **Content suggestions** (for testing):
   ```
   PROTOCOL OF APPOINTMENT
   Head of OSBB
   
   This is a test document for OSBB registration.
   Date: [Current Date]
   ```

3. **Save it** anywhere on your computer

### Option 3: Use an Existing PDF

Any PDF file will work - even a blank one or a document you already have.

## Testing the Registration Flow

### Step-by-Step:

1. **Prepare your PDF file**
   - Create or use an existing PDF
   - Make sure it's under 5MB

2. **Go to Registration Page**
   - Navigate to: `http://localhost:5173/register-osbb`

3. **Step 1: Verify EDRPOU**
   - Enter: `12345678` (test EDRPOU)
   - Click "Verify"

4. **Step 2: Verify Head Identity**
   - RNOKPP: `1234567890`
   - Full Name: `Петренко Іван Олександрович`
   - Click "Verify"

5. **Step 3: Submit Registration**
   - Fill in email, phone, password
   - **Click "Choose File" and select your PDF**
   - Click "Submit Registration"

6. **Check the Result**
   - You should see: "Заявку на реєстрацію успішно подано"
   - The PDF will be saved in `uploads/protocols/`

7. **Review as Admin**
   - Login as admin
   - Go to `/admin/registrations` or `/registrations` (super admin)
   - Click "Протокол" to download and view the PDF
   - Approve or reject the registration

## File Upload in Frontend

The registration form uses a standard HTML file input:

```html
<input 
  type="file" 
  accept=".pdf,application/pdf"
  name="protocol_pdf"
/>
```

**Important**: The form field name must be `protocol_pdf` to match the backend.

## Troubleshooting

### Error: "Protocol PDF is required"
- Make sure you selected a file before submitting
- Check that the file input is working

### Error: "Only PDF files are allowed"
- File must be a valid PDF
- Check file extension is `.pdf`
- Try opening the file in a PDF viewer to verify it's valid

### Error: "File too large"
- PDF must be under 5MB
- Compress the PDF or use a smaller file

### File not uploading
- Check browser console for errors
- Verify backend is running
- Check `uploads/protocols/` directory exists and is writable

### Can't download PDF later
- Check file exists in `uploads/protocols/`
- Verify `protocol_path` in database is correct
- Check file permissions

## Security Features

1. **File Type Validation**: Only PDFs accepted
2. **File Size Limit**: 5MB maximum
3. **Safe Storage**: Files stored outside web root
4. **Unique Filenames**: Prevents overwrites
5. **Directory Traversal Prevention**: Safe file serving
6. **File Cleanup**: Failed uploads are deleted

## Example PDF Content (For Reference)

A real protocol would contain:
- Meeting date and location
- List of attendees (co-owners)
- Agenda items
- Voting results
- Appointment decision
- Signatures of participants

For testing, any PDF content is acceptable.

---

**Quick Test**: Run `node dev-scripts/create-test-pdf.js` to create a sample PDF instantly!

