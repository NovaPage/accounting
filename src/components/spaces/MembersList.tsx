"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2, Trash2, User, Shield } from "lucide-react";
import { toast } from "sonner";
import { RemoveMemberAction } from "@/app/actions/spaces";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface Member {
    user_id: string;
    role: "owner" | "member";
    email?: string;
    joined_at: string;
}

interface MembersListProps {
    spaceId: string;
    members: Member[];
    currentUserId: string;
}

export function MembersList({ spaceId, members, currentUserId }: MembersListProps) {
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const router = useRouter();

    const handleRemove = async (userId: string) => {
        if (!confirm("¿Estás seguro de eliminar a este miembro?")) return;

        setLoadingId(userId);
        try {
            const result = await RemoveMemberAction(spaceId, userId);
            if (result.ok) {
                toast.success(result.message);
                router.refresh();
            } else {
                toast.error(result.message);
            }
        } catch {
            toast.error("Error al eliminar miembro.");
        } finally {
            setLoadingId(null);
        }
    };

    const currentUserRole = members.find(m => m.user_id === currentUserId)?.role;
    const isOwner = currentUserRole === "owner";

    return (
        <Card>
            <CardHeader>
                <CardTitle>Miembros</CardTitle>
                <CardDescription>
                    Gestiona el acceso a tu espacio.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {members.map((member) => (
                        <div key={member.user_id} className="flex items-center justify-between p-4 rounded-lg border bg-muted/40">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    {member.role === "owner" ? <Shield className="h-5 w-5" /> : <User className="h-5 w-5" />}
                                </div>
                                <div>
                                    <p className="text-sm font-medium">
                                        {member.user_id === currentUserId ? "Tú" : (member.email || "Usuario")}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Unido el {new Date(member.joined_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Badge variant={member.role === "owner" ? "default" : "secondary"}>
                                    {member.role === "owner" ? "Propietario" : "Miembro"}
                                </Badge>

                                {isOwner && member.user_id !== currentUserId && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        disabled={!!loadingId}
                                        onClick={() => handleRemove(member.user_id)}
                                    >
                                        {loadingId === member.user_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
