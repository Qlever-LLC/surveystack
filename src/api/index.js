import { Router } from "express";

import routes from "../routes";

const router = Router();

router.use("/debug", routes.debug);
router.use("/surveys", routes.surveys);
router.use("/survey-results", routes.surveyResults);
router.use("/auth", routes.auth);
router.use("/users", routes.users);
router.use("/admin", routes.admin);
router.use("/groups", routes.groups);

export default router;
