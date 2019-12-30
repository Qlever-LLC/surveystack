import { Router } from "express";

import authController from "../controllers/authController";
import checkPermissions from "../handlers/checkPermissions";
import { catchErrors } from "../handlers/errorHandlers";

const router = Router();

router.post("/register", catchErrors(authController.register));
router.post("/login", catchErrors(authController.login));

export default router;
