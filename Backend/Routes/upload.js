// ✅ ĐÚNG: export một router
const express = require("express");
const router = express.Router();
const upload = require("../utils/multer");
const User = require("../Models/User");
const { updateAvatar } = require("../Controllers/AdminController");

router.post("/image", upload.single("image"), async (req, res) => {
    console.log("run>>>>>");
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const userId = req.query.userId || req.body.userId;
    if (!userId) return res.status(400).json({ message: "User ID is required" });
    await updateAvatar(userId, req.file.filename)

    res.json({
        message: "Upload thành công",
        filename: req.file.filename,
        path: `/uploads/${req.file.filename}`,
    });
});

module.exports = router;
