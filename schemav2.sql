-- MemLaunch Schema V2 Upgrade

-- 1. Add KYC and Tier fields to users table
ALTER TABLE users 
ADD COLUMN kyc_status VARCHAR(20) DEFAULT 'unverified' CHECK (kyc_status IN ('unverified', 'pending', 'verified', 'rejected')),
ADD COLUMN tier_level INTEGER DEFAULT 0;

-- 2. User Watchlists (Many-to-Many)
CREATE TABLE user_watchlists (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    launch_id UUID REFERENCES launches(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, launch_id)
);

-- 3. Notifications
CREATE TYPE notification_type AS ENUM ('system', 'launch_alert', 'kyc_update', 'allocation_update');

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type notification_type DEFAULT 'system',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. User Allocations & Vesting Tracking
CREATE TABLE user_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    launch_id UUID REFERENCES launches(id) ON DELETE CASCADE,
    amount_invested_usd NUMERIC(20, 2) NOT NULL,
    tokens_allocated NUMERIC(30, 0) NOT NULL,
    tokens_claimed NUMERIC(30, 0) DEFAULT 0,
    vesting_schedule JSONB, -- e.g., [{"date": "2026-08-05", "percentage": 20, "claimed": false}]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
