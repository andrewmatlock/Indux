import { findInduxFiles, downloadFile, shouldPreserveFile } from './utils.js';

export async function runUpdate(directory = '.') {
    console.log('Scanning for Indux files...');

    const files = await findInduxFiles(directory);

    if (files.length === 0) {
        console.log('No Indux files found.');
        return;
    }

    let updatedCount = 0;
    let skippedCount = 0;

    for (const file of files) {
        const filename = file.split('/').pop();
        
        if (shouldPreserveFile(file)) {
            console.log(`⚠ Skipped ${filename} (preserved)`);
            skippedCount++;
            continue;
        }
        
        try {
            await downloadFile(filename);
            updatedCount++;
        } catch (error) {
            console.error(`✗ Failed to update ${filename}:`, error.message);
        }
    }

    console.log(`\nUpdated ${updatedCount} files${skippedCount > 0 ? `, skipped ${skippedCount} files` : ''}`);
}

// If run directly, use command line arguments
if (import.meta.url === `file://${process.argv[1]}`) {
    const directory = process.argv[2] || '.';
    await runUpdate(directory);
}
