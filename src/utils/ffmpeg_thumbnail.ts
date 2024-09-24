import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execPromise = promisify(exec);

async function runFFmpegCommand(command: string): Promise<string | void> {
    try {
        const { stdout, stderr } = await execPromise(command);
        // console.log('stdout:', stdout);
        if (stderr) {
            console.error('stderr:', stderr);
        }
        return stdout;
    } catch (error) {
        console.error('Error executing command:', error);
    }
}

export async function getFFMpegVideoDuration(videoUrl: string): Promise<string> {
    const unixCommand = `ffmpeg -i ${videoUrl} 2>&1 | grep "Duration" | awk '{print "{\"Duration\": \"" $2 "\"}"}'`;
    const windowCommand = `for /f "tokens=2 delims= " %a in ('ffmpeg -i ${videoUrl} 2^>^&1 ^| findstr "Duration"') do @echo {"Duration": "%a"}`;
    if (os.type() === 'Windows_NT') {
        return await runFFmpegCommand(windowCommand) as string;
    }
    return await runFFmpegCommand(unixCommand) as string;

}

export async function generateThumbnail(videoUrl: string, timestamp: string = '00:00:05', thumbnailPath: string) {
    const command = `ffmpeg -ss ${timestamp} -i ${videoUrl}  -vframes 1 -an ${thumbnailPath}`;
    await runFFmpegCommand(command);
}
