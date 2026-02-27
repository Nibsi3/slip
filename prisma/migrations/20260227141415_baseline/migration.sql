-- CreateEnum
CREATE TYPE "Role" AS ENUM ('WORKER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "TipStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('TIP', 'PAYOUT', 'CHARGEBACK', 'CHARGEBACK_REVERSAL', 'FORFEITURE');

-- CreateEnum
CREATE TYPE "LedgerStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "WithdrawalMethod" AS ENUM ('INSTANT_MONEY', 'EFT');

-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "DocStatus" AS ENUM ('NOT_SUBMITTED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PhysicalQRStatus" AS ENUM ('PENDING', 'APPROVED', 'DISPATCHED', 'REJECTED');

-- CreateEnum
CREATE TYPE "QRCodeStatus" AS ENUM ('INACTIVE', 'ACTIVE', 'DISABLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FraudEventType" AS ENUM ('TIP_FLAGGED', 'WITHDRAWAL_FLAGGED', 'VELOCITY_BREACH', 'DEVICE_ANOMALY', 'IP_ANOMALY', 'SAME_DEVICE_DETECTED', 'SAME_IP_DETECTED', 'BALANCE_CAP_EXCEEDED', 'AML_ALERT', 'GEO_JUMP_DETECTED', 'HIGH_RISK_BIN', 'CHARGEBACK', 'DUPLICATE_CARD');

-- CreateEnum
CREATE TYPE "FraudEventStatus" AS ENUM ('OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "FraudAction" AS ENUM ('ALLOW', 'FLAG', 'HOLD', 'BLOCK');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'WORKER',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "idNumber" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifyToken" TEXT,
    "emailVerifyExpiresAt" TIMESTAMP(3),
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "resetToken" TEXT,
    "resetTokenExpiresAt" TIMESTAMP(3),
    "termsAcceptedAt" TIMESTAMP(3),
    "termsVersion" TEXT,
    "termsIpAddress" TEXT,
    "totpSecret" TEXT,
    "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "backupCodes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Worker" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employerName" TEXT,
    "jobTitle" TEXT,
    "qrCode" TEXT NOT NULL,
    "walletBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "bankName" TEXT,
    "bankAccountNo" TEXT,
    "bankBranchCode" TEXT,
    "phoneForIM" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "availableBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balanceCap" DECIMAL(12,2) NOT NULL DEFAULT 2000,
    "chargebackDebt" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "docIdUrl" TEXT,
    "docAddressUrl" TEXT,
    "docSelfieUrl" TEXT,
    "docStatus" "DocStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
    "docRejectReason" TEXT,
    "docSubmittedAt" TIMESTAMP(3),
    "docReviewedAt" TIMESTAMP(3),
    "docReviewedBy" TEXT,
    "physicalQrCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Worker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhysicalQRRequest" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "status" "PhysicalQRStatus" NOT NULL DEFAULT 'PENDING',
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "feeCharged" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "address" TEXT,
    "notes" TEXT,
    "adminNotes" TEXT,
    "dispatchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhysicalQRRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tip" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "feePlatform" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "feeGateway" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ZAR',
    "status" "TipStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT NOT NULL DEFAULT 'paystack',
    "paymentId" TEXT NOT NULL,
    "paystackRef" TEXT,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "customerMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "transactionType" "TransactionType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "feePlatform" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "feeGateway" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(12,2) NOT NULL,
    "status" "LedgerStatus" NOT NULL DEFAULT 'PENDING',
    "reference" TEXT,
    "tipId" TEXT,
    "withdrawalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Withdrawal" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "fee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(12,2) NOT NULL,
    "method" "WithdrawalMethod" NOT NULL,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "bankName" TEXT,
    "bankAccountNo" TEXT,
    "bankBranchCode" TEXT,
    "phoneNumber" TEXT,
    "reference" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Withdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QRCode" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "workerId" TEXT,
    "batchId" TEXT,
    "status" "QRCodeStatus" NOT NULL DEFAULT 'INACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "QRCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudEvent" (
    "id" TEXT NOT NULL,
    "type" "FraudEventType" NOT NULL,
    "status" "FraudEventStatus" NOT NULL DEFAULT 'OPEN',
    "action" "FraudAction" NOT NULL DEFAULT 'FLAG',
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "workerId" TEXT,
    "tipId" TEXT,
    "withdrawalId" TEXT,
    "ipAddress" TEXT,
    "deviceId" TEXT,
    "details" JSONB,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FraudEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceFingerprint" (
    "id" TEXT NOT NULL,
    "fingerprintHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "platform" TEXT,
    "screenRes" TEXT,
    "timezone" TEXT,
    "language" TEXT,
    "ipAddress" TEXT,
    "workerId" TEXT,
    "tipperSessionId" TEXT,
    "isKnownProxy" BOOLEAN NOT NULL DEFAULT false,
    "isKnownVPN" BOOLEAN NOT NULL DEFAULT false,
    "geoCountry" TEXT,
    "geoCity" TEXT,
    "geoLat" DOUBLE PRECISION,
    "geoLon" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceFingerprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VelocityRecord" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "ipAddress" TEXT,
    "deviceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VelocityRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChargebackReserve" (
    "id" TEXT NOT NULL,
    "totalBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "reservePercent" DECIMAL(5,4) NOT NULL DEFAULT 0.075,
    "reserveAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChargebackReserve_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettlementHold" (
    "id" TEXT NOT NULL,
    "tipId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "clearsAt" TIMESTAMP(3) NOT NULL,
    "clearedAt" TIMESTAMP(3),
    "isFraudHeld" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettlementHold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmlAlert" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "details" JSONB,
    "isReviewed" BOOLEAN NOT NULL DEFAULT false,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AmlAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Worker_userId_key" ON "Worker"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Worker_qrCode_key" ON "Worker"("qrCode");

-- CreateIndex
CREATE INDEX "PhysicalQRRequest_workerId_idx" ON "PhysicalQRRequest"("workerId");

-- CreateIndex
CREATE UNIQUE INDEX "Tip_paymentId_key" ON "Tip"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerEntry_tipId_key" ON "LedgerEntry"("tipId");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerEntry_withdrawalId_key" ON "LedgerEntry"("withdrawalId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "QRCode_token_key" ON "QRCode"("token");

-- CreateIndex
CREATE INDEX "FraudEvent_workerId_idx" ON "FraudEvent"("workerId");

-- CreateIndex
CREATE INDEX "FraudEvent_type_idx" ON "FraudEvent"("type");

-- CreateIndex
CREATE INDEX "FraudEvent_status_idx" ON "FraudEvent"("status");

-- CreateIndex
CREATE INDEX "FraudEvent_createdAt_idx" ON "FraudEvent"("createdAt");

-- CreateIndex
CREATE INDEX "DeviceFingerprint_fingerprintHash_idx" ON "DeviceFingerprint"("fingerprintHash");

-- CreateIndex
CREATE INDEX "DeviceFingerprint_ipAddress_idx" ON "DeviceFingerprint"("ipAddress");

-- CreateIndex
CREATE INDEX "DeviceFingerprint_workerId_idx" ON "DeviceFingerprint"("workerId");

-- CreateIndex
CREATE INDEX "DeviceFingerprint_tipperSessionId_idx" ON "DeviceFingerprint"("tipperSessionId");

-- CreateIndex
CREATE INDEX "VelocityRecord_workerId_action_createdAt_idx" ON "VelocityRecord"("workerId", "action", "createdAt");

-- CreateIndex
CREATE INDEX "VelocityRecord_ipAddress_createdAt_idx" ON "VelocityRecord"("ipAddress", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SettlementHold_tipId_key" ON "SettlementHold"("tipId");

-- CreateIndex
CREATE INDEX "SettlementHold_workerId_clearsAt_idx" ON "SettlementHold"("workerId", "clearsAt");

-- CreateIndex
CREATE INDEX "SettlementHold_clearsAt_idx" ON "SettlementHold"("clearsAt");

-- CreateIndex
CREATE INDEX "AmlAlert_workerId_idx" ON "AmlAlert"("workerId");

-- CreateIndex
CREATE INDEX "AmlAlert_isReviewed_idx" ON "AmlAlert"("isReviewed");

-- CreateIndex
CREATE INDEX "AmlAlert_createdAt_idx" ON "AmlAlert"("createdAt");

-- AddForeignKey
ALTER TABLE "Worker" ADD CONSTRAINT "Worker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalQRRequest" ADD CONSTRAINT "PhysicalQRRequest_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tip" ADD CONSTRAINT "Tip_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_tipId_fkey" FOREIGN KEY ("tipId") REFERENCES "Tip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_withdrawalId_fkey" FOREIGN KEY ("withdrawalId") REFERENCES "Withdrawal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRCode" ADD CONSTRAINT "QRCode_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudEvent" ADD CONSTRAINT "FraudEvent_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VelocityRecord" ADD CONSTRAINT "VelocityRecord_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementHold" ADD CONSTRAINT "SettlementHold_tipId_fkey" FOREIGN KEY ("tipId") REFERENCES "Tip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementHold" ADD CONSTRAINT "SettlementHold_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmlAlert" ADD CONSTRAINT "AmlAlert_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
