'use client'

import { Button } from "@/components/ui/button"
import { Trash } from "lucide-react"
import { deleteUser } from './actions'
import { useState } from 'react'

interface DeleteUserButtonProps {
    userId: string
    userName: string
}

export function DeleteUserButton({ userId, userName }: DeleteUserButtonProps) {
    const [loading, setLoading] = useState(false)

    const handleDelete = async () => {
        if (!confirm(`¿Estás seguro de que quieres eliminar al usuario ${userName}?`)) {
            return
        }

        setLoading(true)
        try {
            await deleteUser(userId)
        } catch (error) {
            console.error(error)
            alert('Error al eliminar usuario')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            size="sm"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
        >
            <Trash className="h-4 w-4" />
        </Button>
    )
}
