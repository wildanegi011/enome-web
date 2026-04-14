import { db } from "./lib/db";
import { produk } from "./lib/db/schema";
import { eq } from "drizzle-orm";

async function checkProduct() {
    const id = "BATIKPRIA04";
    const result = await db.select().from(produk).where(eq(produk.produkId, id)).limit(1);
    console.log("DB Result for " + id + ":", JSON.stringify(result, null, 2));
    process.exit(0);
}

checkProduct();
