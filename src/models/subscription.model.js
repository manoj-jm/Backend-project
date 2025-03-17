import mongoose, { mongo } from "mongoose";
 

const subscriptionSchema = new mongoose.Schema({
  subscriber:{
    type: mongoose.Schema.Types.ObjectId , // one who subscribing
    ref:"User",
    required:true,

  },
  channel:{
    type: mongoose.Schema.Types.ObjectId , // one who owns the youtube channel
    ref:"User",
    required:true,
  }
},{timestamps:true})



export const Subscription = mongoose.model("Subscription",subscriptionSchema);