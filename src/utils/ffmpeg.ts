import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import path from 'path';
import os from 'os';
import AWS from 'aws-sdk';
import { envData } from './environment';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
AWS.config.update({
    accessKeyId: envData.aws_access_key_id,
    secretAccessKey: envData.aws_access_key,
    region: envData.aws_s3_region,
});

export const s3 = new AWS.S3();


export async function generateThumbnailAndUploadToS3(
    videoUrl: string,
    s3Key: string,
    timestamp: string = '50%',
): Promise<{ s3Url: string; width: number; height: number }> {
    return new Promise((resolve, reject) => {
        // Create a temporary directory to store the thumbnail
        const tempDir = os.tmpdir();
        const thumbnailPath = path.join(tempDir, `${s3Key}.png`);

        // Extract video resolution and generate thumbnail
        ffmpeg(videoUrl)
            .ffprobe((err, metadata) => {
                if (err) {
                    return reject(err);
                }

                const width = metadata.streams[0].width as number;
                const height = metadata.streams[0].height as number;

                ffmpeg(videoUrl)
                    .screenshots({
                        timestamps: [timestamp],
                        size: `${width}x${height}`, // Use the video resolution
                        filename: path.basename(thumbnailPath),
                        folder: tempDir,
                    })
                    .on('end', async () => {
                        try {
                            // Read the generated thumbnail file into a buffer
                            const buffer = fs.readFileSync(thumbnailPath);

                            // Upload the buffer to S3
                            const params = {
                                Bucket: envData.aws_s3_bucket_name,
                                Key: `thumbnails/${s3Key}.png`,
                                Body: buffer,
                                ContentType: 'image/png',
                                ACL: 'public-read', // Optional: if you want the thumbnail to be publicly accessible
                            };

                            s3.upload(params, (err: any, data: any) => {
                                // Clean up the temporary file
                                fs.unlinkSync(thumbnailPath);

                                if (err) {
                                    reject(err);
                                } else {
                                    resolve({
                                        s3Url: data.Location,
                                        width: width,
                                        height: height,
                                    }); // Return the S3 URL and video resolution
                                }
                            });
                        } catch (err) {
                            reject(err);
                        }
                    })
                    .on('error', (err) => {
                        reject(err);
                    });
            });
    });
}
