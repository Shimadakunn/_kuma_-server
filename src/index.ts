import express from "express";
import user from "./routes/user";
import waitingList from "./routes/waiting-list";
import moonpay from "./routes/moonpay";

const app = express();
app.use(express.json());

// TO DO: Add cors, add bearer token auth

app.get("/", (req, res) => {
  return res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.use("/user", user);
app.use("/moonpay", moonpay);
app.use("/waiting-list", waitingList);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

export default app;
