import roomTest from './roomTest.js';
const tests = [roomTest];
async function main() {
    tests.forEach(async (test, index) => {
        const passed = await test();
        if (passed) {
            console.log(`Module ${index + 1} passed.`);
        }
        else
            console.log(`Module ${index + 1} failed!`);
    });
}
main();
//# sourceMappingURL=test.js.map