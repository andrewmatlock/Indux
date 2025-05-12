const fs = jest.createMockFromModule('fs-extra');

// Track mock filesystem state
let mockFiles = {};

// Reset the mock filesystem
function __resetMockFiles() {
    mockFiles = {};
}

// Setup mock files and their content
function __setMockFiles(newMockFiles) {
    mockFiles = { ...newMockFiles };
}

// Mock existsSync
function existsSync(path) {
    return !!mockFiles[path];
}

// Mock copySync
function copySync(src, dest) {
    if (!mockFiles[src]) {
        throw new Error(`ENOENT: no such file or directory, lstat '${src}'`);
    }
    mockFiles[dest] = mockFiles[src];
}

// Mock readFileSync
function readFileSync(path, encoding) {
    if (!mockFiles[path]) {
        throw new Error(`ENOENT: no such file or directory, open '${path}'`);
    }
    return mockFiles[path];
}

fs.__setMockFiles = __setMockFiles;
fs.__resetMockFiles = __resetMockFiles;
fs.existsSync = existsSync;
fs.copySync = copySync;
fs.readFileSync = readFileSync;

module.exports = fs; 