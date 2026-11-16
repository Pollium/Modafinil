import { uuidv7 } from '../utils/uuidv7';
import { BaseEntity, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export default abstract class BaseModel extends BaseEntity{
    @PrimaryColumn({ type: 'uuid', default: () => 'uuidv7()' })
    id: string = uuidv7();

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
