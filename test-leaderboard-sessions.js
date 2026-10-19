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
    if(snap.docs.length > 0) {
      const uid = snap.docs[0].id;
      const sessionsRef = collection(db, "users", uid, "sessions");
      const sq = query(sessionsRef, orderBy("timestamp", "desc"), limit(2));
      const sessionsSnap = await getDocs(sq);
      console.log("Sessions count:", sessionsSnap.docs.length);
    }
  } catch (err) {
    console.error("Web SDK Error:", err.message);
  }
}
test();
