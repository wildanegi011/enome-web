import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-utils";
import logger, { apiLogger } from "@/lib/logger";
import { ActivityService } from "@/lib/services/activity-service";
import { UserService } from "@/lib/services/user-service";
import { promises as fs } from "fs";
import { join } from "path";

export const GET = withAuth(async (request: NextRequest, context: any, session: any) => {
    logger.info("API Request: GET /api/user/profile");
    try {
        const userData = await UserService.getFullProfile(session.user.id);
        if (!userData) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        return NextResponse.json(userData);
    } catch (error: any) {
        apiLogger.error(request, error);
        return NextResponse.json({ error: "Terjadi kesalahan sistem" }, { status: 500 });
    }
});

export const POST = withAuth(async (request: NextRequest, context: any, session: any) => {
    logger.info("API Request: POST /api/user/profile");
    try {
        const userId = session.user.id;
        const formData = await request.formData();

        const data: any = {
            nama: formData.get("nama") as string,
            gender: formData.get("gender") as string,
            brithdate: formData.get("brithdate") as string,
            noHandphone: formData.get("noHandphone") as string,
            namaToko: "-",
            // namaToko: formData.get("namaToko") as string,
            alamat: formData.get("alamat") as string,
            alamatLengkap: formData.get("alamatLengkap") as string,
            kecamatan: formData.get("kecamatan") as string,
            kota: formData.get("kota") as string,
            provinsi: formData.get("provinsi") as string,
            kodepos: formData.get("kodepos") as string,
        };

        const photo = formData.get("photo") as File | null;
        let photoUpdated = false;

        if (photo && photo.size > 0) {
            const ext = photo.name.split('.').pop() || "jpg";
            const fileName = `${userId}.${ext}`;
            const buffer = Buffer.from(await photo.arrayBuffer());
            const uploadDir = join(process.cwd(), "public/img/user");

            await fs.mkdir(uploadDir, { recursive: true });
            const filePath = join(uploadDir, fileName);
            await fs.writeFile(filePath, buffer);

            try { await fs.chmod(filePath, 0o644); } catch { }

            const assetUrl = process.env.NEXT_PUBLIC_URL || "";
            data.photo = fileName;
            data.urlphoto = `${assetUrl}/img/user/${fileName}`;
            photoUpdated = true;
        }

        await UserService.updateProfile(userId, data);

        if (photoUpdated) {
            await ActivityService.log("Update Profile Photo", `User updated profile picture`, userId);
        }
        await ActivityService.log("Update Profile", `User updated profile data`, userId);

        return NextResponse.json({ success: true, message: "Profil berhasil diperbarui" });
    } catch (error: any) {
        apiLogger.error(request, error);
        return NextResponse.json({ error: "Terjadi kesalahan sistem" }, { status: 500 });
    }
});
