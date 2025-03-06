import multer from "multer";

// It allows defining custom storage engines to control where and how files are saved.

const storage = multer.diskStorage({
  destination:function(req,file,cb){
    cb(null,'./public/temp') // cb ? - callback function
  },
  filename:function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix) // file name will be fieldname-timestamp
  }
})

export const upload = multer({storage:storage}) // storage is the key and storage is the value  ;