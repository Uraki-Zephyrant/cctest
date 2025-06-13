// シンプルなテストランナー
class TestRunner {
    constructor() {
        this.tests = [];
        this.results = [];
    }

    describe(description, callback) {
        console.log(`\n=== ${description} ===`);
        callback();
    }

    it(description, callback) {
        try {
            callback();
            this.results.push({ description, status: 'PASS' });
            console.log(`✓ ${description}`);
        } catch (error) {
            this.results.push({ description, status: 'FAIL', error: error.message });
            console.log(`✗ ${description}: ${error.message}`);
        }
    }

    expect(actual) {
        return {
            toBe: (expected) => {
                if (actual !== expected) {
                    throw new Error(`Expected ${expected}, but got ${actual}`);
                }
            },
            toEqual: (expected) => {
                if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                    throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
                }
            },
            toBeTruthy: () => {
                if (!actual) {
                    throw new Error(`Expected truthy value, but got ${actual}`);
                }
            },
            toBeFalsy: () => {
                if (actual) {
                    throw new Error(`Expected falsy value, but got ${actual}`);
                }
            }
        };
    }

    runSummary() {
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        console.log(`\n=== テスト結果 ===`);
        console.log(`通過: ${passed}, 失敗: ${failed}`);
        return failed === 0;
    }
}

const testRunner = new TestRunner();
const { describe, it, expect } = testRunner;