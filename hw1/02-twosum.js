/** Exercise 02 - Two Sum

Problem:

You are given an array of integers 'nums' and an integer 'target', write a function that returns indices of the two
numbers such that they add up to target.

Example 1:

Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

Example 2:

Input: nums = [3,2,4], target = 6
Output: [1,2]

Example 3:

Input: nums = [3,3], target = 6
Output: [0,1]

**/

const twoSum = function returnIndicesThatAddToTarget(nums, target) {
    for (let i = 0; i < nums.length; i += 1) {
        for (let j = i + 1; j < nums.length; j += 1) {
            if (nums[i] + nums[j] === target) {
                return [i, j];
            }
        }
    }

    return [];
};

const ex1 = [2, 7, 11, 15];
const ex2 = [3, 2, 4];
const ex3 = [3, 3];

const target1 = 9;
const target2 = 6;

console.log(twoSum(ex1, target1));
console.log(twoSum(ex2, target2));
console.log(twoSum(ex3, target2));
