/**
 * @This Schema need to be completed
 */

import { Document } from 'mongoose';
import { MoveType } from '../../libs/types';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true, versionKey: false })
export class GameSnapshot {
  @Prop({ required: true, type: String })
  fen: string;

  @Prop({ required: true, type: String })
  white: string;

  @Prop({ required: true, type: String })
  black: string;

  @Prop({ required: true, type: Number })
  gameCreatedAt: number;

  @Prop({ required: true, type: Number })
  finishedAt: number;

  @Prop({ required: true, type: String })
  winnerColor: string;

  @Prop({ required: true, type: String })
  winnerId: string;

  @Prop({ required: true, type: Boolean })
  isCheckmate: boolean;

  @Prop({ required: true, type: Boolean })
  isDraw: boolean;

  @Prop({
    required: true,
    type: [
      {
        from: { type: String, required: true },
        to: { type: String, required: true },
      },
    ],
  })
  allMoves: MoveType[];
}

export type GameSnapshotDocument = GameSnapshot & Document;

export const GameSnapshotSchema = SchemaFactory.createForClass(GameSnapshot);
