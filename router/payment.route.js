import { Router } from "express";
import {isLoggedIn,authorizeRoles} from "../middleware/auth.middleware.js"
import { getRazorpayApiKey,buySubscription,verifySubscription,allPayments, cancelSubscription } from "../controller/payment.controller.js";

const router = new Router();

router
    .route("/razorpay-key")
    .get( isLoggedIn , getRazorpayApiKey);

router
    .route("/subscribe")
    .post(isLoggedIn,buySubscription);

router
    .route("/verify-subscription")
    .post(isLoggedIn, verifySubscription);

router 
    .route("/unsubscribe")
    .post(isLoggedIn,cancelSubscription);

router
    .route('/')
    .get(isLoggedIn,authorizeRoles('ADMIN'),allPayments);

    
    export default router;
