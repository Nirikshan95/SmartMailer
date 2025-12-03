const { generateLicense } = require('../server/services/licenseService');
require('dotenv').config();

// Example usage: node scripts/generate_license.js "Gold Plan" 1000 100
// Arguments: PlanName, DailyLimit, HourlyLimit

const args = process.argv.slice(2);
const planName = args[0] || 'Basic Plan';
const dailyLimit = parseInt(args[1]) || 50;
const hourlyLimit = parseInt(args[2]) || 10;

const payload = {
    plan: planName,
    limits: {
        maxPerDay: dailyLimit,
        maxPerHour: hourlyLimit
    }
};

const token = generateLicense(payload);

console.log('--- GENERATED LICENSE KEY ---');
console.log(`Plan: ${planName}`);
console.log(`Daily Limit: ${dailyLimit}`);
console.log(`Hourly Limit: ${hourlyLimit}`);
console.log('\nKEY:');
console.log(token);
console.log('\n-----------------------------');
console.log('Provide this key to your customer.');
