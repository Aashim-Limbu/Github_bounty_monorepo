import express from "express";
import dotenv from "dotenv";
import appFn from "./probot/app";
import { createNodeMiddleware, createProbot, Probot } from "probot";

dotenv.config();

const app = express();

const middleware = createNodeMiddleware(appFn, {
  probot: createProbot(),
});

async function main() {
  try {
    app.use(middleware);
    app.get("/", (req, res) => {
      res.status(200).json({
        success: true,
        message: "Okay good to go!!",
      });
    });

    app.listen(3000, () => {
      console.log("Server running on port: 3000");
    });
  } catch (error) {
    console.log("Error starting the server: ", error);
    process.exit(1);
  }
}

main();
