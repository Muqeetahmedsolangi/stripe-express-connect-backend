# Stripe Payout System - How It Works

## Overview

This document explains how our payment hold system works with Stripe Connect and how Stripe manages payouts.

## Complete Payment Flow

### Step 1: Customer Makes Payment
```
Customer → Payment Intent → Platform Stripe Account
```
- Customer pays for an order
- **Money goes directly to YOUR platform Stripe account** (not to sellers)
- Payment Intent is created with `application_fee_amount` = 0 (we handle fees manually)
- **Status**: Payment is in YOUR Stripe account balance

### Step 2: Payment Hold Period (Our Custom System)
```
Platform Account Balance → [HOLD PERIOD] → Transfer to Seller Account
```
- Money sits in **your platform Stripe account**
- We mark the order as `paymentHeld: true` in our database
- We calculate `paymentReleaseDate` based on seller's payout schedule
- **Important**: Stripe doesn't know about this hold - it's our application logic
- The money is already in Stripe, just not transferred to sellers yet

### Step 3: Transfer to Seller (When Payout Date Arrives)
```
Platform Account → Stripe Transfer → Seller Connected Account
```
- When `paymentReleaseDate` arrives (or admin manually releases)
- We call `stripe.transfers.create()` to move money from platform to seller
- **Transfer happens immediately** - money moves from your account to seller's connected account
- Seller's Stripe account balance increases

### Step 4: Stripe's Native Payout to Seller's Bank
```
Seller Connected Account → Stripe Payout → Seller's Bank Account
```
- **Stripe automatically handles this** based on seller's account settings
- Stripe has its own payout schedule (daily, weekly, monthly, or manual)
- This is separate from our custom hold system
- Seller receives money in their bank account according to Stripe's schedule

## Important Distinctions

### Our Custom Hold System vs Stripe's Payout System

| Aspect | Our System | Stripe's System |
|--------|-----------|-----------------|
| **What it controls** | When money moves from platform to seller account | When money moves from seller account to bank |
| **Where money is** | Platform Stripe account | Seller's connected Stripe account |
| **Timing** | Based on your payout schedule (daily/weekly/monthly/custom) | Based on Stripe account settings |
| **Who controls it** | You (admin) | Stripe (seller's account settings) |

## Money Flow Diagram

```
┌─────────────────┐
│  Customer Pays  │
│   $100.00      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ Platform Stripe Account │  ← Money sits here during hold period
│   Balance: $100.00      │
└────────┬────────────────┘
         │
         │ [HOLD PERIOD]
         │ Based on seller payout schedule
         │ (e.g., 5 days, weekly, monthly)
         │
         ▼
┌─────────────────────────┐
│  Stripe Transfer API     │  ← We call this when payout date arrives
│  stripe.transfers.create │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Seller Connected Account │  ← Money arrives here immediately
│   Balance: $95.00       │     (minus platform fee)
└────────┬────────────────┘
         │
         │ [STRIPE'S PAYOUT SCHEDULE]
         │ Based on seller's Stripe account settings
         │ (daily, weekly, monthly, or manual)
         │
         ▼
┌─────────────────────────┐
│  Seller's Bank Account  │  ← Final destination
│   $95.00 deposited     │
└─────────────────────────┘
```

## Key Dates and Details

### 1. Payment Date
- **When**: Customer completes payment
- **What happens**: Money arrives in platform Stripe account
- **Stripe Status**: `payment_intent.succeeded`

### 2. Hold Start Date
- **When**: Payment succeeds
- **What happens**: Order marked as `paymentHeld: true`
- **Database**: `paymentReleaseDate` calculated based on seller schedule

### 3. Release Date (Our System)
- **When**: Based on seller's payout schedule:
  - **Daily**: Next day
  - **Weekly**: Specific day of week (e.g., every Monday)
  - **Monthly**: Specific day of month (e.g., 15th of each month)
  - **Custom**: Specific date set by admin
- **What happens**: 
  - Admin can manually release OR
  - System checks if date has arrived
  - `stripe.transfers.create()` is called
  - Money moves to seller's connected account

### 4. Transfer Date (Stripe Transfer)
- **When**: Immediately when we call `stripe.transfers.create()`
- **What happens**: Money transferred from platform to seller account
- **Stripe Status**: Transfer created, seller balance updated
- **Time**: Usually instant (real-time)

### 5. Stripe Payout Date (Stripe's System)
- **When**: Based on seller's Stripe account payout schedule
- **What happens**: Stripe automatically sends money to seller's bank
- **Stripe Settings**: 
  - Daily: Next business day
  - Weekly: Specific day of week
  - Monthly: Specific day of month
  - Manual: Seller initiates manually
- **Time**: 1-2 business days after transfer (depending on bank)

## Example Timeline

Let's say a seller has a **monthly payout schedule on the 15th**:

```
Day 1 (Jan 10): Customer pays $100
  ├─ Money arrives in platform account: $100
  ├─ Order marked as held
  └─ paymentReleaseDate: Jan 15

Day 5 (Jan 15): Payout date arrives
  ├─ Admin releases payment (or system auto-releases)
  ├─ stripe.transfers.create() called
  ├─ $95 transferred to seller's Stripe account (minus $5 platform fee)
  └─ Seller's Stripe balance: $95

Day 6-7 (Jan 16-17): Stripe processes payout
  ├─ Stripe sends $95 to seller's bank account
  └─ Seller receives money in bank (1-2 business days)
```

## Stripe Account Settings That Matter

### Platform Account (Your Account)
- **Balance**: Holds all customer payments during hold period
- **Transfers**: You create transfers to move money to sellers
- **Payout Schedule**: Not relevant (you're not receiving payouts from Stripe)

### Seller Connected Account
- **Balance**: Receives transfers from platform account
- **Payout Schedule**: Set by seller in Stripe Dashboard
  - Can be: Daily, Weekly, Monthly, or Manual
  - This is separate from your custom hold schedule
- **Bank Account**: Where Stripe sends the final payout

## Important Notes

1. **Two Separate Systems**:
   - Your custom hold system controls: Platform → Seller transfer
   - Stripe's system controls: Seller account → Seller's bank

2. **Money Location**:
   - During hold: Platform Stripe account
   - After transfer: Seller's connected Stripe account
   - After Stripe payout: Seller's bank account

3. **No Double Hold**:
   - We don't use Stripe's built-in hold features
   - We simply delay the transfer from platform to seller
   - Once transferred, Stripe handles the rest

4. **Platform Fees**:
   - Calculated when order is created
   - Deducted during transfer (seller gets `total - platformFee - taxes`)
   - Platform keeps the fee amount in platform account

5. **Stripe Fees**:
   - Stripe charges fees on the original payment (to platform account)
   - Additional fees may apply on transfers
   - These are automatically deducted by Stripe

## API Calls We Make

### When Payment Succeeds:
```javascript
// Payment already in platform account
// We just mark order as held
order.paymentHeld = true;
order.paymentReleaseDate = calculateNextPayoutDate(seller);
```

### When Payout Date Arrives:
```javascript
// Transfer money from platform to seller
const transfer = await stripe.transfers.create({
  amount: sellerEarnings * 100, // in cents
  currency: 'usd',
  destination: seller.stripeAccountId,
});
```

### Checking Stripe Payouts (Seller's View):
```javascript
// Get payouts from seller's connected account
const payouts = await stripe.payouts.list({
  limit: 10
}, {
  stripeAccount: seller.stripeAccountId
});
```

## Summary

1. **Customer pays** → Money in platform account
2. **Hold period** → Money stays in platform account (our custom logic)
3. **Transfer** → We move money to seller's Stripe account (when payout date arrives)
4. **Stripe payout** → Stripe sends money to seller's bank (based on seller's Stripe settings)

The payout date you set controls **step 3** (when we transfer to seller). Stripe's payout schedule controls **step 4** (when seller gets it in their bank).

