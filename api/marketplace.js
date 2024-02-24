const express = require('express');
const marketplaceController = require('./marketplace/index.js');

const router = express.Router();

const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/temp/');
    },
    filename: async function (req, file, cb) {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage });


router.post("/uploadContract", upload.single('content'), marketplaceController.submitContract);

module.exports = router;