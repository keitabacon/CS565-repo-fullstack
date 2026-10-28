/** Exercise 01 - Coins * */

// Add your function here

const log = function takeArrayAndLog(money, array) {
  // output string
  let output = '';
  // loop through array
  for (let i = 0; i < array.length; i += 1) {
    // if first add the money to the front
    if (i === 0) {
      output = `$${money} ==> ${String(array[i])}`;
    } else {
      // else add the array content to the end of the current string
      output = `${output}, ${String(array[i])}`;
    }
  }
  return output;
};

const calculateChange = function dollarsIntoCoins(money) {
  // input validation
  if (!Number.isFinite(amount) || amount < 0) {
    return 'Error: Invalid input';
  }
  if (money > 100) return `$${money} ==> Error: the number is too large`;
  if (money <= 0) return `$${money} ==> No Change back`;
  const forLogging = [];
  // for dollars truncate the cents off of original money
  const dollars = Math.trunc(money);
  // turn the decimal dollars into whole number cents and round it off
  let cents = Math.round(money * 100);
  // remove dollars worth off of cents
  cents %= 100;
  if (dollars) {
    forLogging.push(`${dollars} ${dollars === 1 ? 'dollar' : 'dollars'}`);
  }
  // count number of quarters in remaining cents and remove decimals
  const quarters = Math.trunc(cents / 25);
  // remove quarters off of cents
  cents %= 25;
  if (quarters) {
    forLogging.push(`${quarters} ${quarters === 1 ? 'quarter' : 'quarters'}`);
  }
  // count dimes
  const dimes = Math.trunc(cents / 10);
  // remove dimes
  cents %= 10;
  if (dimes) {
    forLogging.push(`${dimes} ${dimes === 1 ? 'dime' : 'dimes'}`);
  }
  // count nickels
  const nickels = Math.trunc(cents / 5);
  if (nickels) {
    forLogging.push(`${nickels} ${nickels === 1 ? 'nickel' : 'nickels'}`);
  }
  // the rest are pennies
  const pennies = cents % 5;
  if (pennies) {
    forLogging.push(`${pennies} ${pennies === 1 ? 'penny' : 'pennies'}`);
  }
  return log(money, forLogging);
};

// Sample test cases
console.log(calculateChange(4.62));
// $4.62 ==> 4 dollars, 2 quarters, 1 dime, 2 pennies
console.log(calculateChange(0.16));
// $0.16 ==> 1 dime, 1 nickel, 1 penny
console.log(calculateChange(150.11));
// $150.11 ==> Error: the number is too large
console.log(calculateChange(-1));
console.log(calculateChange(99.99));
console.log(calculateChange(0.01));
// Add additional test cases here
