import { Router } from "express";
import boom from "@hapi/boom";
import { db } from "../models";

import { createDummyResults } from "../services/dummy.service";

const router = Router();

router.get("/", (req, res) => {
  return res.send("This is the debug route");
});

router.get("/test1", async (req, res) => {
  const entity = await db.collection("resources").findOne({});
  console.log(entity);
  return res.send(entity);
});

router.post("/dummy-results", async (req, res) => {
  const { survey } = req.body;
  const r = createDummyResults({ survey });
  return res.send(r);
});

router.get("/throw", async (req, res, next) => {
  try {
    throw boom.badRequest("bad req");
  } catch (error) {
    next(error);
  }
});

export default router;
