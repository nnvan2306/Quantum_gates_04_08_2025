const fs = require('fs');
const path = require('path');

// Paths
const pagesDir = path.join(__dirname, 'Pages');
const componentsDir = path.join(__dirname, 'components');
const cssDir = path.join(__dirname, 'css');
const jsDir = path.join(__dirname, 'js');

// Read component files
const headerContent = fs.readFileSync(path.join(componentsDir, 'header.html'), 'utf8');
const footerContent = fs.readFileSync(path.join(componentsDir, 'footer.html'), 'utf8');

// Function to update an HTML file
function updateHtmlFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if already updated (contains our marker)
    if (content.includes('<!-- UPDATED_WITH_SHARED_COMPONENTS -->')) {
      console.log(`Skipping already updated file: ${filePath}`);
      return;
    }
    
    // 1. Update DOCTYPE and HTML tag
    content = content.replace(/<!DOCTYPE[^>]*>\s*<html[^>]*>/, 
      `<!DOCTYPE html>
<html lang="vi" class="h-full">`);
    
    // 2. Update head section
    const headContent = `
  <head>
    <meta charset="UTF-8" />
    <title>${getPageTitle(content) || 'QUANTUM GATES'}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Nền tảng giáo dục về tính toán lượng tử và cổng lượng tử">
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" href="../images/favicon.png">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Shared CSS -->
    <link rel="stylesheet" href="../css/shared.css">
    
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- AOS Animation -->
    <link href="https://unpkg.com/aos@2.3.4/dist/aos.css" rel="stylesheet">
  `;
    
    content = content.replace(/<head[^>]*>([\s\S]*?)<\/head>/, headContent);
    
    // 3. Update body class and add header
    content = content.replace(/<body[^>]*>/, 
      `<body class="bg-gray-50 text-gray-900 min-h-screen flex flex-col">
  <!-- UPDATED_WITH_SHARED_COMPONENTS -->
  ${headerContent}
  
  <!-- Main Content -->
  <main class="flex-grow">`);
    
    // 4. Add footer before closing body
    if (!content.includes('</footer>')) {
      content = content.replace(/<\/body>/, `
  </main>
  
  ${footerContent}
  
  <!-- Shared JavaScript -->
  <script src="../js/shared.js"></script>
  
  <!-- AOS Initialization -->
  <script src="https://unpkg.com/aos@2.3.4/dist/aos.js"></script>
  <script>
    AOS.init({
      once: true,
      duration: 600
    });
  </script>
  
  <!-- Page-specific scripts -->
  <script src="../js/${path.basename(filePath, '.html')}.js"></script>
</body>`);
    }
    
    // Save the updated file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
    
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
  }
}

// Helper function to extract page title
function getPageTitle(content) {
  const titleMatch = content.match(/<title>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : '';
}

// Process all HTML files in the Pages directory
function updateAllPages() {
  try {
    const files = fs.readdirSync(pagesDir);
    
    files.forEach(file => {
      if (file.endsWith('.html')) {
        updateHtmlFile(path.join(pagesDir, file));
      }
    });
    
    console.log('\nUpdate complete! All pages have been updated with shared components and styles.');
    
  } catch (error) {
    console.error('Error updating pages:', error);
  }
}

// Run the update
updateAllPages();
