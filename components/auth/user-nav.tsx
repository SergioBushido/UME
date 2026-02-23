'use client'

import React, { useState } from 'react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { User, LogOut, KeyRound } from 'lucide-react'
import { ChangePasswordModal } from './change-password-modal'
import { AvatarUpload } from './avatar-upload'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface UserNavProps {
    email?: string
    userId: string
    initialAvatarUrl?: string
}

export function UserNav({ email, userId, initialAvatarUrl }: UserNavProps) {
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
    const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)

    return (
        <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full border border-border/50">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-muted-foreground truncate max-w-[150px]">
                    {email}
                </span>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full border border-border/50 hover:bg-muted p-0 overflow-hidden">
                        <Avatar className="h-full w-full">
                            <AvatarImage src={avatarUrl} />
                            <AvatarFallback>
                                <User className="h-5 w-5" />
                            </AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">Mi Cuenta</p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {email}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <div className="p-2">
                        <AvatarUpload
                            userId={userId}
                            currentAvatarUrl={avatarUrl}
                            onUploadSuccess={setAvatarUrl}
                        />
                    </div>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={() => setIsPasswordModalOpen(true)} className="cursor-pointer">
                        <KeyRound className="mr-2 h-4 w-4" />
                        <span>Cambiar Contraseña</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <form action="/auth/signout" method="post" className="w-full">
                        <button type="submit" className="flex w-full items-center px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 rounded-sm">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Cerrar Sesión</span>
                        </button>
                    </form>
                </DropdownMenuContent>
            </DropdownMenu>

            <ChangePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
            />
        </div>
    )
}
