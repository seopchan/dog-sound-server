module.exports = {
    collectCoverage: false,
    coverage: false,
    runInBand: true,
    forceExit: true,
    verbose: true,
    testTimeout: 20000,
    globals: {
        "ts-jest": {
            tsConfig: "tsconfig.json"
        }
    },
    moduleFileExtensions: [
        "ts",
        "js"
    ],
    transform: {
        "^.+\\.(ts|tsx)$": "ts-jest"
    },
    testMatch: [
        "**/test/**/*.test.(ts|js)"
    ],
    testEnvironment: "node",
    setupFiles: ["<rootDir>/test/config/setup-tests.ts"],
    testSequencer: "<rootDir>/test/config/testSequencer.js"
};
