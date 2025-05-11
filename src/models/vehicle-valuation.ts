import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity()
@Index(['provider'])
export class VehicleValuation {
  @PrimaryColumn({ length: 7 })
  vrm: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  lowestValue: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  highestValue: number;

  @Column({ type: 'varchar', nullable: true })
  provider: string | null;

  get midpointValue(): number {
    return (this.highestValue + this.lowestValue) / 2;
  }
}
