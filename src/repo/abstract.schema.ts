import { Prop, Schema } from "@nestjs/mongoose";
import { SchemaTypes } from "mongoose";

@Schema()
export class AbstractDocument {
    @Prop({type: SchemaTypes.ObjectId})
    _id: string;

      @Prop({ type: Date, default: Date.now, immutable: true })
      createdAt: Date;
    
      @Prop({ type: Date, default: Date.now })
      updatedAt: Date;
}   