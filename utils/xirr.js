// utils/xirr.js

/**
 * Calculates XIRR (Extended Internal Rate of Return) for a series of cash flows
 * @param {Array} cashflows - Array of {amount: number, when: Date} objects
 * @param {number} [guess=0.1] - Initial guess for the return rate (default 10%)
 * @returns {number} The calculated XIRR as a decimal (e.g., 0.15 for 15%)
 */
function calculateXirr(cashflows, guess = 0.1) {
    // Validate inputs
    if (!Array.isArray(cashflows) || cashflows.length < 2) {
        throw new Error('Cashflows must be an array with at least 2 entries');
    }

    // Convert all dates to Date objects if they aren't already
    const validatedCashflows = cashflows.map(cf => ({
        amount: Number(cf.amount),
        when: cf.when instanceof Date ? new Date(cf.when) : new Date(cf.when)
    }));

    // Check we have both positive and negative cashflows
    const hasPositive = validatedCashflows.some(cf => cf.amount > 0);
    const hasNegative = validatedCashflows.some(cf => cf.amount < 0);
    if (!hasPositive || !hasNegative) {
        throw new Error('Cashflows must contain both positive and negative amounts');
    }

    // Convert dates to days since first date (for numerical stability)
    const firstDate = new Date(Math.min(...validatedCashflows.map(cf => cf.when.getTime())));
    const dayNumbers = validatedCashflows.map(cf => 
        (cf.when.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Newton-Raphson implementation
    let rate = guess;
    let lastRate = rate + 1;
    const tolerance = 1e-6;
    const maxIterations = 100;
    let iteration = 0;

    while (Math.abs(rate - lastRate) > tolerance && iteration < maxIterations) {
        lastRate = rate;
        
        // Calculate NPV and its derivative
        let npv = 0;
        let npvDerivative = 0;
        
        for (let i = 0; i < validatedCashflows.length; i++) {
            const cf = validatedCashflows[i];
            const exponent = dayNumbers[i] / 365;
            const denominator = Math.pow(1 + rate, exponent);
            
            npv += cf.amount / denominator;
            npvDerivative -= (cf.amount * exponent) / (denominator * (1 + rate));
        }

        // Avoid division by zero
        if (Math.abs(npvDerivative) < 1e-10) {
            break;
        }

        rate = rate - npv / npvDerivative;
        iteration++;
    }

    // Return NaN if we didn't converge
    if (iteration >= maxIterations || Math.abs(rate) > 1e6) {
        return NaN;
    }

    return rate;
}

module.exports = {
    calculateXirr
};