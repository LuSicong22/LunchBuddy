/**
 * Simple web-push sender wired to Firestore.
 * Usage (after installing deps and setting env):
 *   node server/sendPush.js --to=<uid> --title="收到好友请求" --body="罗宾想加你为好友" [--url="/"]
 *
 * Required env:
 *   APP_ID=your-app-id (same as前端)
 *   FIREBASE_PROJECT_ID=...
 *   FIREBASE_CLIENT_EMAIL=...
 *   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
 *   VAPID_PUBLIC_KEY=...
 *   VAPID_PRIVATE_KEY=...
 * Optional:
 *   ADMIN_SENDER_EMAIL=mailto:you@example.com (for VAPID contact)
 */
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import webpush from "web-push";

const requiredEnv = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
];

const missing = requiredEnv.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing env: ${missing.join(", ")}`);
  process.exit(1);
}

const APP_ID = process.env.APP_ID || "default-app-id";
const CONTACT_EMAIL =
  process.env.ADMIN_SENDER_EMAIL || "mailto:lunchbuddy@example.com";

// Fix escaped newlines in private key
const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey,
  }),
});

webpush.setVapidDetails(
  CONTACT_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const db = getFirestore();

const args = process.argv.slice(2).reduce((acc, item) => {
  const [k, v] = item.split("=");
  if (k.startsWith("--")) acc[k.slice(2)] = v ?? true;
  return acc;
}, {});

const targetUid = args.to;
const title = args.title || "LunchBuddy 提醒";
const body = args.body || "你有新的消息";
const clickUrl = args.url || "/";

if (!targetUid) {
  console.error("Usage: node server/sendPush.js --to=<uid> --title=... --body=... [--url=/]");
  process.exit(1);
}

async function getSubscription(uid) {
  const userDocRef = db.doc(`artifacts/${APP_ID}/users/${uid}`);
  const profileDocRef = db.doc(
    `artifacts/${APP_ID}/users/${uid}/data/profile`
  );
  const [userSnap, profileSnap] = await Promise.all([
    userDocRef.get(),
    profileDocRef.get(),
  ]);
  const userData = userSnap.exists ? userSnap.data() : {};
  const profileData = profileSnap.exists ? profileSnap.data() : {};
  return (
    profileData.pushSubscription ||
    userData.pushSubscription ||
    profileData.subscription ||
    null
  );
}

async function sendPush(subscription, payload) {
  await webpush.sendNotification(subscription, JSON.stringify(payload));
}

async function main() {
  const subscription = await getSubscription(targetUid);
  if (!subscription) {
    console.error(`No pushSubscription found for uid=${targetUid}`);
    process.exit(1);
  }
  const payload = { title, body, url: clickUrl };
  await sendPush(subscription, payload);
  console.log(`Sent push to uid=${targetUid}`);
}

main().catch((err) => {
  console.error("Send push failed", err);
  process.exit(1);
});
