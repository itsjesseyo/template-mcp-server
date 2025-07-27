#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory where the source files are stored
const __filename = fileURLToPath(import.meta.url);
const rootDir = path.join(path.dirname(__filename), '..');
const sourceDir = path.join(rootDir, 'src');

// Handle project name argument
const projectName = process.argv[2];
const targetDir = projectName ? path.resolve(projectName) : process.cwd();

// Check if the target directory is empty
const isDirectoryEmpty = () => {
  // If target directory doesn't exist, consider it "empty"
  if (!fs.existsSync(targetDir)) {
    return true;
  }
  const files = fs.readdirSync(targetDir);
  return files.length === 0 || (files.length === 1 && files[0] === '.git');
};

// Print a colorful message
const printColorMessage = (message, color) => {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
  };
  
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// Main function
async function main() {
  console.log('\n');
  printColorMessage('🚀 Creating a new MCP server project...', 'cyan');
  if (projectName) {
    console.log(`📁 Project name: ${projectName}`);
  }
  console.log('\n');

  // Create target directory if it doesn't exist and we have a project name
  if (projectName && !fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`📁 Created directory: ${targetDir}`);
  }

  // Check if the directory is empty
  if (!isDirectoryEmpty()) {
    printColorMessage('⚠️  The target directory is not empty!', 'yellow');
    console.log('To avoid overwriting existing files, please run this command with a different project name.');
    console.log('You can also run the command in an empty directory:');
    console.log('\n  mkdir my-mcp-server && cd my-mcp-server && npx @mcpdotdirect/create-mcp-server\n');
    process.exit(1);
  }

  // Check if source directory exists
  if (!fs.existsSync(sourceDir)) {
    printColorMessage('⚠️  Source directory not found!', 'red');
    console.log('This is likely an issue with the package installation.');
    console.log('Please report this issue at: https://github.com/mcpdotdirect/create-mcp-server/issues');
    process.exit(1);
  }

  try {
    // Copy source files to target directory
    copyFiles(sourceDir, path.join(targetDir, 'src'));
    
    // Copy other important files
    const filesToCopy = [
      '.gitignore',
      'tsconfig.json',
      'README.md'
    ];
    
    for (const file of filesToCopy) {
      const srcPath = path.join(rootDir, file);
      const destPath = path.join(targetDir, file);
      
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`📄 Created ${destPath}`);
      }
    }
    
    // Create a package.json for the new project
    createProjectPackageJson();
    
    printColorMessage('✅ Source files copied successfully!', 'green');
    
    printColorMessage('\n🎉 MCP server project created successfully!', 'green');
    console.log('\nNext steps:');
    if (projectName) {
      console.log(`  1. Navigate to your project directory:`);
      console.log(`     cd ${projectName}`);
      console.log('  2. Install dependencies:');
      console.log('     npm install');
      console.log('  3. Review the README.md file for usage instructions');
      console.log('  4. Run "npm start" or "npm run dev" to start the server');
    } else {
      console.log('  1. Install dependencies:');
      console.log('     npm install');
      console.log('  2. Review the README.md file for usage instructions');
      console.log('  3. Run "npm start" or "npm run dev" to start the server');
    }
    console.log('\nHappy coding! 🚀\n');
  } catch (error) {
    printColorMessage(`\n❌ Error creating MCP server project: ${error.message}`, 'red');
    console.log('Please report this issue at: https://github.com/mcpdotdirect/create-mcp-server/issues');
    process.exit(1);
  }
}

// Function to copy files recursively
function copyFiles(source, destination) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  // Read all files/folders in the source directory
  const entries = fs.readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    // Skip node_modules, package-lock.json, .git, and other unnecessary directories/files
    // This ensures we don't copy any lock files or node_modules, letting the user generate their own
    if (entry.name === 'node_modules' || 
        entry.name === 'package-lock.json' ||
        entry.name === 'npm-debug.log' ||
        entry.name === 'yarn.lock' ||
        entry.name === 'pnpm-lock.yaml' ||
        entry.name === 'bun.lock' ||
        entry.name === '.git' || 
        entry.name === 'bin' || 
        entry.name === '.cursor' || 
        entry.name === 'LICENSE' ||
        entry.name === 'build') {
      continue;
    }

    if (entry.isDirectory()) {
      // Recursively copy directories
      copyFiles(srcPath, destPath);
    } else {
      // Copy files
      fs.copyFileSync(srcPath, destPath);
      console.log(`📄 Created ${destPath}`);
    }
  }
}

// Create a package.json for the new project
function createProjectPackageJson() {
  const packageJsonPath = path.join(targetDir, 'package.json');
  
  const projectPackageJson = {
    name: "mcp-server",
    version: "1.0.0",
    description: "Model Context Protocol (MCP) Server",
    private: true,
    type: "module",
    main: "dist/index.js",
    scripts: {
      start: "node --loader ts-node/esm src/index.ts",
      "start:http": "node --loader ts-node/esm src/server/http-server.ts",
      build: "tsc",
      "build:http": "tsc src/server/http-server.ts --outDir dist",
      dev: "nodemon --watch src --ext ts,json --exec \"node --loader ts-node/esm src/index.ts\"",
      "dev:http": "nodemon --watch src --ext ts,json --exec \"node --loader ts-node/esm src/server/http-server.ts\"",
      inspector: "npx @modelcontextprotocol/inspector"
    },
    dependencies: {
      fastmcp: "^1.21.0",
      cors: "^2.8.5",
      zod: "^3.24.2"
    },
    peerDependencies: {
      typescript: "^5.8.2",
      "@valibot/to-json-schema": "^1.0.0",
      effect: "^3.14.4"
    },
    devDependencies: {
      "@types/node": "^20.11.0",
      "@types/cors": "^2.8.17",
      "ts-node": "^10.9.2",
      nodemon: "^3.0.3",
      typescript: "^5.8.2"
    }
  };

  
  fs.writeFileSync(
    packageJsonPath, 
    JSON.stringify(projectPackageJson, null, 2)
  );
  console.log(`📄 Created ${packageJsonPath}`);
}

// Run the main function
main().catch(error => {
  printColorMessage(`\n❌ Unexpected error: ${error.message}`, 'red');
  process.exit(1);
}); 