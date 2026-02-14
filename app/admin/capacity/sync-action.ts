'use server'

import { regenerateDailyAvailability } from "@/app/admin/settings/capacity-actions"
import { revalidatePath } from "next/cache"

export async function syncCapacityData() {
    const start = new Date(new Date().getFullYear(), 0, 1) // Jan 1st
    const end = new Date(new Date().getFullYear() + 1, 11, 31) // End of next year

    await regenerateDailyAvailability(start, end)
    revalidatePath('/')
}
