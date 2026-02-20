import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const characters = await prisma.character.findMany({
            select: { id: true, name: true, profileImage: true },
            orderBy: { name: "asc" },
        });
        return NextResponse.json({ characters });
    } catch (error) {
        return NextResponse.json({ error: "DB Error" }, { status: 500 });
    }
}
