import express from "express";
import userRoutes from "./users";
import positionsRoutes from "./positions";
import actionsRoutes from "./actions";
import notificationsRoutes from "./notifications";
import rewardsRoutes from "./rewards";

const user = express.Router();

user.use("/", userRoutes);
user.use("/positions", positionsRoutes);
user.use("/actions", actionsRoutes);
user.use("/notifications", notificationsRoutes);
user.use("/rewards", rewardsRoutes);

export default user;
