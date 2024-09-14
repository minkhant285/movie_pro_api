import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function runFFmpegCommand(command: string): Promise<void> {
    try {
        const { stdout, stderr } = await execPromise(command);
        console.log('stdout:', stdout);
        console.error('stderr:', stderr);
    } catch (error) {
        console.error('Error executing command:', error);
    }
}

export async function generateThumbnail(videoUrl: string, timestamp: string, thumbnailPath: string) {
    const command = `ffmpeg -i ${videoUrl} -ss 00:00:10 -vframes 1 ${thumbnailPath}`;
    await runFFmpegCommand(command);
}
