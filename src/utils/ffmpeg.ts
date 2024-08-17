import ffmpeg from 'fluent-ffmpeg';
import path from 'path';

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
export async function generateThumbnail(videoPath: string, outputDir: string, thumbnailName: string, timestamp?: string): Promise<string> {
    const outputPath = path.join(outputDir, thumbnailName);
    const { width, height } = await getVideoResolution(videoPath);
    return new Promise((resolve, reject) => {

        ffmpeg(videoPath)
            .screenshots({
                timestamps: [timestamp ? timestamp : '50%'],  // Capture the frame at 50% of the video duration
                filename: `${thumbnailName}.png`,  // Output filename
                folder: outputDir,  // Output directory
                size: `${width}x${height}`,  // Thumbnail size
            })
            .on('end', () => {
                resolve(outputPath);
            })
            .on('error', (err) => {
                reject(err);
            });
    });
}

