import mongoose, { Document, Model, model, models, Schema } from "mongoose";

export interface WatchlistItem extends Document {
  userid: string;
  symbol: string;
  company: string;
  addedAt: Date;
}

const WatchlistSchema = new Schema<WatchlistItem>(
  {
    userid: { type: String, required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    company: { type: String, required: true, trim: true },
    addedAt: { type: Date, default: Date.now() },
  },
  { timestamps: false }
);

// Prevent a user from adding the same symbol twice
WatchlistSchema.index({ userid: 1, symbol: 1 }, { unique: true });

const Watchlist: Model<WatchlistItem> =
  (models && (models as any).Watchlist) ||
  model<WatchlistItem>("Watchlist", WatchlistSchema);

export default Watchlist;
