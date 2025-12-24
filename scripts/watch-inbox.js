#!/usr/bin/env node

/**
 * @fileoverview CLI for watching inbox folder and generating MDX
 * @description Drop PDFs, LaTeX files, Python scripts, etc. into the inbox
 *              folder and this script will automatically generate MDX documentation.
 *
 * Usage:
 *   node watch-inbox.js           # Start watching (default inbox folder)
 *   node watch-inbox.js --process # Process existing files only (no watch)
 *   node watch-inbox.js --help    # Show help
 *
 * Or add to package.json scripts:
 *   "inbox": "node scripts/watch-inbox.js"
 *   "inbox:process": "node scripts/watch-inbox.js --process"
 */

const path = require('path');
const fs = require('fs');
const { createConfig } = require('./config');
const InboxWatcher = require('./services/InboxWatcher');
const InboxProcessor = require('./services/InboxProcessor');
const { Logger } = require('./utils/logger');

const logger = new Logger('InboxCLI');

/**
 * Print help message
 */
function printHelp() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                    INBOX WATCHER - MDX Generator                   ║
╚═══════════════════════════════════════════════════════════════════╝

Drop files into the inbox folder and automatically generate MDX documentation!

USAGE:
  node watch-inbox.js [options]

OPTIONS:
  --watch, -w       Start watching inbox folder (default)
  --process, -p     Process existing files only (no watch)
  --source, -s      Custom inbox folder path
  --help, -h        Show this help message

SUPPORTED FILE TYPES:
  📄 .pdf          PDF documents (embedded viewer)
  📝 .tex          LaTeX source files
  🐍 .py           Python scripts
  📊 .m            MATLAB scripts
  📓 .ipynb        Jupyter notebooks
  🌐 .html         HTML files
  📃 .txt          Plain text files
  📖 .md           Markdown files
  📜 .rst          reStructuredText files

EXAMPLES:
  # Start watching default inbox folder
  node watch-inbox.js

  # Process existing files without watching
  node watch-inbox.js --process

  # Watch a custom folder
  node watch-inbox.js --source ./my-documents

INBOX FOLDER STRUCTURE:
  inbox/
  ├── pdf/           Drop PDF files here
  ├── latex/         Drop LaTeX files here
  ├── python/        Drop Python files here
  ├── notebooks/     Drop Jupyter notebooks here
  └── other/         Drop other files here

  (Or just drop files directly in inbox/ - subfolders are optional)

OUTPUT:
  Generated MDX files will be saved to: docs/inbox/
  Static files will be copied to: docs/static/inbox/
`);
}

/**
 * Parse command line arguments
 * @returns {Object} Parsed arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    command: 'watch',
    source: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--watch' || arg === '-w') {
      options.command = 'watch';
    } else if (arg === '--process' || arg === '-p') {
      options.command = 'process';
    } else if (arg === '--help' || arg === '-h') {
      options.command = 'help';
    } else if (arg === '--source' || arg === '-s') {
      options.source = args[++i];
    }
  }

  return options;
}

/**
 * Main entry point
 */
async function main() {
  const args = parseArgs();

  if (args.command === 'help') {
    printHelp();
    process.exit(0);
  }

  // Create config with CLI overrides
  const config = createConfig({ source: args.source });

  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                    INBOX WATCHER - MDX Generator                   ║
╚═══════════════════════════════════════════════════════════════════╝
`);

  logger.info(`Inbox folder: ${config.inboxDir}`);
  logger.info(`Output folder: ${config.inboxDocsDir || path.join(config.docsOutputDir, 'inbox')}`);

  // Ensure inbox directory exists
  if (!fs.existsSync(config.inboxDir)) {
    fs.mkdirSync(config.inboxDir, { recursive: true });
    logger.info('Created inbox folder');

    // Create subdirectories
    const subdirs = ['pdf', 'latex', 'python', 'notebooks', 'other'];
    for (const subdir of subdirs) {
      const subdirPath = path.join(config.inboxDir, subdir);
      if (!fs.existsSync(subdirPath)) {
        fs.mkdirSync(subdirPath, { recursive: true });
      }
    }
    logger.info('Created inbox subdirectories');
  }

  if (args.command === 'process') {
    // Process existing files only
    logger.info('Processing existing files...');
    const processor = new InboxProcessor(config);
    const outputDir = config.inboxDocsDir || path.join(config.docsOutputDir, 'inbox');

    const processDir = async (dir) => {
      if (!fs.existsSync(dir)) return;

      const entries = fs.readdirSync(dir, { withFileTypes: true });
      let processed = 0;

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          processed += await processDir(fullPath);
        } else {
          const ext = path.extname(entry.name).toLowerCase();
          if (processor.handlers[ext]) {
            try {
              await processor.processFile(fullPath, outputDir);
              logger.success(`Processed: ${entry.name}`);
              processed++;
            } catch (error) {
              logger.error(`Failed: ${entry.name} - ${error.message}`);
            }
          }
        }
      }

      return processed;
    };

    const count = await processDir(config.inboxDir);
    logger.success(`\nProcessed ${count} files!`);
    logger.info(`MDX files saved to: ${outputDir}`);

  } else {
    // Start watching
    try {
      // Check if chokidar is available
      require.resolve('chokidar');
    } catch (e) {
      logger.error('chokidar is not installed. Run: npm install chokidar');
      logger.info('\nAlternatively, use --process to process existing files without watching.');
      process.exit(1);
    }

    const watcher = new InboxWatcher(config);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      logger.info('\nShutting down...');
      watcher.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      watcher.stop();
      process.exit(0);
    });

    // Start watching
    watcher.start();

    logger.info('\nDrop files into the inbox folder to generate MDX documentation!');
    logger.info('Press Ctrl+C to stop.\n');
  }
}

// Run
main().catch((error) => {
  logger.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
