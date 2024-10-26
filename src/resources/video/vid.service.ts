import { Repository } from "typeorm";
import { Movie } from "./vid.entity";
import { AppDataSource, envData, uploadToS3GeneratedHls } from "../../utils";
import { MovieCreateProp } from "./vid.controller";
// import { Category } from "../category/category.entity";
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import stream from 'stream';


export class VideoService {
    private movieRepo: Repository<Movie>;


    constructor() {
        // this.userRepo = AppDataSource.getRepository(User);
        // this.cateogryRepo = AppDataSource.getRepository(Category);
        this.movieRepo = AppDataSource.getRepository(Movie);
    }


    saveVideo = async (movieBody: MovieCreateProp) => {
        const created = await this.movieRepo.save(movieBody);
        return created;
    }

    addViewCount = async (mv_id: string) => {
        const movie = await this.movieRepo.findOne({ where: { id: mv_id } });
        if (movie) {
            await this.movieRepo.update(mv_id, { view_count: movie.view_count + 5 })
        }
        return movie?.view_count;
    }



    getVideosByPage = async (page: number, limit: number, filter_name?: string) => {
        page = page ? page : 1;
        limit = limit ? limit : 20;
        const skip = (page - 1) * limit;
        let movies, total;
        if (filter_name) {
            const res = await this.movieRepo
                .createQueryBuilder('movie')
                .leftJoinAndSelect('movie.categories', 'category')
                .leftJoinAndSelect('movie.created_user', 'created_user')
                .where('LOWER(category.name) LIKE LOWER(:filter_name)', { filter_name: `${filter_name}` })
                .orderBy('movie.created_at', 'DESC')
                .skip(skip)
                .take(limit)
                .getManyAndCount();
            movies = res[0];
            total = res[1];

        } else {
            const res = await this.movieRepo.findAndCount({
                relations: { categories: true, created_user: true },
                take: limit, skip,
                order: {
                    created_at: 'DESC'
                }
            });
            movies = res[0];
            total = res[1];
        }
        return { movies, total, page, limit };

    };

    checkMovieNameExist = async (name: string) => {
        const movieCheck = await this.movieRepo.findOne({ where: { name } });
        return movieCheck;
    }

    // https://bluemoviepro.s3.ap-southeast-1.amazonaws.com/videos/1729055248848.mp4

    private cleanUpTempFiles(dir: string) {
        fs.rmdirSync(dir, { recursive: true });
        console.log(`Temporary files cleaned up from: ${dir}`);
    }

    async generateHLSAndUpload(inputVideoPath: string, bucketName: string): Promise<void> {
        const baseFileName = path.basename(inputVideoPath, path.extname(inputVideoPath));
        const outputDir = path.join('/tmp', baseFileName); // Use a temporary directory for the files

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        return new Promise((resolve, reject) => {
            const ffmpeg = spawn('ffmpeg', [
                '-i', inputVideoPath,                             // Input video path
                '-codec', 'copy',                                 // Copy codec without re-encoding
                '-start_number', '0',                             // Start segment numbering at 0
                '-hls_time', '10',                                // Segment length in seconds
                '-hls_list_size', '0',                            // Unlimited playlist entries
                '-f', 'hls',                                      // Output format as HLS
                '-hls_segment_filename', path.join(outputDir, `${baseFileName}_%03d.ts`), // Segment file names
                path.join(outputDir, `${baseFileName}.m3u8`)      // Playlist file name
            ]);

            ffmpeg.stderr.on('data', (data) => console.error(`stderr: ${data}`));

            ffmpeg.on('close', async (code) => {
                if (code === 0) {
                    console.log('HLS generation completed successfully.');

                    try {
                        // Upload the .m3u8 playlist file
                        const m3u8FilePath = path.join(outputDir, `${baseFileName}.m3u8`);
                        await uploadToS3GeneratedHls(bucketName, `hls/${baseFileName}/${baseFileName}.m3u8`, fs.createReadStream(m3u8FilePath));

                        // Upload each .ts segment file
                        const segmentFiles = fs.readdirSync(outputDir).filter(file => file.endsWith('.ts'));

                        for (const segmentFile of segmentFiles) {
                            const segmentFilePath = path.join(outputDir, segmentFile);
                            await uploadToS3GeneratedHls(bucketName, `hls/${baseFileName}/${segmentFile}`, fs.createReadStream(segmentFilePath));
                        }

                        // Clean up temporary files
                        this.cleanUpTempFiles(outputDir);
                        resolve();
                    } catch (err: any) {
                        // Clean up if upload fails
                        this.cleanUpTempFiles(outputDir);
                        reject(new Error(`Error uploading to S3: ${err.message}`));
                    }
                } else {
                    // Clean up if ffmpeg process fails
                    this.cleanUpTempFiles(outputDir);
                    reject(new Error(`FFmpeg process exited with code ${code}`));
                }
            });
        });
    }

}