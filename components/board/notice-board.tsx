import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { BoardPost } from '@/components/board/board-post'
import { createPost } from '@/app/board/actions'
import { MessageSquarePlus, Share2, Megaphone } from 'lucide-react'

export async function NoticeBoard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Get current profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Fetch all posts with their profiles
    const { data: allPosts } = await supabase
        .from('board_posts')
        .select(`
            *,
            profiles:user_id (full_name, role, section, avatar_url)
        `)
        .order('created_at', { ascending: false })

    const threads = allPosts?.filter(p => !p.parent_id) || []
    const replies = allPosts?.filter(p => p.parent_id) || []

    async function handleCreateAction(formData: FormData) {
        'use server'
        const content = formData.get('content') as string
        if (!content) return
        await createPost(content)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
                <Megaphone className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-primary tracking-tight">Tablón de Anuncios</h2>
            </div>

            {/* New Post Form */}
            <Card className="border-primary/20 bg-primary/5 shadow-sm overflow-hidden border-2">
                <CardContent className="p-4">
                    <form action={handleCreateAction} className="space-y-3">
                        <div className="flex gap-3">
                            <div className="h-10 w-10 rounded-full border border-primary/20 overflow-hidden shrink-0 shadow-sm">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Mi Avatar" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full bg-primary flex items-center justify-center">
                                        <MessageSquarePlus className="text-primary-foreground h-5 w-5" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 space-y-3">
                                <Textarea
                                    name="content"
                                    placeholder="¿Qué quieres anunciar a la unidad?"
                                    className="min-h-[100px] bg-background border-primary/20 focus-visible:ring-primary resize-none text-sm p-3"
                                    required
                                />
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-[9px] text-muted-foreground uppercase font-bold tracking-widest px-1">
                                        <Share2 className="h-3 w-3" />
                                        Visibilidad Pública
                                    </div>
                                    <Button type="submit" size="sm" className="px-6 shadow-sm hover:scale-105 transition-transform text-xs font-bold uppercase tracking-wider">
                                        Publicar Anuncio
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Posts List */}
            <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                {threads.length === 0 ? (
                    <div className="text-center py-12 bg-muted/20 rounded-xl border-2 border-dashed border-border/50">
                        <MessageSquarePlus className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                        <h3 className="text-sm font-bold text-muted-foreground">No hay anuncios todavía</h3>
                        <p className="text-[11px] text-muted-foreground">Sé el primero en compartir algo con la tropa.</p>
                    </div>
                ) : (
                    threads.map((post) => (
                        <BoardPost
                            key={post.id}
                            post={post}
                            replies={replies.filter(r => r.parent_id === post.id).reverse()}
                            currentUserId={user.id}
                            isAdmin={profile?.role === 'admin'}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
