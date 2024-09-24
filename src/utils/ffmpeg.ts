import fs from 'fs';
import path from 'path';
import os from 'os';
import { envData } from './environment';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { Readable } from 'typeorm/platform/PlatformTools';
import tmp from 'tmp';
import { generateThumbnail } from './ffmpeg_thumbnail';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const s3 = new S3Client({
    region: envData.aws_s3_region,
    credentials: {
        accessKeyId: envData.aws_access_key_id,
        secretAccessKey: envData.aws_access_key,
    }
})


export async function generateThumbnailAndUploadToS3(
    videoUrl: string,
    s3Key: string,
    timestamp: string = '00:00:05',
): Promise<{ s3Url: string; }> {
    const tempDir = os.tmpdir();
    const thumbnailPath = path.join(tempDir, `${s3Key}.png`);
    await generateThumbnail(videoUrl, timestamp, thumbnailPath)
    return new Promise(async (resolve, reject) => {
        // Create a temporary directory to store the thumbnail
        try {
            // Read the generated thumbnail file into a buffer
            const buffer = fs.readFileSync(thumbnailPath);

            await s3.send(new PutObjectCommand({
                Bucket: envData.aws_s3_bucket_name,
                Key: `thumbnails/${s3Key}.png`,
                Body: buffer,
                ContentType: 'image/png',
                ACL: 'public-read'
            })

            );

            fs.unlinkSync(thumbnailPath);

            resolve({
                s3Url: `https://${envData.aws_s3_bucket_name}.s3.${envData.aws_s3_region}.amazonaws.com/thumbnails/${s3Key}.png`
            });
        } catch (err) {
            console.log("big trouble in capturing", err);
            reject(err);
        }
    });
}

export const streamFromReadableStream = (readableStream: ReadableStream<Uint8Array>): Readable => {
    const { PassThrough } = require('stream');
    const nodeStream = new PassThrough();

    const reader = readableStream.getReader();
    const pump = () => {
        reader.read().then(({ done, value }) => {
            if (done) {
                nodeStream.end();
                return;
            }
            nodeStream.write(Buffer.from(value));
            pump();
        }).catch(err => {
            nodeStream.destroy(err);
        });
    };

    pump();
    return nodeStream;
};

export const generateS3FileDownloadLink = async (key: string) => {
    const command = new GetObjectCommand({
        Bucket: envData.aws_s3_bucket_name, // Replace with your S3 bucket name
        Key: `videos/${key}`
    });
    try {
        // Generate a pre-signed URL that expires in 60 seconds
        const url = await getSignedUrl(s3, command, { expiresIn: 600 });
        return url;
    } catch (error) {
        return "Error generating pre-signed URL";
    }

}



// Function to get video resolution
// export const getVideoResolution = (readableStream: any): Promise<{ width: number; height: number }> => {
//     return new Promise((resolve, reject) => {
//         // Create a temporary file
//         tmp.file({ postfix: '.mp4' }, (err, tempFilePath, fd, cleanupCallback) => {
//             if (err) {
//                 return reject(err);
//             }

//             // Convert the ReadableStream to a Node.js Readable stream
//             const fileStream = streamFromReadableStream(readableStream);

//             // Write the file to the temporary file path
//             const writeStream = fs.createWriteStream(tempFilePath);
//             fileStream.pipe(writeStream);

//             writeStream.on('finish', () => {
//                 // Get the video resolution using ffmpeg
//                 ffmpeg.ffprobe(tempFilePath, (err, metadata) => {
//                     cleanupCallback(); // Cleanup temporary file

//                     if (err) {
//                         return reject(err);
//                     }

//                     const videoStream = metadata.streams.find((stream: any) => stream.codec_type === 'video');

//                     if (videoStream) {
//                         resolve({
//                             width: videoStream.width || 0,
//                             height: videoStream.height || 0
//                         });
//                     } else {
//                         reject(new Error('No video stream found.'));
//                     }
//                 });
//             });

//             writeStream.on('error', (error) => {
//                 cleanupCallback(); // Cleanup temporary file
//                 reject(error);
//             });
//         });
//     });
// };
