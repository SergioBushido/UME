'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateAvatarUrl } from '@/app/auth/actions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Camera, Loader2 } from 'lucide-react'

interface AvatarUploadProps {
    userId: string
    currentAvatarUrl?: string
    onUploadSuccess: (url: string) => void
}

export function AvatarUpload({ userId, currentAvatarUrl, onUploadSuccess }: AvatarUploadProps) {
    const [uploading, setUploading] = useState(false)
    const supabase = createClient()

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true)

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('Debes seleccionar una imagen.')
            }

            const file = event.target.files[0]
            const fileExt = file.name.split('.').pop()
            const filePath = `${userId}/${Math.random()}.${fileExt}`

            // Upload image to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true })

            if (uploadError) {
                throw uploadError
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            // Update profile with new avatar URL
            await updateAvatarUrl(publicUrl)

            onUploadSuccess(publicUrl)
            toast.success('Foto de perfil actualizada')
        } catch (error: any) {
            toast.error(error.message || 'Error al subir la imagen')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="flex flex-col items-center gap-4 py-2">
            <div className="relative group cursor-pointer">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-primary/20 group-hover:border-primary transition-colors">
                    {currentAvatarUrl ? (
                        <img src={currentAvatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                        <Camera className="h-8 w-8 text-muted-foreground" />
                    )}
                    {uploading && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                        </div>
                    )}
                </div>
                <label
                    htmlFor="avatar-input"
                    className="absolute inset-0 cursor-pointer"
                >
                    <span className="sr-only">Cambiar foto</span>
                </label>
            </div>
            <Input
                id="avatar-input"
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
            />
            <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('avatar-input')?.click()}
                disabled={uploading}
                className="text-xs font-semibold"
            >
                {uploading ? 'Subiendo...' : 'Cambiar Foto'}
            </Button>
        </div>
    )
}

// Helper to avoid circular dependency if needed, otherwise use local Input
function Input(props: any) {
    return <input {...props} />
}
