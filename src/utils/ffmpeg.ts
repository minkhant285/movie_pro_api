import { S3 } from 'aws-sdk';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { PassThrough } from 'stream';
import { envData } from './environment';
import AWS from 'aws-sdk';
AWS.config.update({
    accessKeyId: envData.aws_access_key_id,
    secretAccessKey: envData.aws_access_key,
    region: envData.aws_s3_region,
});

export const s3 = new AWS.S3();
async function getVideoResolution(videoPath: string): Promise<{ width: number, height: number }> {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(videoPath, (err, metadata) => {
            if (err) {
                return reject(err);
            }
            const { width, height } = metadata.streams[0];
            resolve({ width: width as number, height: height as number });
        });
    });
}

// Function to generate thumbnail
export async function generateThumbnail(videoPath: any, thumbnailName: string, timestamp?: string): Promise<string> {
    const outputPath = path.join(__dirname, '../../src/assets/images', thumbnailName);
    // const { width, height } = await getVideoResolution(videoPath);
    return new Promise((resolve, reject) => {
        const buffers: Buffer[] = [];

        const command = ffmpeg(videoPath)
            .screenshots({
                timestamps: [timestamp ? timestamp : '50%'],  // Capture the frame at 50% of the video duration
                filename: `${thumbnailName}.png`,  // Output filename
                folder: outputPath,  // Output directory
                // size: `${width}x${height}`,  // Thumbnail size
            }).on('error', (err) => {
                reject(err);
            });

        command.on('end', () => {
            const buffer = Buffer.concat(buffers);
            return s3.upload(
                {
                    Bucket: envData.aws_s3_bucket_name,
                    Key: 'thumbnails/g.png',
                    Body: buffer,
                    ACL: 'public-read',
                },
                (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data.Location); // Return the URL of the uploaded thumbnail
                    }
                }
            )
        })

    });
}
