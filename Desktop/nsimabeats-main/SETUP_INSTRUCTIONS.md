# NSIMABEATS Database Setup Instructions

## Quick Start for New Supabase Project

Follow these steps to set up your database from scratch:

### Step 1: Access Supabase SQL Editor

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click on **"SQL Editor"** in the left sidebar
4. Click **"New query"**

### Step 2: Run the Complete Migration

1. Open the file: `supabase/migrations/000_COMPLETE_SETUP.sql`
2. Copy **ALL** the contents
3. Paste into the Supabase SQL Editor
4. Click **"Run"** (or press `Ctrl+Enter` / `Cmd+Enter`)

### Step 3: Verify Setup

After running the migration, verify everything worked by running this query:

```sql
-- Check all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see these tables:
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

### Step 4: Set Up Your First Admin User

After creating your first user account through the app, make them an admin:

```sql
-- Replace 'YOUR_USER_EMAIL' with your actual email
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM public.profiles
WHERE email = 'YOUR_USER_EMAIL'
ON CONFLICT (user_id, role) DO NOTHING;
```

Or if you know the user ID:

```sql
-- Replace 'USER_UUID_HERE' with your actual user UUID
INSERT INTO public.user_roles (user_id, role)
VALUES ('USER_UUID_HERE', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;
```

### Step 5: Configure Environment Variables

Make sure your `.env` file (or environment variables) has:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

You can find these in:
- Supabase Dashboard → Settings → API

## What Gets Created

### Core Tables
- **profiles** - User profiles extending auth.users
- **beats** - Music beats uploaded by producers
- **user_roles** - Role-based access control

### Checkout System
- **cart_items** - Shopping cart items
- **orders** - Order records
- **order_items** - Individual items in orders
- **licenses** - Purchased licenses

### Producer System
- **producer_wallets** - Producer earnings wallets
- **producer_earnings** - Individual earnings records
- **payout_requests** - Payout requests from producers

### Licensing System
- **sync_tickets** - Corporate/NGO licensing requests

### Storage Buckets
- **beats** - Private master audio files
- **covers** - Public cover images
- **previews** - Public preview audio files

### Functions & Triggers
- `handle_new_user()` - Auto-creates profile on signup
- `update_updated_at_column()` - Auto-updates timestamps
- `has_role()` - Role checking function
- `create_producer_wallet()` - Auto-creates wallet on producer approval
- Various triggers for automatic timestamp updates

## Troubleshooting

### Error: "relation already exists"
- Some tables may already exist if you've run migrations before
- The migration uses `CREATE TABLE IF NOT EXISTS` so it should be safe
- If you get errors, you can drop existing tables first (be careful!)

### Error: "type already exists"
- Enums may already exist
- The migration handles this with `DO $$ BEGIN ... EXCEPTION` blocks
- Should be safe to run multiple times

### Error: "permission denied"
- Make sure you're running queries in the Supabase SQL Editor
- Some operations require superuser privileges (handled automatically by Supabase)

### Cart not working after migration
- Make sure `cart_items` table exists: `SELECT * FROM public.cart_items LIMIT 1;`
- Check RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'cart_items';`
- Verify your user is authenticated

### Admin panel not accessible
- Make sure you've added yourself as admin (Step 4 above)
- Check your role: `SELECT * FROM public.user_roles WHERE user_id = auth.uid();`
- Verify `has_role()` function exists: `SELECT public.has_role(auth.uid(), 'admin'::app_role);`

## Next Steps

After setup:
1. ✅ Test user registration
2. ✅ Test producer application
3. ✅ Test beat upload
4. ✅ Test cart functionality
5. ✅ Test checkout process
6. ✅ Test admin panel access

## Need Help?

If you encounter issues:
1. Check Supabase logs: Dashboard → Logs → Postgres Logs
2. Verify all tables exist using the verification query
3. Check RLS policies are enabled
4. Ensure environment variables are set correctly

