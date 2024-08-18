import multer from "multer";
import path from "path";
import multerS3 from 'multer-s3';
import { envData } from "./environment";
import { S3Client } from '@aws-sdk/client-s3';
import { Request } from 'express';

export const uploadToLocal = multer({
    storage: multer.diskStorage({
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
})

export const uploadToS3 = multer({
    storage: multerS3({
        s3: new S3Client({
            credentials: {
                accessKeyId: envData.aws_access_key_id,  // Use environment variables for security
                secretAccessKey: envData.aws_access_key
            },
            region: envData.aws_s3_region  // Example: 'us-east-1
        }),
        acl: 'public-read',
        bucket: envData.aws_s3_bucket_name,  // The name of your S3 bucket
        metadata: (req: Request, file: Express.Multer.File, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req: Request, file: Express.Multer.File, cb) => {
            // Define the key (filename in S3)
            const fileExtension = path.extname(file.originalname);
            const filename = `${Date.now().toString()}${fileExtension}`; // Unique filename
            const key = `videos/${filename}`;
            cb(null, key);
        },

    })
});