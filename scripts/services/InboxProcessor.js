/**
 * @fileoverview Processes inbox files and generates MDX documentation
 * @module services/InboxProcessor
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Only processes files to MDX
 * - Open/Closed: Extensible via file type handlers
 * - Interface Segregation: Each handler has minimal interface
 */

const fs = require('fs');
const path = require('path');
const { createLogger } = require('../utils/logger');
const { getFileTypeConfig } = require('../config/fileTypes');

/**
 * Processes files from inbox folder to MDX documentation
 */
class InboxProcessor {
  /**
   * @param {Object} config - Configuration object
   */
  constructor(config) {
    this.config = config;
    this.logger = createLogger();

    // File type handlers
    this.handlers = {
      '.py': this.processPython.bind(this),
      '.tex': this.processLatex.bind(this),
      '.pdf': this.processPdf.bind(this),
      '.m': this.processMatlab.bind(this),
      '.ipynb': this.processNotebook.bind(this),
      '.html': this.processHtml.bind(this),
      '.txt': this.processText.bind(this),
      '.md': this.processMarkdown.bind(this),
      '.rst': this.processRst.bind(this),
    };
  }

  /**
   * Process a file and generate MDX
   * @param {string} filePath - Path to input file
   * @param {string} outputDir - Output directory for MDX
   * @returns {Promise<string>} Path to generated MDX file
   */
  async processFile(filePath, outputDir) {
    const ext = path.extname(filePath).toLowerCase();
    const handler = this.handlers[ext];

    if (!handler) {
      throw new Error(`No handler for file type: ${ext}`);
    }

    const content = await handler(filePath);
    const outputPath = this.getOutputPath(filePath, outputDir);

    // Ensure output directory exists
    const outputDirPath = path.dirname(outputPath);
    if (!fs.existsSync(outputDirPath)) {
      fs.mkdirSync(outputDirPath, { recursive: true });
    }

    fs.writeFileSync(outputPath, content);
    return outputPath;
  }

  /**
   * Get output file path - includes extension type to avoid overwrites
   * @param {string} inputPath - Input file path
   * @param {string} outputDir - Output directory
   * @returns {string} Output MDX file path
   */
  getOutputPath(inputPath, outputDir) {
    const ext = path.extname(inputPath).toLowerCase().replace('.', '');
    const basename = path.basename(inputPath, path.extname(inputPath));
    const safeName = basename.replace(/[^a-zA-Z0-9_-]/g, '_');
    // Add extension suffix for PDF/TEX to avoid overwrites
    const suffix = ['pdf', 'tex'].includes(ext) ? `_${ext}` : '';
    return path.join(outputDir, `${safeName}${suffix}.mdx`);
  }

  /**
   * Generate frontmatter for MDX
   * @param {string} title - Document title
   * @param {Object} options - Additional frontmatter options
   * @returns {string} Frontmatter string
   */
  generateFrontmatter(title, options = {}) {
    const fm = {
      title,
      sidebar_label: options.sidebarLabel || title,
      ...options
    };

    const lines = ['---'];
    for (const [key, value] of Object.entries(fm)) {
      if (key === 'tags' && Array.isArray(value)) {
        lines.push(`tags: [${value.map(t => `"${t}"`).join(', ')}]`);
      } else {
        lines.push(`${key}: "${value}"`);
      }
    }
    lines.push('---');
    return lines.join('\n');
  }

  /**
   * Copy file to static folder and return static path
   * @param {string} filePath - Source file path
   * @returns {string} Static path for linking
   */
  copyToStatic(filePath) {
    const staticDir = this.config.staticDir || path.join(process.cwd(), 'docs', 'static', 'inbox');
    if (!fs.existsSync(staticDir)) {
      fs.mkdirSync(staticDir, { recursive: true });
    }

    const filename = path.basename(filePath);
    const destPath = path.join(staticDir, filename);
    fs.copyFileSync(filePath, destPath);

    return `/static/inbox/${filename}`;
  }

  /**
   * Process Python file
   * @param {string} filePath - Path to .py file
   * @returns {Promise<string>} MDX content
   */
  async processPython(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const filename = path.basename(filePath);
    const title = filename.replace('.py', '');
    const staticPath = this.copyToStatic(filePath);

    // Extract docstring
    const docstringMatch = content.match(/^(?:#[^\n]*\n)*\s*(?:from\s+__future__[^\n]*\n)*\s*(?:"""([\s\S]*?)"""|'''([\s\S]*?)''')/);
    const docstring = docstringMatch ? (docstringMatch[1] || docstringMatch[2] || '').trim() : '';

    // Extract imports
    const imports = content.split('\n')
      .filter(line => line.trim().startsWith('import ') || line.trim().startsWith('from '))
      .join('\n');

    // Extract functions and classes
    const functions = [...content.matchAll(/^def\s+(\w+)\s*\([^)]*\)/gm)].map(m => m[1]);
    const classes = [...content.matchAll(/^class\s+(\w+)/gm)].map(m => m[1]);

    const lineCount = content.split('\n').length;

    const frontmatter = this.generateFrontmatter(`${title} - Python Module`, {
      sidebarLabel: filename,
      tags: ['python', 'module']
    });

    return `${frontmatter}

# ${title}

<div style={{display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px'}}>
  <a href="${staticPath}" download="${filename}"
    style={{padding: '10px 20px', backgroundColor: '#10b981', color: 'white', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold'}}>
    Download .py
  </a>
  <a href="${staticPath}" target="_blank"
    style={{padding: '10px 20px', backgroundColor: '#3776ab', color: 'white', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold'}}>
    View Raw
  </a>
</div>

<div style={{display: 'flex', gap: '24px', marginBottom: '24px', flexWrap: 'wrap'}}>
  <div style={{padding: '12px 16px', backgroundColor: '#f3f4f6', borderRadius: '8px'}}>
    <div style={{fontSize: '24px', fontWeight: 'bold', color: '#3776ab'}}>${lineCount}</div>
    <div style={{fontSize: '12px', color: '#6b7280'}}>Lines</div>
  </div>
  <div style={{padding: '12px 16px', backgroundColor: '#f3f4f6', borderRadius: '8px'}}>
    <div style={{fontSize: '24px', fontWeight: 'bold', color: '#3776ab'}}>${classes.length}</div>
    <div style={{fontSize: '12px', color: '#6b7280'}}>Classes</div>
  </div>
  <div style={{padding: '12px 16px', backgroundColor: '#f3f4f6', borderRadius: '8px'}}>
    <div style={{fontSize: '24px', fontWeight: 'bold', color: '#3776ab'}}>${functions.length}</div>
    <div style={{fontSize: '12px', color: '#6b7280'}}>Functions</div>
  </div>
</div>

${docstring ? `## Description\n\n${docstring}\n\n` : ''}

${imports ? `## Dependencies\n\n\`\`\`python\n${imports}\n\`\`\`\n\n` : ''}

${classes.length > 0 ? `## Classes\n\n${classes.map(c => `- \`${c}\``).join('\n')}\n\n` : ''}

${functions.length > 0 ? `## Functions\n\n${functions.map(f => `- \`${f}()\``).join('\n')}\n\n` : ''}

## Source Code

\`\`\`python title="${filename}" showLineNumbers
${content}
\`\`\`
`;
  }

  /**
   * Clean LaTeX commands from text for use in MDX
   * @param {string} text - Text with LaTeX commands
   * @returns {string} Cleaned text
   */
  cleanLatexForMdx(text) {
    return text
      .replace(/\\textbf\{([^}]*)\}/g, '$1')  // Remove \textbf{}
      .replace(/\\textit\{([^}]*)\}/g, '$1')  // Remove \textit{}
      .replace(/\\emph\{([^}]*)\}/g, '$1')    // Remove \emph{}
      .replace(/\\texttt\{([^}]*)\}/g, '$1')  // Remove \texttt{}
      .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1') // Remove other commands
      .replace(/\\\\/g, '')                    // Remove line breaks
      .replace(/\\[a-zA-Z]+/g, '')             // Remove standalone commands
      .replace(/[{}]/g, '')                    // Remove remaining braces
      .trim();
  }

  /**
   * Process LaTeX file
   * @param {string} filePath - Path to .tex file
   * @returns {Promise<string>} MDX content
   */
  async processLatex(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const filename = path.basename(filePath);
    const title = filename.replace('.tex', '');
    const staticPath = this.copyToStatic(filePath);

    // Extract document title if present - handle nested braces
    const titleMatch = content.match(/\\title\{((?:[^{}]|\{[^{}]*\})*)\}/);
    const rawTitle = titleMatch ? titleMatch[1] : title;
    const docTitle = this.cleanLatexForMdx(rawTitle);

    // Extract author if present
    const authorMatch = content.match(/\\author\{([^}]+)\}/);
    const author = authorMatch ? this.cleanLatexForMdx(authorMatch[1]) : '';

    // Extract abstract if present
    const abstractMatch = content.match(/\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}/);
    const abstract = abstractMatch ? this.cleanLatexForMdx(abstractMatch[1]) : '';

    // Extract sections
    const sections = [...content.matchAll(/\\section\{([^}]+)\}/g)].map(m => this.cleanLatexForMdx(m[1]));

    const lineCount = content.split('\n').length;

    const frontmatter = this.generateFrontmatter(`${docTitle} - LaTeX Document`, {
      sidebarLabel: filename,
      tags: ['latex', 'document']
    });

    return `${frontmatter}

# ${docTitle}

<div style={{display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px'}}>
  <a href="${staticPath}" download="${filename}"
    style={{padding: '10px 20px', backgroundColor: '#10b981', color: 'white', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold'}}>
    Download .tex
  </a>
  <a href="${staticPath}" target="_blank"
    style={{padding: '10px 20px', backgroundColor: '#008080', color: 'white', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold'}}>
    View Raw
  </a>
</div>

<div style={{display: 'flex', gap: '24px', marginBottom: '24px', flexWrap: 'wrap'}}>
  <div style={{padding: '12px 16px', backgroundColor: '#f3f4f6', borderRadius: '8px'}}>
    <div style={{fontSize: '24px', fontWeight: 'bold', color: '#008080'}}>${lineCount}</div>
    <div style={{fontSize: '12px', color: '#6b7280'}}>Lines</div>
  </div>
  <div style={{padding: '12px 16px', backgroundColor: '#f3f4f6', borderRadius: '8px'}}>
    <div style={{fontSize: '24px', fontWeight: 'bold', color: '#008080'}}>${sections.length}</div>
    <div style={{fontSize: '12px', color: '#6b7280'}}>Sections</div>
  </div>
</div>

${author ? `**Author:** ${author}\n\n` : ''}

${abstract ? `## Abstract\n\n${abstract}\n\n` : ''}

${sections.length > 0 ? `## Sections\n\n${sections.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n` : ''}

## Source Code

\`\`\`latex title="${filename}" showLineNumbers
${content}
\`\`\`
`;
  }

  /**
   * Process PDF file
   * @param {string} filePath - Path to .pdf file
   * @returns {Promise<string>} MDX content
   */
  async processPdf(filePath) {
    const filename = path.basename(filePath);
    const title = filename.replace('.pdf', '');
    const staticPath = this.copyToStatic(filePath);

    // Get file stats
    const stats = fs.statSync(filePath);
    const sizeKB = Math.round(stats.size / 1024);

    const frontmatter = this.generateFrontmatter(`${title} - PDF`, {
      sidebarLabel: `${title} (PDF)`,
      tags: ['pdf', 'document']
    });

    return `${frontmatter}

# ${title} - PDF Document

<div style={{display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px'}}>
  <a href="${staticPath}" download="${filename}"
    style={{padding: '10px 20px', backgroundColor: '#10b981', color: 'white', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold'}}>
    📥 Download PDF
  </a>
  <a href="${staticPath}" target="_blank" rel="noopener noreferrer"
    style={{padding: '10px 20px', backgroundColor: '#dc2626', color: 'white', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold'}}>
    🔗 Open in New Tab
  </a>
</div>

<div style={{padding: '12px 16px', backgroundColor: '#f3f4f6', borderRadius: '8px', display: 'inline-block', marginBottom: '24px'}}>
  <div style={{fontSize: '14px', color: '#6b7280'}}>File Size: <strong>${sizeKB} KB</strong></div>
</div>

## PDF Preview

:::tip
If the preview doesn't load, use the **Open in New Tab** button above.
:::

<iframe
  src="${staticPath}"
  width="100%"
  height="900px"
  style={{
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  }}
  title="${title} PDF"
/>
`;
  }

  /**
   * Process MATLAB file
   * @param {string} filePath - Path to .m file
   * @returns {Promise<string>} MDX content
   */
  async processMatlab(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const filename = path.basename(filePath);
    const title = filename.replace('.m', '');
    const staticPath = this.copyToStatic(filePath);

    // Extract function signature
    const funcMatch = content.match(/^function\s+(?:\[?[\w,\s]+\]?\s*=\s*)?(\w+)\s*\([^)]*\)/m);
    const funcName = funcMatch ? funcMatch[1] : title;

    // Extract header comments
    const headerMatch = content.match(/^(%[^\n]*\n)+/);
    const headerComments = headerMatch ? headerMatch[0].replace(/^%\s*/gm, '').trim() : '';

    const lineCount = content.split('\n').length;

    const frontmatter = this.generateFrontmatter(`${title} - MATLAB`, {
      sidebarLabel: filename,
      tags: ['matlab', 'code']
    });

    return `${frontmatter}

# ${title}

<div style={{display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px'}}>
  <a href="${staticPath}" download="${filename}"
    style={{padding: '10px 20px', backgroundColor: '#10b981', color: 'white', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold'}}>
    Download .m
  </a>
  <a href="${staticPath}" target="_blank"
    style={{padding: '10px 20px', backgroundColor: '#0076a8', color: 'white', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold'}}>
    View Raw
  </a>
</div>

<div style={{padding: '12px 16px', backgroundColor: '#f3f4f6', borderRadius: '8px', display: 'inline-block', marginBottom: '24px'}}>
  <div style={{fontSize: '24px', fontWeight: 'bold', color: '#0076a8'}}>${lineCount}</div>
  <div style={{fontSize: '12px', color: '#6b7280'}}>Lines</div>
</div>

${headerComments ? `## Description\n\n${headerComments}\n\n` : ''}

## Source Code

\`\`\`matlab title="${filename}" showLineNumbers
${content}
\`\`\`
`;
  }

  /**
   * Process Jupyter Notebook
   * @param {string} filePath - Path to .ipynb file
   * @returns {Promise<string>} MDX content
   */
  async processNotebook(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const filename = path.basename(filePath);
    const title = filename.replace('.ipynb', '');
    const staticPath = this.copyToStatic(filePath);

    let notebook;
    try {
      notebook = JSON.parse(content);
    } catch (e) {
      throw new Error('Invalid notebook JSON');
    }

    const cellCount = notebook.cells ? notebook.cells.length : 0;
    const codeCells = notebook.cells ? notebook.cells.filter(c => c.cell_type === 'code').length : 0;
    const markdownCells = notebook.cells ? notebook.cells.filter(c => c.cell_type === 'markdown').length : 0;

    const frontmatter = this.generateFrontmatter(`${title} - Jupyter Notebook`, {
      sidebarLabel: filename,
      tags: ['jupyter', 'notebook', 'python']
    });

    // Extract cells content
    let cellsContent = '';
    if (notebook.cells) {
      notebook.cells.forEach((cell, i) => {
        const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
        if (cell.cell_type === 'markdown') {
          cellsContent += `\n${source}\n`;
        } else if (cell.cell_type === 'code') {
          cellsContent += `\n\`\`\`python\n${source}\n\`\`\`\n`;
        }
      });
    }

    return `${frontmatter}

# ${title}

<div style={{display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px'}}>
  <a href="${staticPath}" download="${filename}"
    style={{padding: '10px 20px', backgroundColor: '#10b981', color: 'white', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold'}}>
    Download Notebook
  </a>
</div>

<div style={{display: 'flex', gap: '24px', marginBottom: '24px', flexWrap: 'wrap'}}>
  <div style={{padding: '12px 16px', backgroundColor: '#f3f4f6', borderRadius: '8px'}}>
    <div style={{fontSize: '24px', fontWeight: 'bold', color: '#f37626'}}>${cellCount}</div>
    <div style={{fontSize: '12px', color: '#6b7280'}}>Total Cells</div>
  </div>
  <div style={{padding: '12px 16px', backgroundColor: '#f3f4f6', borderRadius: '8px'}}>
    <div style={{fontSize: '24px', fontWeight: 'bold', color: '#f37626'}}>${codeCells}</div>
    <div style={{fontSize: '12px', color: '#6b7280'}}>Code Cells</div>
  </div>
  <div style={{padding: '12px 16px', backgroundColor: '#f3f4f6', borderRadius: '8px'}}>
    <div style={{fontSize: '24px', fontWeight: 'bold', color: '#f37626'}}>${markdownCells}</div>
    <div style={{fontSize: '12px', color: '#6b7280'}}>Markdown Cells</div>
  </div>
</div>

## Notebook Contents

${cellsContent}
`;
  }

  /**
   * Process HTML file
   * @param {string} filePath - Path to .html file
   * @returns {Promise<string>} MDX content
   */
  async processHtml(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const filename = path.basename(filePath);
    const title = filename.replace('.html', '');
    const staticPath = this.copyToStatic(filePath);

    // Extract title from HTML
    const titleMatch = content.match(/<title>([^<]+)<\/title>/i);
    const htmlTitle = titleMatch ? titleMatch[1] : title;

    const lineCount = content.split('\n').length;

    const frontmatter = this.generateFrontmatter(`${htmlTitle} - HTML`, {
      sidebarLabel: filename,
      tags: ['html', 'web']
    });

    return `${frontmatter}

# ${htmlTitle}

<div style={{display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px'}}>
  <a href="${staticPath}" download="${filename}"
    style={{padding: '10px 20px', backgroundColor: '#10b981', color: 'white', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold'}}>
    Download HTML
  </a>
  <a href="${staticPath}" target="_blank"
    style={{padding: '10px 20px', backgroundColor: '#e34c26', color: 'white', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold'}}>
    Open in Browser
  </a>
</div>

<div style={{padding: '12px 16px', backgroundColor: '#f3f4f6', borderRadius: '8px', display: 'inline-block', marginBottom: '24px'}}>
  <div style={{fontSize: '24px', fontWeight: 'bold', color: '#e34c26'}}>${lineCount}</div>
  <div style={{fontSize: '12px', color: '#6b7280'}}>Lines</div>
</div>

## Preview

<iframe
  src="${staticPath}"
  width="100%"
  height="500px"
  style={{border: '1px solid #e5e7eb', borderRadius: '8px'}}
/>

## Source Code

\`\`\`html title="${filename}" showLineNumbers
${content}
\`\`\`
`;
  }

  /**
   * Process text file
   * @param {string} filePath - Path to .txt file
   * @returns {Promise<string>} MDX content
   */
  async processText(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const filename = path.basename(filePath);
    const title = filename.replace('.txt', '');
    const staticPath = this.copyToStatic(filePath);

    const lineCount = content.split('\n').length;
    const wordCount = content.split(/\s+/).filter(w => w).length;

    const frontmatter = this.generateFrontmatter(`${title} - Text File`, {
      sidebarLabel: filename,
      tags: ['text']
    });

    return `${frontmatter}

# ${title}

<div style={{display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px'}}>
  <a href="${staticPath}" download="${filename}"
    style={{padding: '10px 20px', backgroundColor: '#10b981', color: 'white', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold'}}>
    Download
  </a>
</div>

<div style={{display: 'flex', gap: '24px', marginBottom: '24px', flexWrap: 'wrap'}}>
  <div style={{padding: '12px 16px', backgroundColor: '#f3f4f6', borderRadius: '8px'}}>
    <div style={{fontSize: '24px', fontWeight: 'bold', color: '#6b7280'}}>${lineCount}</div>
    <div style={{fontSize: '12px', color: '#6b7280'}}>Lines</div>
  </div>
  <div style={{padding: '12px 16px', backgroundColor: '#f3f4f6', borderRadius: '8px'}}>
    <div style={{fontSize: '24px', fontWeight: 'bold', color: '#6b7280'}}>${wordCount}</div>
    <div style={{fontSize: '12px', color: '#6b7280'}}>Words</div>
  </div>
</div>

## Contents

\`\`\`text title="${filename}"
${content}
\`\`\`
`;
  }

  /**
   * Process Markdown file
   * @param {string} filePath - Path to .md file
   * @returns {Promise<string>} MDX content
   */
  async processMarkdown(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const filename = path.basename(filePath);
    const title = filename.replace('.md', '');
    const staticPath = this.copyToStatic(filePath);

    // Extract first heading as title
    const headingMatch = content.match(/^#\s+(.+)$/m);
    const mdTitle = headingMatch ? headingMatch[1] : title;

    const frontmatter = this.generateFrontmatter(mdTitle, {
      sidebarLabel: filename,
      tags: ['markdown', 'documentation']
    });

    // Remove first heading if we used it as title
    let processedContent = content;
    if (headingMatch) {
      processedContent = content.replace(/^#\s+.+\n/, '');
    }

    return `${frontmatter}

# ${mdTitle}

<div style={{marginBottom: '24px'}}>
  <a href="${staticPath}" download="${filename}"
    style={{padding: '10px 20px', backgroundColor: '#10b981', color: 'white', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold'}}>
    Download Original
  </a>
</div>

${processedContent}
`;
  }

  /**
   * Process reStructuredText file
   * @param {string} filePath - Path to .rst file
   * @returns {Promise<string>} MDX content
   */
  async processRst(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const filename = path.basename(filePath);
    const title = filename.replace('.rst', '');
    const staticPath = this.copyToStatic(filePath);

    // Try to extract title from RST
    const titleMatch = content.match(/^(.+)\n[=]+\n/m);
    const rstTitle = titleMatch ? titleMatch[1] : title;

    const lineCount = content.split('\n').length;

    const frontmatter = this.generateFrontmatter(`${rstTitle} - RST Document`, {
      sidebarLabel: filename,
      tags: ['rst', 'documentation']
    });

    return `${frontmatter}

# ${rstTitle}

<div style={{display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px'}}>
  <a href="${staticPath}" download="${filename}"
    style={{padding: '10px 20px', backgroundColor: '#10b981', color: 'white', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold'}}>
    Download .rst
  </a>
</div>

<div style={{padding: '12px 16px', backgroundColor: '#f3f4f6', borderRadius: '8px', display: 'inline-block', marginBottom: '24px'}}>
  <div style={{fontSize: '24px', fontWeight: 'bold', color: '#6b7280'}}>${lineCount}</div>
  <div style={{fontSize: '12px', color: '#6b7280'}}>Lines</div>
</div>

## Source

\`\`\`rst title="${filename}" showLineNumbers
${content}
\`\`\`
`;
  }
}

module.exports = InboxProcessor;
