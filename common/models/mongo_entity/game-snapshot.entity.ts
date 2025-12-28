/**
 * @This Schema need to be completed
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class GameSnapshot {
  @Prop({ required: true, type: String })
  fen: string;
}

export type GameSnapshotDocument = GameSnapshot & Document;

export const GameSnapshotSchema = SchemaFactory.createForClass(GameSnapshot);
