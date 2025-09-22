import User from "../models/user.models.js"
import  razorpay  from '../config/razorpay.js' ;
import AppError from "../utils/error.utils.js";
import Payment from "../models/payment.model.js"
import crypto from 'crypto';
import asyncHandler from  '../middleware/asyncHandler.middleware.js' ;


const  getRazorpayApiKey = async (req,res,next)=>{
   return res.status(200).json({
        success : true,
        message : 'Razor Pay Api Key',
        key : process.env.RAZORPAY_KEY_ID
    });

};


// payment.controller.js
const buySubscription = asyncHandler(async (req, res, next) => {
  console.log('Creating subscription for user:', req.user?.id);
  const { id } = req.user;

  const user = await User.findById(id);
  console.log('User found:', !!user);
  if (!user) {
    return next(new AppError('Unauthorized, please login', 401));
  }

  if (user.role === 'ADMIN') {
    return next(new AppError('Admin cannot purchase a subscription', 400));
  }

  // Clear old cancelled subscription
  if (user.subscription.status === 'cancelled') {
    console.log('Clearing old cancelled subscription:', user.subscription.id);
    user.subscription.id = null;
    user.subscription.status = null;
    await user.save();
  }

  try {
    console.log('RAZORPAY_PLAN_ID:', process.env.RAZORPAY_PLAN_ID);
    const subscription = await razorpay.subscriptions.create({
      plan_id: process.env.RAZORPAY_PLAN_ID,
      customer_notify: 1,
      total_count: 12,
    });
    console.log('New Subscription:', subscription);

    user.subscription.id = subscription.id;
    user.subscription.status = subscription.status;
    await user.save();
    console.log('Updated User Subscription:', user.subscription);

    return res.status(200).json({
      success: true,
      message: 'Subscribed successfully',
      subscription_id: subscription.id,
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return next(new AppError(`Subscription creation failed: ${error.message}`, 500));
  }
});


 
const verifySubscription = asyncHandler(async (req, res, next) => {
  console.log('Request body:', req.body);
  console.log('User ID:', req.user?.id);

  const { id } = req.user;
  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;

  if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
    return next(new AppError('Missing required payment details', 400));
  }

  const user = await User.findById(id);
  console.log('User found:', !!user);
  if (!user) {
    return next(new AppError('Unauthorized, please login', 401));
  }

  console.log('RAZORPAY_KEY_SECRET:', !!process.env.RAZORPAY_KEY_SECRET);
  if (!process.env.RAZORPAY_KEY_SECRET) {
    return next(new AppError('Razorpay key secret not configured', 500));
  }

  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
    .digest('hex');
  console.log('Generated Signature:', generatedSignature);
  console.log('Received Signature:', razorpay_signature);

  if (generatedSignature !== razorpay_signature) {
    return next(new AppError('Payment verification failed, please try again', 400));
  }

  try {
    console.log('Creating Payment...');
    await Payment.create({
      userId: id,
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
      amount: 49900,
      status: 'completed',
    });
    console.log('Payment created successfully');

    console.log('Fetching subscription from Razorpay...');
    const subscription = await razorpay.subscriptions.fetch(razorpay_subscription_id);
    console.log('Subscription fetched:', JSON.stringify(subscription, null, 2));

    if (subscription.status === 'cancelled') {
      console.log('Warning: Fetched subscription is cancelled. Check Razorpay dashboard.');
    }

    user.subscription.id = razorpay_subscription_id;
    user.subscription.status = subscription.status;
    await user.save();
    console.log('Updated User Subscription:', user.subscription);

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      subscriptionStatus: subscription.status,
    });
  } catch (error) {
    console.error('Error verifying subscription:', error);
    return next(new AppError(`Verification failed: ${error.message}`, 500));
  }
});

const cancelSubscription = asyncHandler(async (req, res, next) => {
  const { id } = req.user;
  const user = await User.findById(id);

  if (!user) {
    return next(new AppError("Unauthorized, please login", 401));
  }

  if (user.role === "ADMIN") {
    return next(new AppError("Admin cannot purchase a subscription", 400));
  }

  const subscriptionId = user.subscription.id;
  if (!subscriptionId) {
    return next(new AppError("No active subscription found", 400));
  }

  try {
    console.log("Cancelling subscription:", subscriptionId);
    const subscription = await razorpay.subscriptions.cancel(subscriptionId);
    console.log("Subscription cancelled:", subscription);

    user.subscription.id = null; // Clear subscription ID
    user.subscription.status = subscription.status; // Set to 'cancelled'
    await user.save();
    console.log("Updated User Subscription:", user.subscription);

    return res.status(200).json({
      success: true,
      message: "Subscription cancelled successfully",
      subscriptionId,
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return next(
      new AppError(`Failed to cancel subscription: ${error.message}`, 500)
    );
  }
});

const allPayments = async (req, res, next) => {
    const {count} = req.query;

    const subscriptions = await razorpay.subscriptions.all({
      count : count || 10
    })
     subscriptions.items.forEach(element => { console.log(element.id) });
    res.status(200).json({
      success : true,
      message : "subscriber data fetched successfully",
      subscriptions
    })
};

 

export {
    getRazorpayApiKey,
    buySubscription,
    verifySubscription,
    cancelSubscription,
    allPayments
}