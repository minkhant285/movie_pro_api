import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { envData } from './environment';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'typeorm/platform/PlatformTools';
import tmp from 'tmp';

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

                const width = metadata.streams[0].width as number || 332;
                const height = metadata.streams[0].height as number || 640;

                ffmpeg(videoUrl)
                    .screenshots({
                        timestamps: [timestamp],
                        size: `?x1080`, // Use the video resolution
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
                                s3Url: `https://${envData.aws_s3_bucket_name}.s3.${envData.aws_s3_region}.amazonaws.com/thumbnails/${s3Key}.png`,
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

// Function to get video resolution
export const getVideoResolution = (readableStream: any): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
        // Create a temporary file
        tmp.file({ postfix: '.mp4' }, (err, tempFilePath, fd, cleanupCallback) => {
            if (err) {
                return reject(err);
            }

            // Convert the ReadableStream to a Node.js Readable stream
            const fileStream = streamFromReadableStream(readableStream);

            // Write the file to the temporary file path
            const writeStream = fs.createWriteStream(tempFilePath);
            fileStream.pipe(writeStream);

            writeStream.on('finish', () => {
                // Get the video resolution using ffmpeg
                ffmpeg.ffprobe(tempFilePath, (err, metadata) => {
                    cleanupCallback(); // Cleanup temporary file

                    if (err) {
                        return reject(err);
                    }

                    const videoStream = metadata.streams.find((stream: any) => stream.codec_type === 'video');

                    if (videoStream) {
                        resolve({
                            width: videoStream.width || 0,
                            height: videoStream.height || 0
                        });
                    } else {
                        reject(new Error('No video stream found.'));
                    }
                });
            });

            writeStream.on('error', (error) => {
                cleanupCallback(); // Cleanup temporary file
                reject(error);
            });
        });
    });
};
