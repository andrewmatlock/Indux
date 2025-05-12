const path = require('path');
const prompts = require('prompts');

// Mock fs-extra
jest.mock('fs-extra', () => require('./mocks/fs-extra'));
const fs = require('fs-extra');

const update = require('../update');

jest.mock('prompts');

describe('Styles Update Script', () => {
    let cssPath;
    let sourceDir;
    let originalConsoleLog;

    beforeEach(() => {
        // Save original console.log
        originalConsoleLog = console.log;
        // Mock console.log
        console.log = jest.fn();

        const cwd = process.cwd();
        cssPath = path.join(cwd, 'project/dist/css');
        sourceDir = path.join(cwd, '@indux/styles/dist');

        fs.__setMockFiles({
            [path.join(cssPath, 'baseline.css')]: 'existing baseline',
            [path.join(cssPath, 'elements.css')]: 'existing elements',
            [path.join(cssPath, 'styles.css')]: 'custom styles',
            [path.join(sourceDir, 'baseline.css')]: 'new baseline',
            [path.join(sourceDir, 'elements.css')]: 'new elements',
            [path.join(sourceDir, 'styles.css')]: 'template styles'
        });

        jest.clearAllMocks();
    });

    afterEach(() => {
        // Restore original console.log
        console.log = originalConsoleLog;
        fs.__resetMockFiles();
    });

    test('should update baseline.css and elements.css with backups', async () => {
        prompts.mockResolvedValue({ shouldUpdate: true });
        await update();

        expect(fs.existsSync(path.join(cssPath, 'baseline.css.backup'))).toBeTruthy();
        expect(fs.existsSync(path.join(cssPath, 'elements.css.backup'))).toBeTruthy();
    });

    test('should not update styles.css', async () => {
        prompts.mockResolvedValue({ shouldUpdate: true });
        await update();

        expect(fs.readFileSync(path.join(cssPath, 'baseline.css'), 'utf8')).toBe('new baseline');
        expect(fs.readFileSync(path.join(cssPath, 'elements.css'), 'utf8')).toBe('new elements');
        expect(fs.existsSync(path.join(cssPath, 'styles.css.backup'))).toBeFalsy();
    });

    test('should not update if user declines', async () => {
        prompts.mockResolvedValue({ shouldUpdate: false });
        await update();

        expect(fs.readFileSync(path.join(cssPath, 'baseline.css'), 'utf8')).toBe('existing baseline');
        expect(fs.readFileSync(path.join(cssPath, 'elements.css'), 'utf8')).toBe('existing elements');
    });

    test('should handle missing files gracefully', async () => {
        fs.__setMockFiles({
            '@indux/styles/dist': {
                'baseline.css': 'new baseline',
                'elements.css': 'new elements',
                'styles.css': 'template styles'
            }
        });

        await update();

        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining('No existing baseline.css found')
        );
    });
}); 