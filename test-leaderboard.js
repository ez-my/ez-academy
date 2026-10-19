import { initializeApp } from "firebase/app";
import { initializeFirestore, collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf8"));
const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);

async function test() {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("points", "desc"), limit(20));
    const snap = await getDocs(q);
    console.log("Success! Users:", snap.docs.length);
  } catch (err) {
    console.error("Web SDK Error:", err.message);
  }
}
test();
