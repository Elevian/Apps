#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('📁 Copying client build files to server directory...');

// Define paths
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
const serverDistPath = path.join(__dirname, '..', 'server', 'dist');
const serverClientPath = path.join(serverDistPath, 'client');

// Check if client dist exists
if (!fs.existsSync(clientDistPath)) {
  console.error('❌ Client dist directory not found:', clientDistPath);
  process.exit(1);
}

// Check if server dist exists
if (!fs.existsSync(serverDistPath)) {
  console.error('❌ Server dist directory not found:', serverDistPath);
  process.exit(1);
}

// Create server/client directory if it doesn't exist
if (!fs.existsSync(serverClientPath)) {
  fs.mkdirSync(serverClientPath, { recursive: true });
  console.log('📁 Created server/dist/client directory');
}

// Copy function
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  // Copy client files to server/dist/client
  copyDirectory(clientDistPath, serverClientPath);
  
  // Verify the copy was successful
  if (fs.existsSync(path.join(serverClientPath, 'index.html'))) {
    console.log('✅ Client files copied successfully to server/dist/client');
    
    // List the copied files
    const files = fs.readdirSync(serverClientPath);
    console.log('📁 Copied files:', files.join(', '));
    
    // Count total files
    function countFiles(dir) {
      let count = 0;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          count += countFiles(path.join(dir, entry.name));
        } else {
          count++;
        }
      }
      return count;
    }
    
    const totalFiles = countFiles(serverClientPath);
    console.log(`📊 Total files copied: ${totalFiles}`);
    
  } else {
    console.error('❌ Failed to copy client files - index.html not found');
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Error copying client files:', error.message);
  process.exit(1);
}

console.log('🎉 Client files copy completed successfully!');
