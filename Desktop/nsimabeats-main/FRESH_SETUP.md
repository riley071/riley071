# Fresh Supabase Setup - Complete Guide

## 🚀 Quick Start

You've created a new Supabase account and need to set up the database from scratch. Follow these steps:

### Step 1: Open Supabase SQL Editor

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New query"**

### Step 2: Run the Complete Migration

1. Open the file: **`supabase/migrations/000_COMPLETE_SETUP.sql`**
2. Copy **ALL** the contents (it's a large file, ~700+ lines)
3. Paste into the Supabase SQL Editor
4. Click **"Run"** button (or press `Ctrl+Enter` / `Cmd+Enter`)

⏱️ **This will take 10-30 seconds to complete**

### Step 3: Verify Setup

After running, verify everything worked:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Expected tables:**
- ✅ beats
- ✅ cart_items
- ✅ licenses
- ✅ order_items
- ✅ orders
- ✅ payout_requests
- ✅ producer_earnings
- ✅ producer_wallets
- ✅ profiles
- ✅ sync_tickets
- ✅ user_roles

### Step 4: Create Your Admin Account

1. **First, sign up through your app** (or create a user manually)
2. **Then make yourself admin** by running this in SQL Editor:

```sql
-- Replace 'your-email@example.com' with your actual email
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM public.profiles
WHERE email = 'your-email@example.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

**Or if you know your user UUID:**

```sql
-- Replace 'YOUR-UUID-HERE' with your actual user UUID from auth.users
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR-UUID-HERE', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;
```

### Step 5: Configure Environment Variables

Make sure your `.env` file has:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

**Find these in:**
- Supabase Dashboard → Settings → API

---

## 📋 What Gets Created

### Core System
- **profiles** - User profiles (extends auth.users)
- **beats** - Music beats uploaded by producers
- **user_roles** - Admin/moderator role management

### E-commerce System
- **cart_items** - Shopping cart
- **orders** - Order records
- **order_items** - Items in each order
- **licenses** - Purchased licenses

### Producer System
- **producer_wallets** - Producer earnings wallets
- **producer_earnings** - Individual earnings records
- **payout_requests** - Payout requests

### Licensing System
- **sync_tickets** - Corporate/NGO licensing requests

### Storage Buckets
- **beats** - Private master audio files
- **covers** - Public cover images
- **previews** - Public preview audio files

### Functions & Triggers
- `handle_new_user()` - Auto-creates profile on signup
- `update_updated_at_column()` - Auto-updates timestamps
- `has_role()` - Role checking for admin access
- `create_producer_wallet()` - Auto-creates wallet when producer approved
- Various triggers for automatic operations

---

## ✅ Post-Setup Checklist

After running the migration:

- [ ] Verify all tables exist (use verification query above)
- [ ] Create your admin account (Step 4)
- [ ] Set environment variables (Step 5)
- [ ] Test user registration
- [ ] Test producer application
- [ ] Test beat upload
- [ ] Test cart functionality
- [ ] Test checkout process
- [ ] Test admin panel access

---

## 🐛 Troubleshooting

### "relation already exists" error
- Some tables may already exist
- The migration uses `IF NOT EXISTS` so it should be safe
- If errors persist, you may need to drop existing tables first (⚠️ be careful!)

### "type already exists" error
- Enums may already exist
- The migration handles this automatically
- Should be safe to run multiple times

### Cart not working
- Verify `cart_items` table exists: `SELECT * FROM public.cart_items LIMIT 1;`
- Check RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'cart_items';`
- Ensure user is authenticated

### Admin panel not accessible
- Verify admin role: `SELECT * FROM public.user_roles WHERE user_id = auth.uid();`
- Check `has_role()` function: `SELECT public.has_role(auth.uid(), 'admin'::app_role);`
- Make sure you completed Step 4 above

### "permission denied" errors
- Make sure you're running queries in Supabase SQL Editor
- Some operations require superuser privileges (handled automatically by Supabase)

---

## 📚 Additional Resources

- **Detailed Setup Guide**: See `SETUP_INSTRUCTIONS.md`
- **Migration Guide**: See `MIGRATIONS_GUIDE.md`
- **Feature Status**: See `FEATURE_STATUS.md`
- **Testing Checklist**: See `TESTING_CHECKLIST.md`

---

## 🎉 You're Done!

Once you've completed these steps, your database is fully set up and ready to use. Start testing your application!

