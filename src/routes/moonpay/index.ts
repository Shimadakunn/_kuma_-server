import express from "express";
import sign from "./sign";
import events from "./events";

const moonpay = express.Router();

moonpay.use("/", sign);
moonpay.use("/events", events);

export default moonpay;
