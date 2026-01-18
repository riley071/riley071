# Nsimabeats Testing Checklist

## ✅ Completed Features to Test

### 1. User Authentication & Roles
- [ ] Sign up as Artist
- [ ] Sign up as Producer
- [ ] Sign in/out functionality
- [ ] Role-based access control (producer vs artist)

### 2. Producer Verification Flow
- [ ] Navigate to `/apply` page
- [ ] Fill out producer application form:
  - [ ] Upload profile picture
  - [ ] Enter bio
  - [ ] Select genres (multiple)
  - [ ] Select DAW
  - [ ] Upload 1-3 sample beats
  - [ ] Upload ID document
  - [ ] Enter payout information
- [ ] Submit application
- [ ] Verify application shows as "pending" in admin

### 3. Admin Producer Approval
- [ ] Log in as admin
- [ ] Navigate to `/admin`
- [ ] Go to "Producers" tab
- [ ] Review producer application
- [ ] Approve producer
- [ ] Verify producer can now upload beats

### 4. Beat Upload (Producer Only)
- [ ] Log in as verified producer
- [ ] Navigate to `/upload`
- [ ] Upload audio file (MP3/WAV)
- [ ] Upload cover image (optional)
- [ ] Upload stems (optional ZIP or audio)
- [ ] Fill in beat details:
  - [ ] Title, Genre, BPM
  - [ ] Key, Mood (optional)
  - [ ] Description
  - [ ] Pricing (Basic, Premium, Unlimited, Exclusive)
- [ ] Submit beat
- [ ] Verify beat shows as "pending" in dashboard

### 5. Admin Beat Approval
- [ ] Log in as admin
- [ ] Navigate to `/admin`
- [ ] Go to "Beats" tab
- [ ] Review pending beat
- [ ] Add admin notes (optional)
- [ ] Approve/publish beat
- [ ] Verify beat appears in marketplace

### 6. Marketplace & Search
- [ ] Browse beats in marketplace
- [ ] Search beats by title/producer
- [ ] Filter by genre
- [ ] Filter by mood
- [ ] Sort by popularity, newest, price
- [ ] Play preview audio
- [ ] View beat details

### 7. Cart & Checkout
- [ ] Add beat to cart
- [ ] Select license type (Basic, Premium, Unlimited, Exclusive)
- [ ] View cart
- [ ] Proceed to checkout
- [ ] Select payment method:
  - [ ] Credit/Debit Card
  - [ ] Mpamba
  - [ ] Airtel Money
  - [ ] Bank Transfer
- [ ] Complete purchase
- [ ] Verify order completion

### 8. Producer Wallet & Earnings
- [ ] Log in as producer
- [ ] Navigate to `/dashboard`
- [ ] View wallet section:
  - [ ] Available balance
  - [ ] Pending balance
  - [ ] Total paid out
- [ ] Verify earnings show after beat purchase
- [ ] Request payout:
  - [ ] Click "Request Payout"
  - [ ] Enter amount
  - [ ] Select payout method
  - [ ] Enter account details
  - [ ] Submit request

### 9. Admin Payout Management
- [ ] Log in as admin
- [ ] Navigate to `/admin`
- [ ] Go to "Payouts" tab
- [ ] View pending payout requests
- [ ] Review payout details
- [ ] Approve payout
- [ ] Mark payout as completed
- [ ] Verify producer wallet updates

### 10. Sync Licensing
- [ ] Navigate to `/licensing`
- [ ] View hero section with CTAs
- [ ] Browse by use case (Corporate, NGO, Film/TV, etc.)
- [ ] Browse by theme (Hope, Unity, Love, etc.)
- [ ] Fill out license request form:
  - [ ] Company/NGO name
  - [ ] Contact person
  - [ ] Email & phone
  - [ ] Project type
  - [ ] Campaign duration
  - [ ] Territory
  - [ ] Budget range
  - [ ] Music type/mood
  - [ ] Deadline
  - [ ] Campaign brief
- [ ] Submit request
- [ ] Verify sync ticket created in admin

### 11. Admin Sync Ticket Management
- [ ] Log in as admin
- [ ] Navigate to `/admin`
- [ ] Go to "Sync Tickets" tab
- [ ] View all sync tickets
- [ ] Review ticket details
- [ ] Update ticket status (reviewing, quoted, approved, etc.)
- [ ] Add admin notes
- [ ] Mark ticket as completed

### 12. Dashboard Analytics (Producer)
- [ ] View total beats count
- [ ] View published beats count
- [ ] View total earnings
- [ ] View total plays
- [ ] View wallet balances
- [ ] View recent earnings

### 13. Purchased Beats (All Users)
- [ ] After purchase, navigate to dashboard
- [ ] View "My Purchased Beats" section
- [ ] See all purchased licenses
- [ ] Download purchased beats
- [ ] View license information

## 🧪 Testing Instructions

### Setup
1. Run database migrations:
   ```bash
   # Apply migrations in Supabase dashboard or via CLI
   ```

2. Create test accounts:
   - Artist account
   - Producer account (apply and get approved)
   - Admin account

3. Start development server:
   ```bash
   npm run dev
   ```

### Test Scenarios

#### Scenario 1: New Producer Journey
1. Sign up as Producer
2. Complete producer application
3. Wait for admin approval
4. Upload first beat
5. Wait for beat approval
6. Verify beat in marketplace

#### Scenario 2: Purchase Flow
1. Browse marketplace as artist
2. Add beat to cart
3. Select license type
4. Complete checkout with different payment methods
5. Verify purchase in dashboard
6. Verify producer earnings updated

#### Scenario 3: Payout Flow
1. Producer receives earnings from sale
2. Request payout
3. Admin reviews and approves
4. Admin marks as completed
5. Verify wallet balances updated

#### Scenario 4: Sync Licensing
1. Corporate user visits `/licensing`
2. Fills out license request
3. Admin reviews ticket
4. Admin updates status through workflow

## 🔍 Known Issues / Notes

1. **Email Confirmations**: Currently not sending emails (TODO in code)
2. **PDF Generation**: License PDFs not yet generated (needs implementation)
3. **Payment Gateway**: Payment processing is simulated (no actual gateway integration)
4. **Storage Buckets**: Avatars and documents use existing buckets (should create dedicated ones)

## 📝 Manual Test Results

Use this section to track test results:

```
Date: ___________
Tester: ___________

Feature: ___________
Status: [ ] Pass [ ] Fail [ ] Partial
Notes: 
_______________________________________
```

