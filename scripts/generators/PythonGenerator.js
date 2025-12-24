/**
 * @fileoverview Python page generator
 * @module generators/PythonGenerator
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Only generates Python documentation pages
 * - Open/Closed: Extends BaseGenerator without modifying it
 * - Liskov Substitution: Can be used anywhere BaseGenerator is expected
 * - Interface Segregation: Implements only required methods
 * - Dependency Inversion: Depends on abstract BaseGenerator
 */

const BaseGenerator = require('./BaseGenerator');
const { generateSidebarLabel } = require('../utils/helpers');

/**
 * Generator for Python (.py) file pages
 * Creates detailed documentation with syntax-highlighted source code
 * @extends BaseGenerator
 */
class PythonGenerator extends BaseGenerator {
  /**
   * @inheritdoc
   */
  getType() {
    return 'python';
  }

  /**
   * Extract module docstring from Python source
   * @param {string} content - Python source code
   * @returns {string} Module docstring or empty string
   * @private
   */
  extractDocstring(content) {
    if (!content) return '';

    // Match triple-quoted docstring at module level
    const docstringMatch = content.match(/^(?:#[^\n]*\n)*\s*(?:from\s+__future__[^\n]*\n)*\s*(?:"""([\s\S]*?)"""|'''([\s\S]*?)''')/);
    if (docstringMatch) {
      return (docstringMatch[1] || docstringMatch[2] || '').trim();
    }
    return '';
  }

  /**
   * Extract imports from Python source
   * @param {string} content - Python source code
   * @returns {string[]} Array of import statements
   * @private
   */
  extractImports(content) {
    if (!content) return [];

    const imports = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
        imports.push(trimmed);
      }
    }

    return imports;
  }

  /**
   * Extract class definitions from Python source
   * @param {string} content - Python source code
   * @returns {Array<{name: string, docstring: string}>} Array of class info
   * @private
   */
  extractClasses(content) {
    if (!content) return [];

    const classes = [];
    const classRegex = /^class\s+(\w+)(?:\([^)]*\))?:\s*(?:\n\s*(?:"""([\s\S]*?)"""|'''([\s\S]*?)'''))?/gm;

    let match;
    while ((match = classRegex.exec(content)) !== null) {
      classes.push({
        name: match[1],
        docstring: (match[2] || match[3] || '').trim()
      });
    }

    return classes;
  }

  /**
   * Extract function definitions from Python source
   * @param {string} content - Python source code
   * @returns {Array<{name: string, signature: string, docstring: string}>} Array of function info
   * @private
   */
  extractFunctions(content) {
    if (!content) return [];

    const functions = [];
    const funcRegex = /^def\s+(\w+)\s*\(([^)]*)\)(?:\s*->\s*[^:]+)?:\s*(?:\n\s*(?:"""([\s\S]*?)"""|'''([\s\S]*?)'''))?/gm;

    let match;
    while ((match = funcRegex.exec(content)) !== null) {
      functions.push({
        name: match[1],
        signature: `${match[1]}(${match[2]})`,
        docstring: (match[3] || match[4] || '').trim()
      });
    }

    return functions;
  }

  /**
   * Generate API reference section
   * @param {Array} classes - Extracted classes
   * @param {Array} functions - Extracted functions
   * @returns {string} MDX content for API reference
   * @private
   */
  generateApiReference(classes, functions) {
    let content = '';

    if (classes.length > 0) {
      content += `## Classes\n\n`;
      for (const cls of classes) {
        content += `### \`${cls.name}\`\n\n`;
        if (cls.docstring) {
          content += `${cls.docstring}\n\n`;
        }
      }
    }

    if (functions.length > 0) {
      content += `## Functions\n\n`;
      for (const func of functions) {
        content += `### \`${func.signature}\`\n\n`;
        if (func.docstring) {
          // Format docstring - handle Args, Returns, etc.
          const formattedDoc = func.docstring
            .replace(/^(\s*)(Args|Arguments|Parameters|Returns|Raises|Example|Examples|Note|Notes):/gm, '\n**$2:**')
            .replace(/^\s{4,}/gm, '  ');
          content += `${formattedDoc}\n\n`;
        }
      }
    }

    return content;
  }

  /**
   * Generate Python detail page
   * @param {Object} programInfo - Program information
   * @param {Object} fileData - File data
   * @param {string} fileData.filename - Filename
   * @param {string} fileData.staticPath - Path to static file
   * @param {string} fileData.content - File content
   * @param {Object} fileData.config - File type config
   * @returns {string} MDX page content
   */
  generate(programInfo, fileData) {
    const { displayName, programId, chapterNum } = programInfo;
    const { filename, staticPath, content, config } = fileData;

    const sidebarLabel = generateSidebarLabel(programId, chapterNum, 'python');
    const frontmatter = this.generateFrontmatter(
      `${displayName} - Python`,
      sidebarLabel
    );

    // Extract documentation from source
    const docstring = this.extractDocstring(content);
    const imports = this.extractImports(content);
    const classes = this.extractClasses(content);
    const functions = this.extractFunctions(content);

    // Generate buttons
    const buttons = `<div style={{display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px'}}>
  <a href="${staticPath}" download="${filename}"
    style={{padding: '10px 20px', backgroundColor: '#10b981', color: 'white', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold'}}>
    📥 Download .py
  </a>
  <a href="${staticPath}" target="_blank" rel="noopener noreferrer"
    style={{padding: '10px 20px', backgroundColor: '#3776ab', color: 'white', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold'}}>
    🔗 Open Raw
  </a>
</div>`;

    // Module description section
    let descriptionSection = '';
    if (docstring) {
      descriptionSection = `## Description\n\n${docstring}\n\n`;
    }

    // Dependencies section
    let dependenciesSection = '';
    if (imports.length > 0) {
      dependenciesSection = `## Dependencies\n\n\`\`\`python\n${imports.join('\n')}\n\`\`\`\n\n`;
    }

    // API Reference
    const apiReference = this.generateApiReference(classes, functions);

    // Source code section
    const codeBlock = `## Source Code

\`\`\`python title="${filename}" showLineNumbers
${content || '# Unable to read file'}
\`\`\``;

    const backLink = this.generateBackLink(displayName);

    // Calculate stats
    const lineCount = content ? content.split('\n').length : 0;
    const classCount = classes.length;
    const funcCount = functions.length;

    const statsSection = `
<div style={{display: 'flex', gap: '24px', marginBottom: '24px', flexWrap: 'wrap'}}>
  <div style={{padding: '12px 16px', backgroundColor: '#f3f4f6', borderRadius: '8px'}}>
    <div style={{fontSize: '24px', fontWeight: 'bold', color: '#3776ab'}}>${lineCount}</div>
    <div style={{fontSize: '12px', color: '#6b7280'}}>Lines of Code</div>
  </div>
  <div style={{padding: '12px 16px', backgroundColor: '#f3f4f6', borderRadius: '8px'}}>
    <div style={{fontSize: '24px', fontWeight: 'bold', color: '#3776ab'}}>${classCount}</div>
    <div style={{fontSize: '12px', color: '#6b7280'}}>Classes</div>
  </div>
  <div style={{padding: '12px 16px', backgroundColor: '#f3f4f6', borderRadius: '8px'}}>
    <div style={{fontSize: '24px', fontWeight: 'bold', color: '#3776ab'}}>${funcCount}</div>
    <div style={{fontSize: '12px', color: '#6b7280'}}>Functions</div>
  </div>
</div>`;

    return `${frontmatter}

# ${displayName} - Python Module

${buttons}

${statsSection}

${descriptionSection}${dependenciesSection}${apiReference}
${codeBlock}

${backLink}
`;
  }
}

module.exports = PythonGenerator;
