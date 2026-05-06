import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import adminRouter from "./admin";
import departmentsRouter from "./departments";
import employeesRouter from "./employees";
import tasksRouter from "./tasks";
import performanceRouter from "./performance";
import productsRouter from "./products";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(adminRouter);
router.use(departmentsRouter);
router.use(employeesRouter);
router.use(tasksRouter);
router.use(performanceRouter);
router.use(productsRouter);
router.use(analyticsRouter);

export default router;
