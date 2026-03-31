import { Document } from 'mongoose';
import { MoveType } from '../../libs/';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true, versionKey: false })
export class ProblemSnapshot {
  @Prop({ required: true, type: String })
  userId: string;

  @Prop({ required: true, type: String })
  problemId: string;

  @Prop({ required: true, type: Array<MoveType> })
  moves: MoveType[];

  @Prop({ required: true, type: String })
  finalFen: string;

  @Prop({ required: true, type: String })
  theme: string;

  @Prop({ required: true, type: String })
  level: string;

  @Prop({ required: true, type: Date })
  solevedAt: Date;

  @Prop({ required: true, type: Number })
  durationMs: number;
}

export type ProblemSnapshotDocument = ProblemSnapshot & Document;

export const ProblemSnapshotSchema =
  SchemaFactory.createForClass(ProblemSnapshot);
