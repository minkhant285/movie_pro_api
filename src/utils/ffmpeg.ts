import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { envData } from './environment';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

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
    timestamp: string = '10%',
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



                            s3.send(new PutObjectCommand({
                                Bucket: envData.aws_s3_bucket_name,
                                Key: `thumbnails/${s3Key}.png`,
                                Body: buffer,
                                ContentType: 'image/png',
                                ACL: 'public-read'
                            }),
                                // (err: any, data: any) => {
                                //     // Clean up the temporary file
                                //     fs.unlinkSync(thumbnailPath);

                                //     if (err) {
                                //         reject(err);
                                //     } else {
                                //         resolve({
                                //             s3Url: data.Location,
                                //             width: width,
                                //             height: height,
                                //         }); // Return the S3 URL and video resolution
                                //     }
                                // }
                            );

                            const command = new GetObjectCommand({
                                Bucket: envData.aws_s3_bucket_name,
                                Key: `thumbnails/${s3Key}.png`
                            })

                            const s3Url = await getSignedUrl(s3, command, { expiresIn: 36000 });
                            fs.unlinkSync(thumbnailPath);

                            resolve({
                                s3Url: s3Url,
                                width: width,
                                height: height,
                            }); //
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
