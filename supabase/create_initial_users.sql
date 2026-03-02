-- =============================================================================
-- Create initial users: worker + super admin
-- Run in Supabase SQL Editor ONCE
-- Passwords are bcrypt hashed (cost 12):
--   Worker123  → bcrypt below
--   !!AnCam123 → bcrypt below
-- =============================================================================

-- Worker: 0662995533 / Worker123
INSERT INTO public."User" (
  id, phone, "firstName", "lastName", "passwordHash", role,
  "isVerified", "loginAttempts", "emailVerified",
  "termsAcceptedAt", "termsVersion", "createdAt", "updatedAt"
) VALUES (
  'worker-initial-001',
  '0662995533',
  'Worker',
  'Demo',
  '$2a$12$7DbgG4YVJ8HzPUUD.f/JmuZM.zpj94.h1MgDSsH1zir5gPNhygtKi',
  'WORKER',
  true, 0, false,
  now(), 'v1.0', now(), now()
) ON CONFLICT (phone) DO NOTHING;

-- Create Worker record for the worker user
INSERT INTO public."Worker" (
  id, "userId", "qrCode", "walletBalance", "availableBalance",
  "balanceCap", "chargebackDebt", "createdAt", "updatedAt"
) VALUES (
  'worker-profile-001',
  'worker-initial-001',
  'INIT0001',
  0, 0, 2000, 0,
  now(), now()
) ON CONFLICT ("userId") DO NOTHING;

-- Admin: cameronfalck03@gmail.com / !!AnCam123
INSERT INTO public."User" (
  id, email, "firstName", "lastName", "passwordHash", role,
  "isVerified", "emailVerified", "loginAttempts",
  "termsAcceptedAt", "termsVersion", "createdAt", "updatedAt"
) VALUES (
  'admin-initial-001',
  'cameronfalck03@gmail.com',
  'Cameron',
  'Falck',
  '$2a$12$R9vj//VNa1uEGhmIiPg8Yepx5MDH1/3OnGrWFA7Kk4fVt4drs6gUG',
  'SUPER_ADMIN',
  true, true, 0,
  now(), 'v1.0', now(), now()
) ON CONFLICT (email) DO NOTHING;

-- Verify
SELECT id, phone, email, "firstName", "lastName", role, "isVerified"
FROM public."User"
ORDER BY "createdAt";
