/**
 * @fileoverview Inbox folder watcher for automatic MDX generation
 * @module services/InboxWatcher
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Only watches inbox and triggers processing
 * - Open/Closed: Can add new file types without modifying watcher
 * - Dependency Inversion: Depends on abstractions (processors)
 */

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const { Logger } = require('../utils/logger');
const InboxProcessor = require('./InboxProcessor');

/**
 * Watches inbox folder for new files and automatically generates MDX documentation
 */
class InboxWatcher {
  /**
   * @param {Object} config - Configuration object
   */
  constructor(config) {
    this.config = config;
    this.logger = new Logger('InboxWatcher');
    this.processor = new InboxProcessor(config);
    this.watcher = null;

    // Supported file extensions
    this.supportedExtensions = [
      '.pdf', '.tex', '.py', '.m', '.ipynb',
      '.html', '.txt', '.md', '.rst'
    ];
  }

  /**
   * Get the inbox directory path
   * @returns {string} Inbox directory path
   */
  getInboxPath() {
    return this.config.inboxDir || path.join(process.cwd(), 'inbox');
  }

  /**
   * Get the output docs directory path
   * @returns {string} Output directory path
   */
  getOutputPath() {
    return this.config.docsOutputDir || path.join(process.cwd(), 'docs', 'inbox');
  }

  /**
   * Check if file extension is supported
   * @param {string} filePath - File path
   * @returns {boolean} True if supported
   */
  isSupported(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return this.supportedExtensions.includes(ext);
  }

  /**
   * Start watching the inbox folder
   */
  start() {
    const inboxPath = this.getInboxPath();

    // Ensure inbox directory exists
    if (!fs.existsSync(inboxPath)) {
      fs.mkdirSync(inboxPath, { recursive: true });
      this.logger.info(`Created inbox directory: ${inboxPath}`);
    }

    // Ensure output directory exists
    const outputPath = this.getOutputPath();
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    this.logger.info(`Starting inbox watcher on: ${inboxPath}`);
    this.logger.info(`Output directory: ${outputPath}`);
    this.logger.info(`Supported extensions: ${this.supportedExtensions.join(', ')}`);

    // Initialize watcher
    this.watcher = chokidar.watch(inboxPath, {
      ignored: /(^|[\/\\])\../, // Ignore dotfiles
      persistent: true,
      ignoreInitial: false, // Process existing files on startup
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
      }
    });

    // Event handlers
    this.watcher
      .on('add', (filePath) => this.handleFileAdded(filePath))
      .on('change', (filePath) => this.handleFileChanged(filePath))
      .on('error', (error) => this.logger.error(`Watcher error: ${error}`))
      .on('ready', () => this.logger.success('Inbox watcher ready. Drop files to generate MDX!'));
  }

  /**
   * Handle new file added to inbox
   * @param {string} filePath - Path to added file
   */
  async handleFileAdded(filePath) {
    if (!this.isSupported(filePath)) {
      this.logger.warn(`Unsupported file type: ${path.basename(filePath)}`);
      return;
    }

    this.logger.info(`New file detected: ${path.basename(filePath)}`);

    try {
      await this.processor.processFile(filePath, this.getOutputPath());
      this.logger.success(`Generated MDX for: ${path.basename(filePath)}`);
    } catch (error) {
      this.logger.error(`Failed to process ${path.basename(filePath)}: ${error.message}`);
    }
  }

  /**
   * Handle file changed in inbox
   * @param {string} filePath - Path to changed file
   */
  async handleFileChanged(filePath) {
    if (!this.isSupported(filePath)) return;

    this.logger.info(`File changed: ${path.basename(filePath)}`);

    try {
      await this.processor.processFile(filePath, this.getOutputPath());
      this.logger.success(`Updated MDX for: ${path.basename(filePath)}`);
    } catch (error) {
      this.logger.error(`Failed to update ${path.basename(filePath)}: ${error.message}`);
    }
  }

  /**
   * Process all existing files in inbox
   */
  async processExisting() {
    const inboxPath = this.getInboxPath();
    const outputPath = this.getOutputPath();

    this.logger.info('Processing existing files in inbox...');

    const processDir = async (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await processDir(fullPath);
        } else if (this.isSupported(fullPath)) {
          try {
            await this.processor.processFile(fullPath, outputPath);
            this.logger.success(`Processed: ${entry.name}`);
          } catch (error) {
            this.logger.error(`Failed: ${entry.name} - ${error.message}`);
          }
        }
      }
    };

    await processDir(inboxPath);
    this.logger.info('Finished processing existing files');
  }

  /**
   * Stop watching
   */
  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.logger.info('Inbox watcher stopped');
    }
  }
}

module.exports = InboxWatcher;
