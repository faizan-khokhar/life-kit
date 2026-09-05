import { NextResponse } from "next/server";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin";

/**
 * Example Admin SDK Route Handler.
 * Verifies the caller's Firebase ID token, then returns a server-side
 * aggregate of the user's budget data. Not used by the UI yet — pattern
 * for future privileged / sensitive writes.
 *
 * curl -H "Authorization: Bearer <idToken>" http://localhost:3000/api/budget
 */
export async function GET(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid Authorization header" },
      { status: 401 },
    );
  }

  const idToken = header.slice("Bearer ".length).trim();
  if (!idToken) {
    return NextResponse.json({ error: "Empty bearer token" }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Invalid ID token" }, { status: 401 });
  }

  const db = getAdminFirestore();
  const [categoriesSnap, expensesSnap] = await Promise.all([
    db.collection(`users/${uid}/budget`).get(),
    db.collection(`users/${uid}/expenses`).get(),
  ]);

  let incomeTotal = 0;
  let expenseTotal = 0;
  const spendByCategory: Record<string, number> = {};

  for (const docSnap of expensesSnap.docs) {
    const data = docSnap.data();
    const amount = Number(data.amount ?? 0);
    const type = data.type === "income" ? "income" : "expense";
    if (type === "income") {
      incomeTotal += amount;
    } else {
      expenseTotal += amount;
      const category = String(data.category ?? "Uncategorized");
      spendByCategory[category] = (spendByCategory[category] ?? 0) + amount;
    }
  }

  const categories = categoriesSnap.docs.map((docSnap) => {
    const data = docSnap.data();
    const name = String(data.name ?? "");
    return {
      id: docSnap.id,
      name,
      limit: Number(data.limit ?? 0),
      spent: spendByCategory[name] ?? 0,
    };
  });

  return NextResponse.json({
    uid,
    incomeTotal,
    expenseTotal,
    remaining: incomeTotal - expenseTotal,
    categories,
    entryCount: expensesSnap.size,
  });
}
