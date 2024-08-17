import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';
import { envData } from './environment';
import { PassThrough } from 'stream';

// Configure the AWS SDK with your access and secret key, and region
AWS.config.update({
    accessKeyId: envData.aws_access_key_id,
    secretAccessKey: envData.aws_access_key,
    region: envData.aws_s3_region,
});

export const s3 = new AWS.S3();

interface UploadParams {
    Bucket: string;
    Key: string;
    Body: PassThrough;
    ContentType?: string;
    acl: string;
}

export async function uploadFileToS3(file: PassThrough, key: string) {
    try {

        const uploadParams: UploadParams = {
            Bucket: envData.aws_s3_bucket_name,
            Key: key,
            Body: file,
            ContentType: 'image/png',  // Thumbnail content type
            acl: 'public-read',
        };

        const result = await s3.upload(uploadParams).promise();
        console.log(`File uploaded successfully at ${result.Location}`);
        return result.Location;
    } catch (error: any) {
        console.error('Error uploading file:', error);
        throw new Error(`Failed to upload file: ${error.message}`);
    }
}

// Helper function to get the content type based on the file extension
function getContentType(filePath: string): string {
    const extname = path.extname(filePath).toLowerCase();
    switch (extname) {
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.mp4':
            return 'video/mp4';
        case '.png':
            return 'image/png';
        case '.gif':
            return 'image/gif';
        case '.pdf':
            return 'application/pdf';
        default:
            return 'application/octet-stream';
    }
}

// Example usage
// (async () => {
//     const filePath = 'path/to/your/file.jpg';
//     const bucketName = 'your-s3-bucket-name';
//     const key = 'uploads/your-file-name.jpg';

//     try {
//         const s3Url = await uploadFileToS3(filePath, bucketName, key);
//         console.log(`File available at: ${s3Url}`);
//     } catch (error) {
//         console.error('File upload failed:', error);
//     }
// })();
