import uuidv4 from "uuid/v4";

import { db } from "../models";

export const initAdmins = async () => {
  console.log("initAdmins...");
  const existingAdmin = await db
    .collection("users")
    .findOne({ permissions: "admin" });
  if (!existingAdmin) {
    console.log("There is not a single admin, creating one now...");

    const username = process.env.ADMIN_USERNAME;
    const email = process.env.ADMIN_EMAIL;
    const token = uuidv4();
    const password = process.env.ADMIN_PASSWORD;
    const permissions = [`/u/${username}`, "admin"];
    const authProviders = [];

    const created = await db.collection("users").insertOne({
      username,
      email,
      token,
      password,
      permissions,
      authProviders
    });
    console.log("Created admin", created.ops[0]);
  }
};
