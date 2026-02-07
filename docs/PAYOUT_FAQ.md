# Payout System FAQ

## Quick Answers

### Q: When I set a payout date, where is the money held?

**A:** The money is held in **YOUR platform Stripe account**. It's not in the seller's account yet.

### Q: Does Stripe know about our hold period?

**A:** No. Stripe only sees:
- Payment arrives in platform account ✅
- Transfer happens when we call the API ✅
- Stripe doesn't know about our custom hold logic

### Q: What happens on the payout date?

**A:** When the payout date arrives:
1. We call `stripe.transfers.create()` 
2. Money moves from platform account → seller's connected account (instant)
3. Seller's Stripe balance increases
4. Stripe then handles payout to seller's bank (based on seller's Stripe settings)

### Q: How long does it take for seller to get money?

**A:** Two stages:
1. **Our transfer** (platform → seller account): Instant when we release
2. **Stripe's payout** (seller account → bank): 1-2 business days (Stripe's schedule)

### Q: Can sellers see held payments?

**A:** No, sellers can only see:
- Their Stripe account balance (after transfer)
- Their payout history (after Stripe sends to bank)
- They cannot see money held in platform account

### Q: What if I set payout schedule to "daily"?

**A:** 
- Money arrives in platform account on Day 1
- We transfer to seller on Day 2 (next day)
- Stripe sends to seller's bank on Day 3-4 (1-2 business days)

### Q: What if I set payout schedule to "monthly on 15th"?

**A:**
- All payments in January → held until Feb 15
- On Feb 15, we transfer all January payments to seller
- Stripe sends to seller's bank on Feb 16-17

### Q: What about Stripe fees?

**A:** Stripe charges fees automatically:
- **On payment**: Stripe fee deducted from platform account
- **On transfer**: May have additional transfer fees
- These are handled by Stripe automatically

### Q: What about platform fees?

**A:** We calculate and deduct platform fees:
- Calculated when order is created
- Deducted during transfer (seller gets `total - platformFee - taxes`)
- Platform keeps the fee in platform account

## Example Scenarios

### Scenario 1: Daily Payout Schedule

**Seller Schedule**: Daily
**Customer pays**: Monday, Jan 1, 2024 ($100)

```
Monday, Jan 1:
  ✅ Payment received → $100 in platform account
  ✅ Order marked as held
  ✅ paymentReleaseDate: Tuesday, Jan 2

Tuesday, Jan 2:
  ✅ Payout date arrives
  ✅ Transfer $95 to seller (minus $5 platform fee)
  ✅ Seller's Stripe balance: $95

Wednesday-Thursday, Jan 3-4:
  ✅ Stripe sends $95 to seller's bank
  ✅ Seller receives money in bank account
```

### Scenario 2: Monthly Payout Schedule (15th of month)

**Seller Schedule**: Monthly, Day 15
**Customer pays**: Jan 5, Jan 10, Jan 20 ($100 each = $300 total)

```
January 5-14:
  ✅ Payments received → $300 in platform account
  ✅ All orders marked as held
  ✅ paymentReleaseDate: January 15

January 15:
  ✅ Payout date arrives
  ✅ Transfer $285 to seller (3 × $95, minus platform fees)
  ✅ Seller's Stripe balance: $285

January 16-17:
  ✅ Stripe sends $285 to seller's bank
  ✅ Seller receives money in bank account
```

### Scenario 3: Custom Date

**Seller Schedule**: Custom date (Feb 1, 2024)
**Customer pays**: Jan 10, Jan 15, Jan 25 ($100 each = $300 total)

```
January 10-31:
  ✅ Payments received → $300 in platform account
  ✅ All orders marked as held
  ✅ paymentReleaseDate: February 1

February 1:
  ✅ Payout date arrives
  ✅ Transfer $285 to seller
  ✅ Seller's Stripe balance: $285

February 2-3:
  ✅ Stripe sends $285 to seller's bank
  ✅ Seller receives money in bank account
```

## Important Technical Details

### 1. Payment Intent Creation
```javascript
// Money goes to platform account
const paymentIntent = await stripe.paymentIntents.create({
  amount: 10000, // $100.00 in cents
  currency: 'usd',
  // No application_fee_amount - we handle fees manually
});
```

### 2. Hold Period (Our Logic)
```javascript
// We just mark it in database
order.paymentHeld = true;
order.paymentReleaseDate = calculateNextPayoutDate(seller);
// Money is still in platform account
```

### 3. Transfer (When Date Arrives)
```javascript
// Move money from platform to seller
const transfer = await stripe.transfers.create({
  amount: 9500, // $95.00 (minus $5 platform fee)
  currency: 'usd',
  destination: seller.stripeAccountId, // Seller's connected account
});
// Money now in seller's Stripe account
```

### 4. Stripe Payout (Automatic)
```javascript
// Stripe handles this automatically
// Based on seller's Stripe account settings
// We don't control this - it's Stripe's system
```

## Key Points to Remember

1. ✅ **Money is safe**: Held in your platform Stripe account (Stripe's secure system)

2. ✅ **No double holding**: We don't use Stripe's hold features, just delay our transfer

3. ✅ **Immediate transfer**: When we release, transfer happens instantly

4. ✅ **Stripe handles final payout**: After transfer, Stripe manages payout to bank

5. ✅ **Two separate schedules**:
   - Your schedule: When to transfer (platform → seller)
   - Stripe's schedule: When to payout (seller → bank)

6. ✅ **Fees handled automatically**: Stripe deducts fees, we deduct platform fees

7. ✅ **Sellers can't see holds**: They only see balance after transfer

## Troubleshooting

### Q: Seller says they didn't receive payment
**A:** Check:
1. Has payout date arrived? (Check `paymentReleaseDate`)
2. Was transfer created? (Check `payout.stripeTransferId`)
3. Is seller's Stripe account active? (Check `payoutsEnabled`)
4. What's seller's Stripe payout schedule? (Check Stripe Dashboard)

### Q: Money is stuck in platform account
**A:** Check:
1. Is `paymentHeld: true`?
2. Has `paymentReleaseDate` passed?
3. Call release endpoint manually if needed

### Q: Transfer failed
**A:** Check:
1. Seller's Stripe account status
2. Seller's `payoutsEnabled` flag
3. Stripe error message in `payout.failureReason`

