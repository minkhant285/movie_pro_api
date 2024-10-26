import multer from "multer";
import path from "path";
import multerS3 from 'multer-s3';
import { envData } from "./environment";
import { DeleteObjectCommand, DeleteObjectsCommand, ListObjectsV2Command, ObjectCannedACL, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Request } from 'express';
import fs from 'fs';
import { s3 } from "./ffmpeg";
import stream from 'stream';

export const uploadToLocal = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            let uploadPath;
            if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
                uploadPath = '/src/assets/images';
            } else if (file.mimetype === 'video/mp4' || file.mimetype === 'video/quicktime' || file.mimetype === 'video/mpeg') {
                uploadPath = '/src/assets/videos';
            } else if (file.mimetype === 'audio/mpeg') {
                uploadPath = '/src/assets/musics';
            } else {
                uploadPath = '/src/assets/files';
            }

            const fullPath = path.join(process.cwd(), uploadPath);

            // Check if directory exists, if not, create it
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
            }

            cb(null, fullPath);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    })
});


// export const uploadToLocal = multer({
//     storage: multer.diskStorage({
//         destination: function (req, file, cb) {
//             let uploadPath;
//             if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
//                 uploadPath = '/src/assets/images';
//             } else if (file.mimetype === 'video/mp4' || file.mimetype === 'video/quicktime' || file.mimetype === 'video/mpeg') {
//                 uploadPath = '/src/assets/videos';
//             }
//             else if (file.mimetype === 'audio/mpeg') {
//                 uploadPath = '/src/assets/musics';
//             } else {
//                 uploadPath = '/src/assets/files';
//             }
//             cb(null, `${process.cwd()}${uploadPath}`)
//         },
//         filename: function (req, file, cb) {
//             const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
//             cb(null, file.fieldname + '-' + uniqueSuffix + path.parse(file.originalname).ext)
//         }
//     })
// })

// export const uploadToS3 = multer({
//     storage: multerS3({
//         s3: new S3Client({
//             credentials: {
//                 accessKeyId: envData.aws_access_key_id,  // Use environment variables for security
//                 secretAccessKey: envData.aws_access_key
//             },
//             region: envData.aws_s3_region  // Example: 'us-east-1
//         }),
//         acl: 'public-read',
//         bucket: envData.aws_s3_bucket_name,  // The name of your S3 bucket
//         metadata: (req: Request, file: Express.Multer.File, cb) => {
//             cb(null, { fieldName: file.fieldname });
//         },
//         key: (req: Request, file: Express.Multer.File, cb) => {
//             // Define the key (filename in S3)
//             const fileExtension = path.extname(file.originalname);
//             const filename = `${Date.now().toString()}${fileExtension}`; // Unique filename
//             const key = `videos/${filename}`;
//             cb(null, key);
//         },

//     })
// });


export async function uploadToS3GeneratedHls(bucket: string, key: string, body: stream.Readable) {
    try {
        await s3.send(new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: body,
            ContentType: key.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/MP2T',
            ACL: 'public-read'
        }));
        console.log(`File uploaded successfully to ${bucket}/${key}`);
    } catch (err) {
        console.error("Error uploading file:", err);
        throw err;
    }
}

export async function deleteS3Object(bucketName: string, objectKey: string): Promise<void> {
    try {
        // Create the delete command with the bucket name and object key
        const deleteCommand = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: objectKey,
        });

        // Send the delete command
        await s3.send(deleteCommand);
        console.log(`Successfully deleted ${objectKey} from ${bucketName}`);
    } catch (error) {
        console.error("Error deleting object:", error);
    }
}

export async function deleteS3Folder(bucketName: string, folderKey: string): Promise<void> {
    try {
        // List all objects with the specified prefix
        const listCommand = new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: folderKey,
        });

        const listedObjects = await s3.send(listCommand);

        if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
            console.log("No objects found in folder.");
            return;
        }

        // Prepare delete command with all object keys
        const deleteCommand = new DeleteObjectsCommand({
            Bucket: bucketName,
            Delete: {
                Objects: listedObjects.Contents.map(({ Key }) => ({ Key })),
            },
        });

        // Send delete command
        await s3.send(deleteCommand);
        console.log(`Successfully deleted all objects in folder ${folderKey} from bucket ${bucketName}`);
    } catch (error) {
        console.error("Error deleting folder:", error);
    }
}