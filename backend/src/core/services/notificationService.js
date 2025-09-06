// notificationService.js
// import nodemailer from 'nodemailer';
// import { getUserById } from '../models/userModel.js';
// import { getNotificationPreferences, saveNotification } from '../models/notificationModel.js';
// import { logError } from '../utils/logger.js';
// import { sendSMS } from '../utils/smsService.js';

// // Configure your email transporter (using nodemailer)
// const emailTransporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST,
//   port: process.env.EMAIL_PORT,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });
// emailTransporter.verify().then(() => {
//   console.log('Email transporter is ready');
// }).catch(err => {
//   console.error('Error with email transporter:', err);
// }); 
// // Function to send email
// async function sendEmail(to, subject, text) {
//   const mailOptions = { from: process.env.EMAIL_FROM, to, subject, text };
//   try {
//     await emailTransporter.sendMail(mailOptions);
//     console.log(`Email sent to ${to}`);
//   } catch (error) {
//     logError('Error sending email', error);
//   } 

// // Function to send SMS
// async function sendSMSNotification(to, message) {
//   try {
//     await sendSMS(to, message);
//     console.log(`SMS sent to ${to}`);
//   } catch (error) {
//     logError('Error sending SMS', error);
//   }
// }   
// }
// // Main function to notify user
// export async function notifyUser(userId, subject, message) {
//   try {
//     const user = await getUserById(userId);
//     if (!user) {
//       throw new Error('User not found');
//     }
//     const preferences = await getNotificationPreferences(userId);
//     if (preferences.email) {
//       await sendEmail(user.email, subject, message);
//     }
//     if (preferences.sms) {
//       await sendSMSNotification(user.phone, message);
//     }
//     await saveNotification(userId, subject, message);
//   } catch (error) {
//     logError('Error in notifyUser', error);
//   }
// }
// }
// } catch (error) {
//     logError('Error sending SMS', error);
//   }
// }   
// }
// // Main function to notify user
// export async function notifyUser(userId, subject, message) {
//     try {
//         const user = await getUserById(userId);
//         if (!user) {
//             throw new Error('User not found');
//         }
//         const preferences = await getNotificationPreferences(userId);
//         if (preferences.email) {
//             await sendEmail(user.email, subject, message);
//         }
//         if (preferences.sms) {
//             await sendSMSNotification(user.phone, message);
//         }
//         await saveNotification(userId, subject, message);
//     } catch (error) {
//         logError('Error in notifyUser', error);
//     }
// }
//     logError('Error sending email', error);
//     }
// } catch (error) {
//     logError('Error sending email', error);
//   }
// } catch (error) {
//     logError('Error sending SMS', error);
//   }
// }

// // Main function to notify user
// export async function notifyUser(userId, subject, message) {
//     try {
//         const user = await getUserById(userId);
//         if (!user) {
//             throw new Error('User not found');
//         }
//         const preferences = await getNotificationPreferences(userId);
//         if (preferences.email) {
//             await sendEmail(user.email, subject, message);
//         }
//         if (preferences.sms) {
//             await sendSMSNotification(user.phone, message);
//         }
//         await saveNotification(userId, subject, message);
//     } catch (error) {
//         logError('Error in notifyUser', error);
//     }
// }
//     } catch (error) {
//         logError('Error in notifyUser', error);
//     }
// } catch (error) {
//     logError('Error in notifyUser', error);
// }
