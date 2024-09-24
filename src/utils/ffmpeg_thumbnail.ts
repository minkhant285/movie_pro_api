import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execPromise = promisify(exec);

async function runFFmpegCommand(command: string): Promise<string | void> {
    try {
        const { stdout, stderr } = await execPromise(command);
        console.log('stdout:', stdout);
        if (stderr) {
            console.error('stderr:', stderr);
        }
        return stdout;
    } catch (error) {
        console.error('Error executing command:', error);
    }
}


export async function generateThumbnail(videoUrl: string, timestamp: string = '00:00:05', thumbnailPath: string) {
    const command = `ffmpeg -ss ${timestamp} -i ${videoUrl}  -vframes 1 -an ${thumbnailPath}`;
    await runFFmpegCommand(command);
}


export async function getFFMpegVideoDuration(videoUrl: string): Promise<string> {
    const unixCommand = `ffmpeg -i ${videoUrl} 2>&1 | grep "Duration" | sed -n 's/.*Duration: \\([0-9]\\{2\\}:[0-9]\\{2\\}:[0-9]\\{2\\}\\).*/{ "Duraion": "\\1" }/p'`;
    const windowCommand = `for /f "tokens=2 delims= " %a in ('ffmpeg -i ${videoUrl} 2^>^&1 ^| findstr "Duration"') do @echo {"Duration": "%a"}`;

    // Determine OS and run the appropriate command
    const command = os.type() === 'Windows_NT' ? windowCommand : unixCommand;

    try {
        const { stdout } = await execPromise(command);
        console.log(stdout.trim())
        return stdout.trim();  // Return the output, trimmed to remove any extra whitespace
    } catch (error) {
        console.error('Error executing command:', error);
        throw error;
    }
}