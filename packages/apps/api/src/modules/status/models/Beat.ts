import { BaseModel } from '@pollium/readable/database/models';
import { BeatSample } from '@modafinil/contracts/status/domain';
import { Entity, Column, Unique } from 'typeorm';

@Entity()
@Unique(['monitor', 'checkedAt'])
export default class Beat extends BaseModel{
    @Column({ type: 'varchar' })
    monitor!: string;

    @Column({ type: 'varchar' })
    state!: BeatSample;

    @Column({ type: Date })
    checkedAt!: Date;
}
