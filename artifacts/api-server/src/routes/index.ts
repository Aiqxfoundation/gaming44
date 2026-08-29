import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import miningRouter from "./mining.js";
import walletRouter from "./wallet.js";
import referralsRouter from "./referrals.js";
import systemRouter from "./system.js";
import adminRouter from "./admin.js";
import kycRouter from "./kyc.js";
import verifyRouter from "./verify.js";
import eixRouter from "./eix.js";
import powerCardsRouter from "./powerCards.js";
import airdropRouter from "./airdrop.js";
import projectsRouter from "./projects.js";
import adminEixRouter from "./adminEix.js";
import adminAirdropRouter from "./adminAirdrop.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/mining", miningRouter);
router.use("/wallet", walletRouter);
router.use("/referrals", referralsRouter);
router.use("/system", systemRouter);
router.use("/admin", adminRouter);
router.use("/admin", adminEixRouter);
router.use("/admin", adminAirdropRouter);
router.use("/kyc", kycRouter);
router.use("/verify", verifyRouter);
router.use("/eix", eixRouter);
router.use("/power-cards", powerCardsRouter);
router.use("/airdrop", airdropRouter);
router.use("/projects", projectsRouter);

export default router;
