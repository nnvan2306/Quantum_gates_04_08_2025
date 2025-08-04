const express = require('express');
const app = express();
const path = require('path');

// Serve static files nếu cần (VD: css, js trong public hoặc Pages)
app.use(express.static(path.join(__dirname, 'Pages')));

// Route mặc định: khi vào http://localhost:5000 thì trả về file index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Pages', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
