import multer from "multer";

// It allows defining custom storage engines to control where and how files are saved.

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log("--> multer -->");
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

export const upload = multer({ storage });
