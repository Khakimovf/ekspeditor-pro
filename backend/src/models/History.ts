import mongoose, { Document, Schema } from 'mongoose';

export interface IHistory extends Document {
    timestamp: Date;
    itemId: string;
    type: 'IN' | 'OUT' | 'SET';
    boxes: number;
    totalPieces: number;
}

const historySchema = new Schema<IHistory>({
    timestamp: { type: Date, default: Date.now },
    itemId: { type: String, required: true },
    type: { type: String, enum: ['IN', 'OUT', 'SET'], required: true },
    boxes: { type: Number, required: true },
    totalPieces: { type: Number, required: true }
});

const History = mongoose.model<IHistory>('History', historySchema);

export default History;
