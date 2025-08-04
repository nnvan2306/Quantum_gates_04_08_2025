const fs = require('fs');
const path = require('path');

// Directory containing HTML files
const pagesDir = path.join(__dirname, 'Pages');

// Navigation template with BaiViet link
const navigationTemplate = `
      <a href="index.html" class="hover:underline">Trang chủ</a>
      <a href="Congluongtu.html" class="hover:underline">Cổng lượng tử</a>
      <a href="BaiViet.html" class="hover:underline">Bài viết</a>
      <a href="HoatDong.html" class="hover:underline">Hoạt động</a>
      <a href="Sukien.html" class="hover:underline">Sự kiện</a>
      <a href="LienHe.html" class="hover:underline">Liên hệ</a>
      <a href="HoiVien.html" class="hover:underline">Hội viên</a>`;

// Pattern to find the navigation section
const navPattern = /<nav[^>]*>([\s\S]*?)<\/nav>/i;

// Function to update navigation in a file
function updateFileNavigation(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if already contains BaiViet link
    if (content.includes('href="BaiViet.html"')) {
      console.log(`Skipping ${filePath} - already has BaiViet link`);
      return;
    }
    
    // Update navigation
    const updatedContent = content.replace(
      /<nav[^>]*>([\s\S]*?)<\/nav>/i,
      `<nav class="space-x-6 text-sm">${navigationTemplate}</nav>`
    );
    
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log(`Updated navigation in ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Process all HTML files in the Pages directory
fs.readdir(pagesDir, (err, files) => {
  if (err) {
    console.error('Error reading Pages directory:', err);
    return;
  }
  
  files.forEach(file => {
    if (file.endsWith('.html')) {
      updateFileNavigation(path.join(pagesDir, file));
    }
  });
  
  console.log('Navigation update complete!');
});
