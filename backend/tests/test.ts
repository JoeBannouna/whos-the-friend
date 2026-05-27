import roomTest from './roomTest.js';
// import socketManagerTest from './socketManagerTest.js';

const tests = [
  roomTest,
  // socketManagerTest
];
async function main() {
  tests.forEach(async (test, index) => {
    const passed: boolean = await test();
    if (passed) {
      console.log(`Module ${index + 1} passed.`);
    } else console.log(`Module ${index + 1} failed!`);
  });
}

main();
