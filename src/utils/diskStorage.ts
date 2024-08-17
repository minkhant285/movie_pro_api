import multer from "multer";
import path from "path";


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath;
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            uploadPath = '/src/assets/images';
        } else if (file.mimetype === 'video/mp4' || file.mimetype === 'video/mpeg') {
            uploadPath = '/src/assets/videos';
        }
        else if (file.mimetype === 'audio/mpeg') {
            uploadPath = '/src/assets/musics';
        } else {
            uploadPath = '/src/assets/files';
        }
        cb(null, `${process.cwd()}${uploadPath}`)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + path.parse(file.originalname).ext)
    }
})

export const upload = multer({ storage: storage })