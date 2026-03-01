import mongoose, { Schema, Document } from 'mongoose';

export interface IItem extends Document {
  id: string; // The original string ID like "29284"
  name: string;
  perBox: number;
  currentStock: number;
  minLimit: number;
}

const ItemSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  perBox: { type: Number, required: true },
  currentStock: { type: Number, required: true },
  minLimit: { type: Number, required: true },
}, { timestamps: true });

export default mongoose.model<IItem>('Item', ItemSchema);
