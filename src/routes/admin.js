import { Router } from "express";
import { ObjectId } from "mongodb";

import { db } from "../models";

import { assertAdmin } from "../middleware";

const router = Router();
router.use(assertAdmin);

router.get("/user/:userId", async (req, res) => {
  const user = await db
    .collection("users")
    .findOne({ _id: new ObjectId(req.params.userId) });

  return res.send(user);
});

export default router;
