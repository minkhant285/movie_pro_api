import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { Category } from '../category/category.entity';

@Entity()
export class Movie {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    caption: string;

    @Column()
    description: string;

    @Column({ type: 'varchar', nullable: false })
    url: string;

    @Column({ default: 0 })
    likes: number;

    @Column({ default: 0 })
    view_count: number;


    @Column({ nullable: true })
    thumbnail_url?: string;

    @ManyToMany(() => Category, (c) => c.movies, { cascade: true })
    @JoinTable()
    categories: Category[];

    @ManyToMany(() => User, user => user.favourites)
    favourites: User[];

    @CreateDateColumn({ default: () => 'CURRENT_TIMESTAMP', type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ default: () => 'CURRENT_TIMESTAMP', type: 'timestamp' })
    updated_at: Date;
}
