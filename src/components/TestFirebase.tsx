"use client";

import { useEffect } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function TestFirebase() {
  useEffect(() => {
    const writeTest = async () => {
      try {
        await setDoc(doc(db, "connectionTest", "localTest"), {
          status: "connected",
          timestamp: new Date().toISOString(),
        });
        console.log("✅ Firebase connected and document written");
      } catch (error) {
        console.error("❌ Firebase connection failed:", error);
      }
    };

    writeTest();
  }, []);

  return <p className="text-sm text-gray-500">Running Firebase test...</p>;
}
