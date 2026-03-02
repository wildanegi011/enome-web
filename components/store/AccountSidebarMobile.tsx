"use client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { User, Menu } from "lucide-react";
import UserSidebar from "./UserSidebar";

export default function AccountSidebarMobile() {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button
                    variant="outline"
                    className="lg:hidden h-10 px-4 rounded-xl border-neutral-base-100 bg-white gap-2 text-[12px] font-bold text-neutral-base-900 shadow-sm"
                >
                    <User className="w-4 h-4" />
                    <span>Menu Akun</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 border-r-0 w-[300px]">
                <div className="py-10 px-6 h-full overflow-y-auto">
                    <UserSidebar isSheet className="w-full" />
                </div>
            </SheetContent>
        </Sheet>
    );
}
