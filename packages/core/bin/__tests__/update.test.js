const path = require('path');
const prompts = require('prompts');

// Mock fs-extra
jest.mock('fs-extra', () => require('./mocks/fs-extra'));
const fs = require('fs-extra');

const update = require('../update');

jest.mock('prompts');

describe('Core Update Script', () => {
    beforeEach(() => {
        const cwd = process.cwd();
        const scriptPath = path.join(cwd, 'project/dist/js/indux.min.js');
        const sourcePath = path.join(cwd, 'packages/core/dist/indux.min.js');

        console.log('Mock paths:', { scriptPath, sourcePath });

        fs.__setMockFiles({
            [scriptPath]: 'existing content',
            [sourcePath]: 'new content'
        });

        jest.clearAllMocks();
        console.log = jest.fn();
        console.error = jest.fn();
    });

    afterEach(() => {
        fs.__resetMockFiles();
    });

    test('should create backup and update existing file', async () => {
        prompts.mockResolvedValue({ shouldUpdate: true });
        await update();

        const cwd = process.cwd();
        const scriptPath = path.join(cwd, 'project/dist/js/indux.min.js');

        expect(fs.existsSync(`${scriptPath}.backup`)).toBeTruthy();
        const updatedContent = fs.readFileSync(scriptPath, 'utf8');
        expect(updatedContent).toBe('new content');
    });

    test('should not update if user declines', async () => {
        prompts.mockResolvedValue({ shouldUpdate: false });
        await update();

        const cwd = process.cwd();
        const scriptPath = path.join(cwd, 'project/dist/js/indux.min.js');

        const content = fs.readFileSync(scriptPath, 'utf8');
        expect(content).toBe('existing content');
    });
}); 