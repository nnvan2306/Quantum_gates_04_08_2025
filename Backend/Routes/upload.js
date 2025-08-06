// ✅ ĐÚNG: export một router
const express = require("express");
const router = express.Router();
const upload = require("../utils/multer");

router.post("/image", upload.single("image"), (req, res) => {
    console.log("run>>>>>");
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    res.json({
        message: "Upload thành công",
        filename: req.file.filename,
        path: `/uploads/${req.file.filename}`,
    });
});

module.exports = router;
