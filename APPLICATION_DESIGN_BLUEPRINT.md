# APPLICATION DESIGN BLUEPRINT
## Good Neighbor - OSBB Management Platform
**Document Version**: 1.0  
**Created**: January 20, 2026  
**Purpose**: Comprehensive UI/UX analysis for design AI system input (Stitch)

---

## 1. CORE IDENTITY & INTENT

### Application Purpose
**Good Neighbor** is a digital management platform for Ukrainian OSBBs (Homeowners' Associations / Condominiums). It digitizes and democratizes building governance by centralizing:
- **Democratic voting** (weighted by apartment area for legal decisions, simple majority for general matters)
- **Financial transparency** (balance tracking, service bills, payment history)
- **Community communication** (news feeds, announcements, administrative notices)
- **Administrative efficiency** (building management tools, resident registration, invitation code generation)

### Target Audience
**Primary**:
- OSBB Heads/Administrators (aged 40-65)
- Ukrainian apartment building owners/tenants (aged 25-70)
- Building maintenance staff (aged 30-60)

**Secondary**:
- Building companies seeking administrative tools
- Government stakeholders monitoring residential compliance

### Tonal Vibe & Brand Perception
**Current**: "Utilitarian Government Software" — functional, safe, but visually uninspired
**Desired Evolution**: 

> **"Trusted Digital Neighborhood Guardian"** — A platform that feels **civil, transparent, and empowering** rather than bureaucratic. The vibe should communicate:
> - **Trust**: Clear data presentation, no hidden complexity
> - **Inclusivity**: Works for all age groups, Ukrainian-first design
> - **Efficiency**: Get tasks done in 2-3 clicks, not 10
> - **Community-forward**: Emphasize collective benefit over individual friction

**Aesthetic Pillars**:
- **Approachable Formality**: Like a well-organized town hall, not a bank
- **Transparency First**: Data visualizations that reveal rather than obscure
- **Accessibility-Conscious**: Must work for users with limited digital literacy
- **Modern-Civic**: Similar to European public service redesigns (e.g., Estonian e-governance), not tech-startup flashy

---

## 2. INFORMATION ARCHITECTURE

### User Roles & Privilege Hierarchy
```
┌─────────────────────────────────────┐
│  SuperAdmin (Internal Panel Only)   │  ← Manages all OSBBs, platform operations
├─────────────────────────────────────┤
│  Admin (OSBB Head)                  │  ← Runs single OSBB operations
│  - Creates voting & news            │
│  - Generates invitation codes       │
│  - Manages resident list            │
│  - Reviews registrations            │
├─────────────────────────────────────┤
│  Owner/Tenant (Regular User)        │  ← Participates, views data
│  - Votes in elections               │
│  - Reads news & announcements       │
│  - Checks balance & bills           │
│  - Updates profile                  │
└─────────────────────────────────────┘
```

### Page Hierarchy & User Journey

#### **ONBOARDING FLOW** (Non-Authenticated)
```
LOGIN
  ├── Enter phone + password
  ├── 2-factor option (future)
  └── → DASHBOARD or LOGIN ERROR
  
ACTIVATE ACCOUNT
  ├── Step 1: Enter invitation code
  ├── Step 2: Enter personal data (name, phone, password)
  └── → DASHBOARD
  
REGISTER OSBB (Head Only)
  ├── Step 1: Verify EDRPOU (8-digit business registration)
  ├── Step 2: Verify head identity (RNOKPP + full name)
  ├── Step 3: Submit documentation + create admin account
  └── → ADMIN DASHBOARD
```

#### **PRIMARY USER JOURNEY** (Authenticated Resident)
```
DASHBOARD (Home)
  ├── Quick stats: Balance, apartment number
  ├── Latest news (3 items)
  ├── Navigation to key areas
  └── CTA: "View all news", "Vote now"
    ├→ NEWS LIST PAGE
    │   ├── Browse all news
    │   ├── Filter by importance
    │   └── Read full content
    │
    ├→ VOTINGS LIST PAGE
    │   ├── Active votings
    │   ├── Results & participation %
    │   ├── Cast vote (3-way: for/against/abstain)
    │   └── View historical results
    │
    └→ SERVICES PAGE
        ├── Monthly bills by service type
        ├── Month selector
        ├── Payment status indicators
        ├── Balance history graph
        └── Download receipt (future)

PROFILE PAGE
  ├── View personal data
  ├── Update phone number
  ├── Change password
  └── View apartment assignment
```

#### **ADMIN JOURNEY** (OSBB Head)
```
ADMIN DASHBOARD (Hub)
  ├── 6 action cards:
  │   ├── Create news
  │   ├── Create voting
  │   ├── Manage apartments
  │   ├── Review registrations
  │   └── View resident activity
  │
  └→ MANAGE APARTMENTS
      ├── List all apartments
      ├── Apartment status (active/invited/not_invited)
      ├── Generate invitation codes
      ├── Generate codes by role (owner/tenant)
      └── View code usage history
      
  └→ CREATE NEWS/VOTING
      ├── Title input
      ├── Rich text content (future: markdown)
      ├── Mark as "important" (urgent notice)
      ├── Set visibility + scheduling (future)
      └── Preview + publish
      
  └→ REVIEW REGISTRATIONS
      ├── List pending OSBB registrations
      ├── Check verification status
      ├── Approve/reject workflow
      └── Store PDF documentation
```

### Data Flow Map

```
┌──────────────────────────────────────────────────────────────┐
│ PostgreSQL Database (Single Source of Truth)                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐        │
│  │   Users     │  │ Apartments  │  │ OSBB Orgs    │        │
│  │ (id, phone, │  │ (number,    │  │ (edrpou,    │        │
│  │  password,  │  │  area,      │  │  full_name, │        │
│  │  role,      │  │  balance,   │  │  status)    │        │
│  │  apt_id)    │  │  osbb_id)   │  │             │        │
│  └─────────────┘  └─────────────┘  └──────────────┘        │
│         │                │                 │                │
│         └────────────────┼─────────────────┘                │
│                          │                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐        │
│  │    News     │  │   Votings    │  │ Votes       │        │
│  │ (title,     │  │  (title,     │  │ (user_id,   │        │
│  │  content,   │  │   type,      │  │  voting_id, │        │
│  │  important) │  │   status,    │  │  choice)    │        │
│  └─────────────┘  │   results)   │  └─────────────┘        │
│                   └──────────────┘                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                            ▲
                 (REST API / Axios Calls)
                            │
        ┌───────────────────┴──────────────────┐
        │                                      │
    ┌───────────┐                        ┌──────────┐
    │ Frontend  │                        │ Backend  │
    │ (React)   │◄──────────────────────►│ (Express)│
    └───────────┘   HTTP JSON Endpoints  └──────────┘
    Vite + Tailwind         ~12 routes        JWT Auth
    Client-side State       PostgreSQL
    (AuthContext)
```

### User Journey Diagram: First-Time Registration → Dashboard

```
Invite Link or "/activate"
        │
        ▼
    ACTIVATE PAGE
    [Enter Code] ──────────┐
                           ▼
                    Verify Code
                    (Backend check)
                           │
                    ┌──────┴──────┐
                    │ Valid?      │
                    ├─ Yes ──────▶ Show Form
                    │             [Name, Phone, Password]
                    ├─ No ───────▶ Error + Retry
                    │             (Max 3 attempts)
                    │
                    ▼
            Create User + JWT
            (AuthContext stores token)
                    │
                    ▼
            Redirect → DASHBOARD
            [Balance, News, Navigation]
```

---

## 3. COMPONENT DEEP DIVE

### 3.1 Global Components

#### **Logo Component**
- **Modes**: `fullname` (full "Good Neighbor" text), `acronym` (abbreviation)
- **Purpose**: Brand consistency, navigation landmark
- **Current Data Binding**: None (static asset)
- **Sizing**: Scales via CSS classes (h-10, h-12, h-24)
- **Placement**: Header on all pages; login page hero

#### **Navigation Header**
- **Type**: Sticky, responsive (mobile hamburger future)
- **Contains**:
  - Logo (left)
  - Nav links: News, Votings, Services (desktop only)
  - User info: Apartment number, profile link
  - Logout button
  - Admin panel link (if role == 'admin')
- **Data Binding**: 
  - `user.apartment.number` from AuthContext
  - `user.role` for conditional admin link
- **State**: Loading spinner on auth check

#### **PrivateRoute Component**
- **Purpose**: Wraps authenticated pages; redirects to login if no token
- **Data Binding**: AuthContext.user.token
- **Behavior**: 
  - Check localStorage for JWT on mount
  - Validate token freshness
  - Redirect to /login if expired/missing

#### **RoleGuard Component**
- **Purpose**: Additional permission check (admin-only routes)
- **Props**: `requiredRole="admin"`
- **Data Binding**: AuthContext.user.role
- **Behavior**: 
  - Redirects to dashboard if user lacks required role
  - Renders protected content if authorized

---

### 3.2 Dashboard & Home

#### **BalanceWidget**
```jsx
Props:
  - balance: number (can be negative for debt)
  - lastUpdate: ISO timestamp

Renders:
  ┌─────────────────────────────┐
  │ ВАШ БАЛАНС                  │
  │ -540.50 грн                 │
  │ [⚠️ Заборгованість]  [Updated: Jan 20]
  └─────────────────────────────┘

Styling Logic:
  - Green accent color if balance > 0 (paid)
  - Orange/warning color if balance < 0 (debt)
  - Badge background matches text color
  
State Management:
  - Passed from parent (DashboardPage)
  - No internal state
```

#### **NewsCard**
```jsx
Props:
  - news: { id, title, content, created_at, is_important }

Renders:
  ┌─────────────────────────────┐
  │ [ВАЖЛИВО]           Jan 20  │
  │ Building Water Shutoff      │
  │ Lorem ipsum dolor sit       │
  │ amet consectetur...         │
  └─────────────────────────────┘

Styling Logic:
  - Background: bg-orange-50 + border-orange-200 if is_important
  - Background: bg-white + border-gray-100 otherwise
  - Text: line-clamp-3 (truncate at 3 lines)
  - Hover effect: shadow depth increases
  
Data Binding:
  - formatted date: new Date(news.created_at).toLocaleDateString('uk-UA')
  - is_important flag determines badge visibility
```

#### **DashboardPage Layout**
```
┌────────────────────────────────────────────┐
│ STICKY HEADER                              │
│ [Logo] [Nav Links] [Apartment] [Logout]   │
├────────────────────────────────────────────┤
│ MAIN CONTENT (max-w-7xl)                   │
│                                            │
│  Welcome Section                           │
│  "Привіт, Імя! Ваша квартира: Кв. 42"    │
│                                            │
│  ┌──────────┬──────────┬──────────┐       │
│  │ Balance  │ Stat 2   │ Stat 3   │ Cards │
│  └──────────┴──────────┴──────────┘       │
│                                            │
│  Latest News Section                       │
│  ┌────────────────────────────────┐       │
│  │ NewsCard × 3                   │ Grid  │
│  └────────────────────────────────┘       │
│                                            │
│  Quick Links / CTAs                        │
│  [View All News] [Vote Now] [Services]    │
│                                            │
└────────────────────────────────────────────┘
```

---

### 3.3 Voting System

#### **VotingCard**
```jsx
Props:
  - voting: { 
      id, title, description, type, status, 
      created_at, user_vote, results 
    }
  - onVote: callback to refresh parent

Renders:
  ┌──────────────────────────────────────────┐
  │ [Активне]            2025-01-20         │
  │ Should we repair roof?                   │
  │ [⚖️ За площею]                          │
  │                                          │
  │ Proposed fix: Replace 30% of shingles... │
  │                                          │
  │ [ЗА]  [ПРОТИ]  [УТРИМАВСЯ]  (if active) │
  │                                          │
  │ ──────────────── or ────────────────     │
  │ [You voted: ЗА] (if already voted)       │
  │                                          │
  │ Results (if finished):                   │
  │ ЗА:        ███████ 65%                   │
  │ ПРОТИ:     ██ 25%                        │
  │ УТРИМАВСЯ: █ 10%                         │
  └──────────────────────────────────────────┘

State Management:
  - loading: boolean (during vote submission)
  - Calculates percentage based on:
    * type === 'legal' → weight by area (m²)
    * type === 'simple' → count votes 1:1
    
Vote Types:
  'for' (ЗА) → Green button (#228B22)
  'against' (ПРОТИ) → Red button (#DC143C)
  'abstain' (УТРИМАВСЯ) → Gray/neutral button

Data Binding:
  - voting.status determines if buttons shown or disabled
  - voting.user_vote shows user's choice after voting
  - voting.results.stats array: [{ choice: 'for', total_weight: 120.5 }]
  - total_possible (for legal) or total_weight (for simple)
```

#### **VotingsListPage**
```
Layout:
  ┌────────────────────────────────┐
  │ HEADER [← Back] [Logo] Голосування
  ├────────────────────────────────┤
  │ MAIN CONTENT (max-w-3xl)       │
  │                                │
  │ [Loading Spinner] or           │
  │ ┌──────────────────────────┐   │
  │ │ VotingCard × N           │   │
  │ │ (grid-cols-1)            │   │
  │ └──────────────────────────┘   │
  │                                │
  │ Empty State: (if no votings)   │
  │ "No active or completed votes" │
  └────────────────────────────────┘

Data Flow:
  - Fetch GET /votings (list)
  - For each voting, fetch GET /votings/:id (detail + user_vote + results)
  - Map VotingCard components
  - On vote: call fetchVotings() to refresh all
```

---

### 3.4 News System

#### **NewsListPage**
```
Layout:
  ┌────────────────────────────────┐
  │ HEADER [← Back] [Logo] Новини  │
  ├────────────────────────────────┤
  │ MAIN CONTENT (max-w-3xl)       │
  │                                │
  │ [Filter/Sort Options] (future) │
  │                                │
  │ ┌──────────────────────────┐   │
  │ │ NewsCard × N             │   │
  │ │ (grid-cols-1, space-y-4) │   │
  │ └──────────────────────────┘   │
  │                                │
  │ Empty State: (if no news)      │
  │ "No news yet"                  │
  └────────────────────────────────┘

Data Binding:
  - GET /news endpoint
  - Returns: [{ id, title, content, is_important, created_at }]
  - Sorted by: created_at DESC (newest first)
```

#### **CreateNewsPage**
```
Layout:
  ┌────────────────────────────────┐
  │ HEADER [← Back] [Logo] Створити новину
  ├────────────────────────────────┤
  │ FORM (max-w-3xl)               │
  │                                │
  │ [Error Alert] (if error)       │
  │                                │
  │ Title Input                    │
  │ [text field - 255 chars]       │
  │                                │
  │ Content Textarea               │
  │ [textarea - 10 rows, rich]     │
  │                                │
  │ ☑ Mark as Important?           │
  │ [checkbox]                     │
  │                                │
  │ [Submit Button] [Cancel]       │
  │                                │
  └────────────────────────────────┘

Data Binding:
  - formData: { title, content, is_important }
  - POST /news with formData
  - On success: navigate to /news
  - On error: display error message
```

---

### 3.5 Services & Billing

#### **ServicesPage**
```
Layout:
  ┌────────────────────────────────┐
  │ HEADER [← Back] Послуги        │
  ├────────────────────────────────┤
  │ MAIN CONTENT (max-w-4xl)       │
  │                                │
  │ ┌──────────────────────────┐   │
  │ │ BalanceWidget            │   │
  │ │ (Shows balance + update)  │   │
  │ └──────────────────────────┘   │
  │                                │
  │ Month Selector (tabs)          │
  │ [Jan 2025] [Dec 2024] [...]    │
  │                                │
  │ Services Table (selectedMonth)  │
  │ ┌────────────────────────────┐ │
  │ │ Service Type │ Amount │ Status
  │ ├────────────────────────────┤ │
  │ │ Water        │ 240.50 │ Paid  │
  │ │ Electricity  │ 150.00 │ Debt  │
  │ │ Heating      │ 500.00 │ Paid  │
  │ └────────────────────────────┘ │
  │                                │
  │ [Download Receipt] (future)    │
  └────────────────────────────────┘

Data Binding:
  - GET /services
  - Returns: { balance, months: [{ month: ISO, services: [...] }] }
  - Services: [{ type, amount, status, date }]
  - Types: 'rent', 'water', 'electricity', 'heating', 'maintenance', 'garbage'
  - Default month: most recent in array
```

---

### 3.6 Admin Panel

#### **AdminDashboard**
```
Layout:
  ┌────────────────────────────────┐
  │ HEADER [Logo] [Admin Badge]    │
  ├────────────────────────────────┤
  │ MAIN CONTENT (max-w-7xl)       │
  │                                │
  │ Admin Action Cards Grid        │
  │ (grid-cols-3 / 2 on tablet)    │
  │                                │
  │ ┌──────────────────────────┐   │
  │ │ [📢] Create News         │   │
  │ │ "Publish announcements"  │   │
  │ │ [Link Button]            │   │
  │ └──────────────────────────┘   │
  │                                │
  │ ┌──────────────────────────┐   │
  │ │ [🗳️] Create Voting        │   │
  │ │ "Start new vote"         │   │
  │ └──────────────────────────┘   │
  │                                │
  │ ┌──────────────────────────┐   │
  │ │ [🏠] Manage Apartments   │   │
  │ │ "Gen codes, assign"      │   │
  │ └──────────────────────────┘   │
  │                                │
  │ [Similar cards for other ops]  │
  └────────────────────────────────┘

Card Props:
  - title: string
  - description: string
  - icon: emoji
  - link: route
  - color: bg-{color}-500
```

#### **AdminApartmentsPage**
```
Layout:
  ┌────────────────────────────────┐
  │ HEADER [← Back] Manage Apts    │
  ├────────────────────────────────┤
  │ TABLE VIEW (max-w-7xl)         │
  │                                │
  │ ┌────────────────────────────┐ │
  │ │ Apt │ Area │ Status │ Codes
  │ ├────────────────────────────┤ │
  │ │ 42  │65.5 │ Active │ [+Gen]│
  │ │ 15A │ 48  │Invited │ CODE  │
  │ │ 7B  │ 52  │Not Inv │ [+Gen]│
  │ └────────────────────────────┘ │
  │                                │
  │ [Modal: Generate Code]         │
  │ ┌────────────────────────────┐ │
  │ │ Role: [Owner / Tenant]     │ │
  │ │ New Code: ABCD1234         │ │
  │ │ [Copy to Clipboard]        │ │
  │ └────────────────────────────┘ │
  └────────────────────────────────┘

Data Binding:
  - GET /admin/apartments
  - Returns: { apartments: [{ id, number, area, status, invitation_codes }] }
  - invitation_codes: [{ code, role, is_used, used_at }]
  - POST /admin/invitations/generate { apartment_id, role }
  - Returns: { code, apartment_id, role }
```

---

### 3.7 Authentication

#### **LoginPage**
```
Layout:
  ┌────────────────────────────────┐
  │ CENTERED FORM (max-w-md)       │
  │                                │
  │ [Logo - Full Brand]            │
  │                                │
  │ "Вхід в систему"               │
  │ "Resident Portal"              │
  │                                │
  │ [Error Alert] (if failed)      │
  │                                │
  │ Phone Input                    │
  │ [text field] "+380..."         │
  │                                │
  │ Password Input                 │
  │ [password field]               │
  │                                │
  │ [Sign In Button]               │
  │                                │
  │ Link: "Activate with code"     │
  │ Link: "Register as Head"       │
  │                                │
  └────────────────────────────────┘

Data Binding:
  - AuthContext.login(phone, password)
  - POST /auth/login { phone, password }
  - On success: store JWT, set AuthContext, navigate to /dashboard
  - On error: display error message, allow retry
```

#### **ActivatePage**
```
Layout:
  Similar to LoginPage
  
  │ "Activate Account"             │
  │                                │
  │ Invitation Code Input          │
  │ [text field] "ABCD1234"        │
  │                                │
  │ Full Name Input                │
  │ [text field] "Іван Петренко"   │
  │                                │
  │ Phone Input                    │
  │ [text field] "+380"            │
  │                                │
  │ Password Input                 │
  │ [password field]               │
  │                                │
  │ [Activate Button]              │

Data Binding:
  - AuthContext.activate(code, fullName, phone, password)
  - POST /auth/activate { code, full_name, phone, password }
  - Backend: validates code, creates user, marks code as used
```

#### **RegisterOSBBPage**
```
Multi-Step Form (3 Steps):

Step 1: EDRPOU Verification
  ┌────────────────────────────────┐
  │ Step 1 of 3                    │
  │                                │
  │ EDRPOU Code (8-digit)          │
  │ [text input] "12345678"        │
  │                                │
  │ [Verify Button]                │
  │                                │
  │ Shows: OSBB name, address      │
  └────────────────────────────────┘

Step 2: Head Identity Verification
  │ Step 2 of 3                    │
  │                                │
  │ RNOKPP (10-digit)              │
  │ [text input] "1234567890"      │
  │                                │
  │ Full Name                      │
  │ [text input] "Петренко Іван"   │
  │                                │
  │ [Verify Button]                │
  │                                │
  │ Shows: Head info from registry  │

Step 3: Final Registration
  │ Step 3 of 3                    │
  │                                │
  │ Email                          │
  │ [email input]                  │
  │                                │
  │ Phone                          │
  │ [tel input]                    │
  │                                │
  │ Password                       │
  │ [password input]               │
  │                                │
  │ Confirm Password               │
  │ [password input]               │
  │                                │
  │ PDF Upload (Charter/Proof)     │
  │ [file upload]                  │
  │                                │
  │ [Submit Registration]          │
  │                                │
  │ ✅ Success message (admin wait) │
  └────────────────────────────────┘

Data Flow:
  1. POST /register/verify-edrpou { edrpou }
     → Mock EDR API verification
  2. POST /register/verify-head { edrpou, head_rnokpp, head_full_name }
     → Mock registry verification
  3. POST /register/submit { email, phone, password, pdf_file }
     → Create OSBB record, store PDF, send admin notification
```

---

### 3.8 Profile

#### **ProfilePage**
```
Layout:
  ┌────────────────────────────────┐
  │ HEADER [← Back] Profile        │
  ├────────────────────────────────┤
  │ MAIN CONTENT (max-w-3xl)       │
  │                                │
  │ Profile Info Card              │
  │ ┌──────────────────────────┐   │
  │ │ Name: Іван Петренко      │   │
  │ │ Apartment: Кв. 42        │   │
  │ │ Building: Good Neighbor  │   │
  │ └──────────────────────────┘   │
  │                                │
  │ Tabs: [Phone] [Password]       │
  │                                │
  │ TAB 1: Update Phone            │
  │ ┌──────────────────────────┐   │
  │ │ Current Phone            │   │
  │ │ [input] "+380..."        │   │
  │ │ [Save Button]            │   │
  │ └──────────────────────────┘   │
  │                                │
  │ TAB 2: Change Password         │
  │ ┌──────────────────────────┐   │
  │ │ Current Password         │   │
  │ │ [password field]         │   │
  │ │                          │   │
  │ │ New Password             │   │
  │ │ [password field]         │   │
  │ │                          │   │
  │ │ Confirm New Password     │   │
  │ │ [password field]         │   │
  │ │ [Update Password]        │   │
  │ └──────────────────────────┘   │
  │                                │
  │ [Success/Error Messages]       │
  └────────────────────────────────┘

Data Binding:
  - GET /profile
  - Returns: { phone, full_name, apartment, osbb }
  - PATCH /profile/phone { phone }
  - PATCH /profile/password { current_password, new_password }
```

---

## 4. INTERACTION PATTERNS

### 4.1 State Management

#### **Loading States**
```jsx
// Spinner Pattern (used on all list pages)
{loading ? (
  <div className="flex justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
  </div>
) : (
  // Content
)}
```
- **Duration**: Appears while fetching data (typically 500ms-2s)
- **Visual**: Rotating circle, primary color (#1B5E37)
- **Position**: Centered on page

#### **Success States**
```jsx
// Alert Banner Pattern
{success && (
  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
    {success}
  </div>
)}
```
- **Duration**: 3-5 seconds auto-dismiss (or manual)
- **Visual**: Green background, border, text
- **Position**: Top of form

#### **Error States**
```jsx
// Alert Banner Pattern
{error && (
  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
    {error}
  </div>
)}
```
- **Variants**:
  - Form-level: Above form fields
  - Page-level: Above content
  - Modal-level: Inside modal
- **Visual**: Red background, border, text
- **Auto-dismiss**: No (requires user action to clear)

#### **Empty States**
```jsx
// Dashed Border + Message Pattern
{items.length === 0 ? (
  <div className="bg-white rounded-lg p-12 text-center border-dashed border-2 border-gray-200">
    <p className="text-gray-500">No items found</p>
  </div>
) : (
  // Content
)}
```
- **Used on**: News list, votings list, apartments list
- **Visual**: Dashed border box, centered message
- **CTA**: Optional "Create new" link below message

---

### 4.2 Complex Interactions

#### **Vote Submission Flow**
```
User Action: Click [ЗА] button
       │
       ▼
Button disabled, loading state begins
       │
       ▼
POST /votings/:id/vote { choice: 'for' }
       │
       ├─ SUCCESS ───────▶ Mark user as voted
       │                  Show: "You voted: ЗА"
       │                  Disable voting buttons
       │                  Call onVote() callback
       │                  Refresh parent list
       │
       └─ ERROR ─────────▶ Show error alert
                          Button re-enabled
                          Allow retry
```

#### **Multi-Step Form Navigation**
```
User on Step 1
  │
  ├─ Click [Next/Verify]
  │  │
  │  ├─ Validation passes
  │  │  │
  │  │  └─▶ setStep(2)
  │  │     API call if needed
  │  │     Store data in state
  │  │
  │  └─ Validation fails
  │     │
  │     └─▶ Show error message
  │        Remain on Step 1
  │
  ├─ Click [Back]
  │  │
  │  └─▶ setStep(step - 1)
  │     Retain form data
  │
  └─ (Step 3) Click [Submit]
     │
     ├─ All validations pass
     │  │
     │  └─▶ POST /register/submit
     │     │
     │     ├─ SUCCESS ──▶ Show success msg
     │     │             Redirect to /login
     │     │
     │     └─ ERROR ───▶ Show error
     │                  Stay on form
     │
     └─ Validation fails
        │
        └─▶ Show field-level errors
           Highlight invalid fields
           Remain on Step 3
```

#### **Real-Time Voting Results**
```
VotingCard mounts:
  │
  ├─ If status === 'active'
  │  ├─ Show action buttons [ЗА] [ПРОТИ] [УТРИМАВСЯ]
  │  └─ Disable if user already voted
  │
  └─ If status === 'finished'
     │
     └─ Calculate + render results
        ├─ For each choice: percentage = (weight / total) * 100
        ├─ Render progress bar
        └─ Show labels + %

  User votes (POST /votings/:id/vote)
    │
    ├─ Backend updates database
    │  ├─ INSERT vote
    │  └─ Recalculate results
    │
    └─ Parent (VotingsListPage) calls fetchVotings()
       ├─ Refreshes all votings
       └─ Each card re-renders with updated results
```

#### **Invitation Code Generation**
```
Admin clicks [Generate Code] button on apartment
       │
       ▼
Modal appears: [Owner / Tenant role selector]
       │
       ▼
Admin selects role + clicks [Generate]
       │
       ▼
POST /admin/invitations/generate { apartment_id, role }
       │
       ├─ SUCCESS
       │  │
       │  ├─ Show new code: "ABCD1234"
       │  ├─ Button: [Copy to Clipboard]
       │  ├─ Trigger visual feedback: "Copied!"
       │  └─ Refresh apartment list
       │     (mark apartment as "invited")
       │
       └─ ERROR (apartment doesn't belong to admin's OSBB)
          │
          └─ Show error: "Unauthorized"
             Prevent malicious apartment access
```

#### **Responsive Behavior**
```
Desktop (>1024px):
  ├─ Multi-column grids
  ├─ All navigation visible
  └─ Full breadcrumbs

Tablet (768px-1024px):
  ├─ 2-column grids
  ├─ Condensed navigation
  └─ Simplified breadcrumbs

Mobile (<768px):
  ├─ Single-column layout
  ├─ Hamburger menu (future)
  ├─ Larger touch targets (min 44px)
  └─ Stacked forms
```

---

## 5. DESIGN CONSTRAINTS

### 5.1 Technical Constraints

#### **Responsive Design**
- **Breakpoints**: Mobile-first approach using Tailwind
  - sm: 640px
  - md: 768px
  - lg: 1024px
  - xl: 1280px
- **Mobile Requirements**: 
  - Min 44px touch targets
  - Single-column layout
  - Horizontal scroll for large tables (future)

#### **Browser Support**
- **Modern browsers only**: Chrome, Firefox, Safari, Edge (2022+)
- **No IE11 support** (uses ES6+ features)

#### **Performance Constraints**
- **Page load**: < 3 seconds (target)
- **API response time**: < 500ms (backend SLA)
- **Bundle size**: ~150KB gzipped (frontend)
- **Token-based auth**: JWT with 24-hour expiration

#### **Data Visualization**
- **Voting results**: Simple horizontal progress bars (no heavy charts)
- **Balance graph**: (Future) Lightweight line chart
- **No D3/complex charting**: Use lightweight libraries only

#### **Accessibility Standards** (Built-in via Tailwind)
- **Color contrast**: WCAG AA minimum
- **Focus states**: Visible keyboard navigation
- **ARIA labels**: Not extensively implemented yet (opportunity)
- **Ukrainian language**: All UI text + error messages

#### **Security Constraints**
- **Tenant isolation**: OSBB_ID filtering on all queries
- **Admin privilege validation**: Verify apartment belongs to admin's OSBB
- **Password rules**: Min 6 characters (future: stronger requirements)
- **No sensitive data in localStorage**: Only JWT token stored
- **HTTPS only**: All API calls (in production)

---

### 5.2 Organizational Constraints

#### **Multi-Tenant Architecture**
- Each OSBB operates independently
- Admin can only see their OSBB's apartments + residents
- Voting/news scoped to OSBB_ID
- Registration process validates OSBB membership

#### **Legal/Compliance**
- EDRPOU verification (Ukrainian business registry)
- RNOKPP verification (Ukrainian personal ID registry)
- PDF storage for OSBB registration documents
- Audit logging for sensitive actions (implemented in backend)

#### **Business Rules**
- **Voting types**:
  - `simple`: 1 vote per person
  - `legal`: weight by apartment area (m²)
- **User roles**: admin, owner, tenant (future: super-admin internal panel)
- **Invitation system**: One code per apartment per role

---

## 6. AESTHETIC GAP ANALYSIS

### 6.1 Current State Assessment

#### **Color Palette (Tailwind-based)**
```
PRIMARY: #1B5E37 (Dark Forest Green)
  - Used for: Primary buttons, active states, headers
  - Associations: Nature, trust, growth
  - Problem: Too dark/serious for approachable vibe

ACCENT: #8DC63F (Vibrant Lime)
  - Used for: Balance widget (paid), highlights, CTAs
  - Associations: Energy, positivity
  - Problem: Undersaturated, feels outdated

NEUTRAL: #2D3436 (Dark Charcoal)
  - Used for: Text, borders, backgrounds
  - Associations: Professional, stable
  - Problem: Very dark, limited mid-tone usage

WARNING: #E67E22 (Bright Orange)
  - Used for: Alerts, debt warnings, "important" badges
  - Associations: Caution, attention
  - Problem: Saturated, sometimes harsh

ADDITIONAL: Red (#DC143C for debt), Gray scale
```

#### **Typography**
```
Font Stack:
  - Body: Inter (sans-serif) – Clean, neutral
  - Headings: Montserrat (sans-serif) – Modern, bold
  
Sizing:
  - Base: 16px
  - Small: 12-14px (utility, labels)
  - Medium: 16-18px (body, form text)
  - Large: 24-32px (headings)
  - Extra-large: 48px+ (hero titles)
  
Problem: Hierarchy not bold enough; headings compete with body
```

#### **Spacing & Layout**
```
Padding: 4px → 32px (Tailwind scale: p-1 to p-8)
Max-width: 1280px (xl breakpoint)
Grid: Default 12-column, reduced on mobile

Problem: Consistent but uninspired; feels "safe" rather than considered
```

#### **Components**
```
Buttons: Rounded corners (md: 6px), minimal shadow
Cards: Subtle shadow (shadow-sm), thin borders
Forms: Standard input styling, basic validation feedback
Headers: Sticky, clean, understated

Problem: Everything is "correct" but lacks distinction; 
         hard to differentiate from a standard Bootstrap site
```

### 6.2 Aesthetic Gap: "Vibe Coding" vs. Premium Standard

#### **Current Vibe: "Functional Bureaucracy"**
- ✅ Trustworthy, safe, compliant
- ❌ Uninspired, dated, indistinguishable
- ❌ Low emotional engagement
- ❌ Feels like "government software," not citizen-empowering

#### **Desired Vibe: "Trusted Digital Guardian"**
- ✅ Modern, approachable, European-civic
- ✅ Transparent by design, not hidden complexity
- ✅ Empowering, community-forward
- ✅ Professional without being corporate

---

### 6.3 Design Recommendations: Breaking Convention

#### **1. COLOR SYSTEM OVERHAUL**

**Current Problem**: Palette feels stock/predefined.

**Recommended Approach**:
```
NEW PRIMARY SCHEME:
├─ Hero/Primary: Modern teal (#0D7377) or deep sage (#2D6A4F)
│  Problem: Green is overused; consider sophisticated blue-green
│  
├─ Accent (Energy): Coral orange (#FF6B6B) or golden (#FFB627)
│  Problem: Lime is weak; modern apps use warm/bold accents
│  
├─ Neutrals: 
│  - Text: #1A1A1A (near-black, warmer than #2D3436)
│  - Background: #FAFAF8 (warm white, not sterile)
│  - Borders: #E8E6E1 (warm gray)
│  
├─ Semantic:
│  - Success: #52C41A (modern green, not the warn orange)
│  - Warning: #FA8C16 (warm orange, more inviting)
│  - Error: #F5222D (vibrant red, clear intent)
│  - Info: #1890FF (tech blue, approachable)
│  
└─ Gradients (opportunities):
   - Hero backgrounds: Subtle gradient (teal → sage)
   - Accent spots: Gradient overlays on cards
   - Not overdone; 2-3 strategic placements max
```

#### **2. TYPOGRAPHY HIERARCHY STRENGTHENING**

**Current Problem**: Montserrat headings not visually distinct enough from Inter body.

**Recommended Approach**:
```
H1 (Hero/Page Title):
  - Size: 48-56px (↑ from 32px)
  - Weight: 700 bold
  - Letter-spacing: -1px (tighter for gravitas)
  - Color: Primary (teal/sage)
  
H2 (Section Title):
  - Size: 28-32px
  - Weight: 600 semibold
  - Letter-spacing: -0.5px
  - Color: Primary
  
H3 (Card/Widget Title):
  - Size: 18-20px
  - Weight: 600 semibold
  - Color: Primary or near-black
  
Body:
  - Size: 16px
  - Line-height: 1.6 (↑ from 1.5)
  - Weight: 400 normal
  - Color: #1A1A1A
  
Labels/Caption:
  - Size: 12-13px
  - Weight: 500 medium
  - Letter-spacing: 0.5px (slight spacing for officialness)
  - Color: #666 (medium gray)
```

#### **3. SPATIAL DESIGN: NON-STANDARD GRIDS**

**Current Problem**: Standard grid feels predictable; every card same size/spacing.

**Recommended Approach**:
```
ASYMMETRIC CARD LAYOUTS:
  ├─ Hero card: 100% width, tall (2x normal height)
  │  └─ Use for: Balance widget, welcome banner
  │
  ├─ Featured news: Larger, 1-2 column span
  │  └─ Highlight recent important news
  │
  ├─ Standard cards: 1 column
  │  └─ Votings, news items
  │
  └─ Nested grids: Cards contain internal grids
     └─ E.g., voting results with stacked bars

BREATHING ROOM:
  ├─ Increase outer padding: 12px → 20px (mobile)
  ├─ Increase gap between cards: 16px → 24px
  └─ Result: Less crowded, more premium feel

NON-STANDARD SECTION SPACING:
  ├─ Above fold: 40px section gap
  ├─ Below fold: 32px section gap
  ├─ Micro interactions: 8-12px gaps
  └─ Reason: Creates rhythm, not monotony
```

#### **4. COMPONENT ELEVATION: GLASSMORPHISM & DEPTH**

**Current Problem**: Cards feel flat; shadows are too subtle (shadow-sm).

**Recommended Approach**:
```
LAYERING STRATEGY:
  ├─ Background: Warm white (#FAFAF8) or very light sage tint
  ├─ Cards (elevated):
  │  └─ Shadow: 0 4px 12px rgba(0,0,0,0.08) (↑ from shadow-sm)
  │     Border: 1px solid rgba(0,0,0,0.05) (subtle, warm)
  │     Backdrop-filter: (Optional) slight blur for hero sections
  │
  ├─ Interactive (hover):
  │  └─ Shadow: 0 8px 20px rgba(0,0,0,0.12) (↑ on hover)
  │     Transform: translateY(-2px) (lift effect)
  │
  ├─ GLASSMORPHIC ACCENTS (use sparingly):
  │  └─ Hero banner: Semi-transparent overlay + blur
  │     Voting results: Glass-effect card for final tally
  │     Not every element; 1-2 strategic placements
  │
  └─ Dark mode readiness (future):
      └─ Neutrals designed for both light + dark seamlessly
```

#### **5. MICRO-INTERACTIONS & MOTION**

**Current Problem**: No animations beyond loading spinner.

**Recommended Approach**:
```
BUTTON INTERACTIONS:
  ├─ Hover: Color shift + shadow lift + 150ms ease-out
  │  └─ "ЗА" button: Darken green slightly, lift 2px
  │
  ├─ Active (pressed): Scale 0.98, darker color (100ms)
  │  └─ Tactile feedback without over-animation
  │
  └─ Focus: Ring + outline, 200ms fade-in

CARD INTERACTIONS:
  ├─ Hover: Shadow + border color shift (200ms)
  │  └─ On NewsCard: Glow-subtle effect
  │
  ├─ Click: Brief scale feedback (0.98 → 1) or underline
  │  └─ Indicates interactivity

FORM INTERACTIONS:
  ├─ Input focus: Border color + glow ring (200ms ease-out)
  ├─ Input error: Shake animation (300ms) + red highlight
  ├─ Success: Green checkmark + fade-in (300ms)
  └─ Validation feedback: Smooth transitions, not jarring

PAGE TRANSITIONS:
  ├─ Fade-in: 200ms (page load)
  ├─ Loading skeleton: (Optional) Skeleton screens instead of spinners
  │  └─ More premium than blank spinners
  └─ Scroll behavior: Smooth scroll (not jerky)

CONSTRAINTS:
  └─ Keep animations <300ms, ease-out curves
     Reason: Feels responsive, not sluggish or overdone
```

#### **6. NEO-BRUTALISM ACCENTS (Selective)**

**Current Problem**: Everything is "smooth"; no personality or boldness.

**Recommended Approach**:
```
SELECTIVE BOLDNESS:
  ├─ Admin panel header:
  │  └─ Thick border (2-3px) + bold badge
  │     Creates "officialness" without classiness
  │
  ├─ Error/Alert states:
  │  └─ Bold borders + thick frames
  │     "Error: You cannot vote twice" (prominent, not hidden)
  │
  ├─ Important badges:
  │  └─ All-caps sans-serif + negative space
  │     [ВАЖЛИВО] or ⚠️ [DEBT] with breathing room
  │
  ├─ Section dividers:
  │  └─ Instead of thin <hr>, use thick visual dividers
  │     Could be a colored block or bold line
  │
  └─ Form labels:
     └─ All-caps, 500 weight, letter-spacing 0.5px
        Creates official/legal tone (appropriate for OSBB)
```

#### **7. VOTING RESULTS: DATA VISUALIZATION UPGRADE**

**Current Problem**: Simple progress bars are functional but cold.

**Recommended Approach**:
```
OPTION A: Humanized Bars
  ├─ Label: "ЗА 65%" → "ЗА 65% (850 кв.м)"
  │  └─ Show actual unit of measurement (for legal votings)
  │
  ├─ Bar styling:
  │  ├─ Rounded end-caps (instead of sharp edges)
  │  ├─ Gradient within bar (not solid color)
  │  │  └─ E.g., green gradient (light → darker)
  │  ├─ Subtle pattern/texture overlay (optional)
  │  │  └─ Suggests legitimacy/officialness
  │  └─ Number floating inside bar (if space)
  │
  └─ Comparison mode (finished votings):
     └─ Show side-by-side bars with labels below
        Visually clearer than stacked bars

OPTION B: Donut Chart (Minimalist)
  ├─ Use for finished votings (shows proportions)
  ├─ Donut (not pie) to reduce "playful" vibe
  ├─ Labels outside ring
  └─ Limit to <500 lines SVG for performance

OPTION C: Hybrid Approach (Recommended)
  ├─ Active votings: Simple bars (action-focused)
  ├─ Finished votings: Donut + bars (results-focused)
  └─ Both with improved styling per OPTION A
```

#### **8. FORM & INPUT REFINEMENT**

**Current Problem**: Generic HTML input styling; no character.

**Recommended Approach**:
```
INPUT STYLING:
  ├─ Border: 1.5px (↑ from 1px) of warm gray
  ├─ Border-radius: 6px (slightly more rounded)
  ├─ Padding: 12px 16px (more breathing room)
  ├─ Font: 16px Inter (slightly larger for accessibility)
  │
  ├─ Focus state:
  │  ├─ Border: 2px primary color (teal)
  │  ├─ Box-shadow: 0 0 0 3px rgba(primary, 0.1)
  │  │  └─ Soft glow instead of sharp ring
  │  └─ Background: subtle tint (optional)
  │
  ├─ Placeholder text:
  │  ├─ Color: #A0A0A0 (lighter gray)
  │  ├─ Font-style: normal (not italic)
  │  └─ Smaller font: 14px
  │
  └─ Error state:
     ├─ Border: 1.5px error-red
     ├─ Error message below: 12px, error-red, bold
     ├─ Optional: Icon + text (⚠️ Field required)
     └─ Shake animation on submit if invalid

TEXTAREA STYLING:
  ├─ Same as input but with resize: vertical
  ├─ Min-height: 140px (encourages detail)
  ├─ Line-height: 1.6 (readable)
  └─ Optional: Character counter at bottom-right

SELECT/DROPDOWN (Future):
  ├─ Custom styling (not browser default)
  ├─ Color + icon indicating "selection ready"
  └─ Smooth open/close animation
```

#### **9. DARK MODE READINESS (Future-Proofing)**

**Current Problem**: No dark mode; limiting for modern apps.

**Recommended Approach**:
```
CSS Variables Strategy:
  ├─ Define color tokens: --color-primary, --color-text, etc.
  ├─ Light theme: var(--color-background): #FAFAF8
  ├─ Dark theme: var(--color-background): #1A1A1A
  │
  └─ Neutral palette:
     ├─ Light: #FAFAF8, #F0F0EE, #E0E0DC, #CCC, #999, #333
     └─ Dark: #1A1A1A, #2A2A28, #3A3A38, #666, #AAA, #EEE
        (Inverted but preserved tone)

Implementation (Tailwind):
  └─ Use dark: prefix on components
     @media (prefers-color-scheme: dark) { }
     
Result: App is "dark mode ready" without full implementation
```

---

### 6.4 Design System Recommendations Summary

| Element | Current | Upgraded | Benefit |
|---------|---------|----------|---------|
| Color Palette | Stock Tailwind | Custom curated | Differentiated brand |
| Typography | Standard sizing | Bolder hierarchy | Clear information flow |
| Spacing | Regular grid | Asymmetric breathing | Premium/intentional feel |
| Shadows | Subtle (sm) | Elevated (md-lg) | Depth & layering |
| Animations | None | Micro-interactions | Responsiveness feedback |
| Forms | Generic | Refined + refined borders | Professional + accessible |
| Buttons | Rounded minimal | Rounded + elevation + motion | Modern + interactive |
| Cards | Flat + thin border | Elevated + warm border | Hierarchy & depth |
| Dark Mode | N/A | CSS variables ready | Future-proof |
| Accessibility | Basic | ARIA labels + focus | WCAG AA+ compliance |

---

## 7. INFORMATION ARCHITECTURE: DATA TRANSFORMATIONS

### User Flow Through Data Layers

```
Frontend (React)
  │
  ├─ AuthContext (stores token + user info)
  ├─ Component state (loading, data, errors)
  └─ Axios API client (with interceptors)
        │
        ▼
Backend (Express)
  │
  ├─ JWT middleware (authenticate, requireRole)
  ├─ Request validation (express-validator)
  ├─ Business logic (voting calculations, billing engine)
  └─ Database queries (PostgreSQL)
        │
        ▼
Database (PostgreSQL)
  │
  ├─ Direct queries
  ├─ Transactions (for voting + audit logs)
  └─ Foreign key enforcement (apartment → OSBB)
        │
        ▼
Response JSON (normalized)
  │
  └─ Frontend renders components
```

### Data Structures at Each Layer

#### **Frontend State: DashboardPage**
```jsx
{
  user: { id, role, apartment_id, full_name, token },
  data: {
    apartment: { number, area, balance },
    latest_news: [{ id, title, content, is_important, created_at }]
  },
  loading: boolean,
  error: string | null
}
```

#### **Backend Response: GET /dashboard**
```json
{
  "apartment": {
    "id": 42,
    "number": "42",
    "area": "65.50",
    "balance": "-540.50"
  },
  "latest_news": [
    {
      "id": 1,
      "title": "Water shutoff on Jan 25",
      "content": "...",
      "is_important": true,
      "created_at": "2025-01-20T10:30:00Z"
    }
  ]
}
```

#### **Voting Results Calculation (Backend)**
```javascript
// For Legal Voting (weighted by area):
const legalResults = votingChoices.map(choice => ({
  choice,
  total_weight: votes
    .filter(v => v.choice === choice)
    .reduce((sum, v) => sum + apartment.area, 0)
}));

const total = legalResults.reduce((sum, r) => sum + r.total_weight, 0);

// Transform to percentage:
results.stats = legalResults.map(r => ({
  ...r,
  percentage: (r.total_weight / total) * 100
}));
```

---

## 8. INTEGRATION CHECKLIST FOR DESIGN AI

### What the Design AI Should Understand

- ✅ **Color Palette**: [Provided in Section 6.3]
- ✅ **Typography**: Inter (body) + Montserrat (headings)
- ✅ **Page Structure**: Max-width 1280px, sticky headers, centered content
- ✅ **Component Library**: 
  - Buttons (primary, secondary, danger states)
  - Cards (news, voting, apartment)
  - Forms (login, create, update)
  - Progress bars (voting results)
  - Alerts (success, error, warning, info)
  - Badges (role, status, importance)
- ✅ **Spacing System**: 4px base, Tailwind scale (p-1 to p-8)
- ✅ **Interactions**: Hover effects, focus states, loading states, success/error feedback
- ✅ **Accessibility**: Minimum 44px touch targets, color contrast WCAG AA
- ✅ **Language**: Ukrainian (all copy, error messages, labels)
- ✅ **Responsive**: Mobile-first, 3 breakpoints (mobile, tablet, desktop)
- ✅ **Tone**: Civic-modern, trustworthy, transparent, empowering

### What the Design AI Should IGNORE

- ❌ Current Tailwind classes (remap to new system)
- ❌ React component code (design only)
- ❌ Backend logic (design doesn't care about voting algorithms)
- ❌ Database schema (not relevant to UI)
- ❌ Authentication middleware (design assumes login works)

### Design Output Deliverables

The Design AI should produce:

1. **Design System (Component Library)**
   - Buttons (all states: default, hover, active, disabled, loading)
   - Forms (input, textarea, select, checkbox, radio)
   - Cards (news, voting, apartment, hero)
   - Modals (confirmation, error, success)
   - Navigation (headers, tabs, breadcrumbs)
   - Alerts (4 types: success, error, warning, info)
   - Progress indicators (bar, spinner, skeleton)
   - Badges (status, role, importance)
   - Icons (24x24px, outlined style)

2. **Page Templates**
   - Onboarding flow (login, activate, register)
   - Dashboard (hero + grid layout)
   - List pages (news, votings, apartments)
   - Create/Edit pages (forms)
   - Admin hub (card grid)
   - Profile page

3. **Visual Guidelines**
   - Color palette (with hex codes)
   - Typography scale (sizes, weights, spacing)
   - Spacing & layout (grid, gaps, padding)
   - Shadows & elevation (depth system)
   - Animations (timing, easing, curves)
   - Responsive behavior (mobile, tablet, desktop)

4. **Interactive Specifications**
   - Micro-interactions (hover, focus, active)
   - Loading states (duration, animation)
   - Error states (messaging, visual treatment)
   - Success states (confirmation, feedback)
   - Form validation (live vs. on-submit)

5. **Accessibility Audit**
   - Focus indicators (visible keyboard navigation)
   - Color contrast ratios (WCAG AA minimum)
   - Touch target sizing (44x44px minimum)
   - ARIA labels (where applicable)
   - Language accessibility (Ukrainian support)

---

## 9. NEXT STEPS FOR DESIGN IMPLEMENTATION

### Phase 1: Design System Creation (Design AI Output)
- [ ] Color palette finalized + hex codes
- [ ] Typography scale defined
- [ ] Spacing system codified (8px, 16px, 24px, 32px)
- [ ] Component library created (Figma or equivalent)

### Phase 2: Prototype Development
- [ ] Key user flows prototyped (login → dashboard → vote)
- [ ] Admin flows prototyped (create news, manage apartments)
- [ ] Micro-interactions documented
- [ ] Dark mode variants created (if needed)

### Phase 3: Developer Handoff
- [ ] Design tokens exported (CSS variables)
- [ ] Component specs written (props, states, variants)
- [ ] Responsive breakpoint specifications
- [ ] Icon pack delivered (SVG format)

### Phase 4: Frontend Implementation
- [ ] Tailwind config updated with new palette
- [ ] Components rebuilt using new design system
- [ ] Pages re-styled with new layouts
- [ ] Animations implemented
- [ ] Testing (responsive, accessibility, cross-browser)

---

## DOCUMENT END

**Generated for**: Stitch Design AI (Input for UI/UX Overhaul)  
**Application**: Good Neighbor - OSBB Management Platform  
**Version**: 1.0  
**Status**: Ready for Design System Generation  

