import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
@Index(['provider', 'timestamp'])
@Index(['vrm', 'timestamp'])
export class ProviderLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  vrm: string;

  @Column({ type: 'int' })
  timestamp: number;

  @Column({ type: 'int' })
  requestDurationMs: number;

  @Column({ type: 'int' })
  responseCode: number;

  @Column({ type: 'varchar', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'varchar' })
  url: string;

  @Column({ type: 'varchar' })
  provider: string;
}
