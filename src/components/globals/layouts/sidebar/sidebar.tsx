"use client";

import { Icons } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Sidebar as ShadSidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    sidebarMenuButtonVariants,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_PFP_URL } from "@/config/const";
import { siteConfig } from "@/config/site";
import { useAuth } from "@/lib/rq";
import { cn, getAbsoluteURL } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function Sidebar() {
    const pathname = usePathname();
    const { isMobile, setOpenMobile } = useSidebar();

    useEffect(() => {
        if (isMobile) setOpenMobile(false);
    }, [pathname, isMobile, setOpenMobile]);

    return (
        <ShadSidebar collapsible="icon">
            <SidebarHeader>
                <Header />
            </SidebarHeader>

            <SidebarContent style={{ scrollbarWidth: "none" }}>
                <SideNav />
            </SidebarContent>

            <SidebarFooter>
                <SideUser />
            </SidebarFooter>
        </ShadSidebar>
    );
}

function Header() {
    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton
                    size="lg"
                    className="hover:bg-transparent hover:text-sidebar-foreground active:bg-transparent active:text-sidebar-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    asChild
                >
                    <Link href="/">
                        <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                            <Image
                                src="/icon1.png"
                                alt="Logo"
                                width={35}
                                height={35}
                            />
                        </div>

                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-semibold">
                                {siteConfig.name}
                            </span>
                            <span className="truncate text-xs">
                                {getAbsoluteURL().split("://")[1]?.slice(0, -1)}
                            </span>
                        </div>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}

function SideNav({ className, ...props }: GenericProps) {
    return (
        <SidebarGroup className={cn("", className)} {...props}>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>

            <SidebarMenu>
                {siteConfig.sidebar.map((item) => {
                    const Icon = item.icon && Icons[item.icon];

                    return (
                        <Collapsible
                            key={item.title}
                            asChild
                            defaultOpen
                            className="group/collapsible"
                        >
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton tooltip={item.title}>
                                        {Icon && <Icon />}
                                        <span>{item.title}</span>
                                        <Icons.ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>

                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        {item.items.map((subItem) => (
                                            <SidebarMenuSubItem
                                                key={subItem.title}
                                            >
                                                <SidebarMenuSubButton asChild>
                                                    <Link
                                                        href={subItem.url}
                                                        prefetch
                                                    >
                                                        {subItem.title}
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        ))}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}

function SideUser() {
    const { useCurrentUser, useSignOut } = useAuth();
    const { data: user } = useCurrentUser();
    const { mutate: signOut, isPending: isSigningOut } = useSignOut();

    return (
        <SidebarMenu>
            <SidebarMenuItem
                className={cn(sidebarMenuButtonVariants({ size: "lg" }))}
            >
                {user ? (
                    <Link
                        href="/profile"
                        className="flex flex-1 items-center gap-2 overflow-hidden text-left"
                    >
                        <Avatar className="size-8">
                            <AvatarImage
                                src={DEFAULT_PFP_URL}
                                alt={user.firstName}
                            />
                            <AvatarFallback>
                                {user.firstName[0]?.toUpperCase()}
                            </AvatarFallback>
                        </Avatar>

                        <div className="grid flex-1 text-sm leading-tight">
                            <span className="truncate font-semibold">
                                {user.firstName} {user.lastName}
                            </span>
                            <span className="truncate text-xs">Admin</span>
                        </div>
                    </Link>
                ) : (
                    <>
                        <Skeleton className="size-8 rounded-full" />

                        <div className="grid flex-1 gap-px text-left text-sm leading-tight">
                            <Skeleton className="h-4 w-20 rounded-lg" />
                            <Skeleton className="h-3 w-16 rounded-lg" />
                        </div>
                    </>
                )}

                <button
                    className="disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isSigningOut}
                    onClick={() => signOut({})}
                >
                    <Icons.LogOut className="ml-auto size-4" />
                    <span className="sr-only">Log out</span>
                </button>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
