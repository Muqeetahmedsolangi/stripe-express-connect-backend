/**
 * Calculate the next payout date based on seller's payout schedule
 * @param {Object} seller - Seller user object with payout schedule fields
 * @param {Date} baseDate - Base date to calculate from (default: today)
 * @returns {Date|null} - Next payout date or null if no schedule set
 */
const calculateNextPayoutDate = (seller, baseDate = new Date()) => {
  if (!seller.payoutScheduleType) {
    return null;
  }

  const today = new Date(baseDate);
  today.setHours(0, 0, 0, 0);

  switch (seller.payoutScheduleType) {
    case 'daily':
      // Payout every day
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;

    case 'weekly':
      // Payout on specific day of week (0 = Sunday, 6 = Saturday)
      const payoutDay = seller.payoutDay !== null ? seller.payoutDay : 1; // Default to Monday
      const currentDay = today.getDay();
      let daysUntilPayout = payoutDay - currentDay;
      
      if (daysUntilPayout <= 0) {
        daysUntilPayout += 7; // Next week
      }
      
      const nextWeekly = new Date(today);
      nextWeekly.setDate(nextWeekly.getDate() + daysUntilPayout);
      return nextWeekly;

    case 'monthly':
      // Payout on specific day of month (1-31)
      const payoutDayOfMonth = seller.payoutDay !== null ? seller.payoutDay : 1; // Default to 1st
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      // Get last day of current month
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const dayToUse = Math.min(payoutDayOfMonth, lastDayOfMonth);
      
      const nextMonthly = new Date(currentYear, currentMonth, dayToUse);
      
      // If the date has passed this month, move to next month
      if (nextMonthly < today) {
        nextMonthly.setMonth(nextMonthly.getMonth() + 1);
        // Handle month-end edge cases (e.g., Jan 31 -> Feb 28/29)
        const newLastDay = new Date(nextMonthly.getFullYear(), nextMonthly.getMonth() + 1, 0).getDate();
        if (dayToUse > newLastDay) {
          nextMonthly.setDate(newLastDay);
        }
      }
      
      return nextMonthly;

    case 'custom':
      // Payout on specific date
      if (seller.payoutDate) {
        const customDate = new Date(seller.payoutDate);
        customDate.setHours(0, 0, 0, 0);
        
        // If custom date has passed, return null (admin needs to set new date)
        if (customDate < today) {
          return null;
        }
        
        return customDate;
      }
      return null;

    default:
      return null;
  }
};

/**
 * Check if a seller's payout date has arrived
 * @param {Object} seller - Seller user object
 * @returns {boolean} - True if payout date has arrived
 */
const isPayoutDateReached = (seller) => {
  if (!seller.nextPayoutDate) {
    return false;
  }

  const payoutDate = new Date(seller.nextPayoutDate);
  payoutDate.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return payoutDate <= today;
};

/**
 * Update seller's next payout date based on their schedule
 * @param {Object} seller - Seller user object
 * @returns {Date|null} - Updated next payout date
 */
const updateNextPayoutDate = async (seller) => {
  if (!seller.payoutScheduleType) {
    return null;
  }

  const nextDate = calculateNextPayoutDate(seller);
  
  if (nextDate) {
    // For recurring schedules, calculate the next date after the current one
    if (seller.payoutScheduleType === 'daily') {
      // Already calculated for tomorrow
    } else if (seller.payoutScheduleType === 'weekly') {
      // Add 7 days for next week
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (seller.payoutScheduleType === 'monthly') {
      // Add 1 month
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (seller.payoutScheduleType === 'custom') {
      // For custom, return null as admin needs to set next date
      return null;
    }
  }

  return nextDate;
};

module.exports = {
  calculateNextPayoutDate,
  isPayoutDateReached,
  updateNextPayoutDate,
};

