const sdk = require('@salesforce/salesforce-sdk');
const { LeaseCalculator } = require('lease-calculator');

// Custom Error Handlers
class LeaseCalculationError extends Error {
    constructor(...args) {
        super(...args);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, LeaseCalculationError);
    }
}

module.exports = function (event, context, logger) {
    let leaseValues = null;
    const payload = event.data;
    try {
        // Instantiate the lease calculator function
        const leaseCalculator = new LeaseCalculator();   
             
        // Provide lease details
        leaseCalculator.calculate(payload);

        // Calculate relative values
        leaseValues = {
            totalLeaseCost: leaseCalculator.getTotalLeaseCost(),
            monthlyPayment: leaseCalculator.getMonthlyPayment(),
            totalDriveOffPayment: leaseCalculator.getDriveOffPayment(),
            apr: leaseCalculator.getAPR(),
            msrpDiscount: leaseCalculator.getDiscountOffMsrpPercentage(),
            residual: leaseCalculator.getRVValue()
        };
    } catch (err) {
        if (err instanceof LeaseCalculationError) {
            return { error: 'Failed to calculate lease', stack: err.stack };
        } else {
            return { error: err.message, stack: err.stack };
        }
    }
    return leaseValues;
};
