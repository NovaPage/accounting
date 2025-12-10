"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Lock, Zap } from "lucide-react";

export function LandingPage() {
    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)]">
            {/* Hero Section */}
            <section className="flex-1 flex flex-col items-center justify-center text-center py-20 md:py-32 space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="space-y-4 max-w-3xl">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        Control total de tus finanzas para equipos modernos
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-[600px] mx-auto">
                        Orbit es la plataforma contable diseñada para la velocidad. Gestiona múltiples espacios, invita a tu equipo y mantén tus cuentas claras.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/login">
                        <Button size="lg" className="h-12 px-8 text-lg gap-2 shadow-lg hover:shadow-primary/25 transition-all">
                            Comenzar ahora <ArrowRight className="h-5 w-5" />
                        </Button>
                    </Link>
                    <Link href="/login">
                        <Button size="lg" variant="outline" className="h-12 px-8 text-lg">
                            Iniciar Sesión
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-20 bg-muted/30 rounded-3xl border border-border/50 p-8">
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    <div className="flex flex-col items-center text-center space-y-4 p-6 hover:bg-background rounded-xl transition-colors border border-transparent hover:border-border">
                        <div className="p-3 bg-primary/10 rounded-full text-primary">
                            <Zap className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-bold">Rápido y Fluido</h3>
                        <p className="text-muted-foreground">
                            Interfaz diseñada para registrar transacciones en segundos, sin recargas innecesarias.
                        </p>
                    </div>
                    <div className="flex flex-col items-center text-center space-y-4 p-6 hover:bg-background rounded-xl transition-colors border border-transparent hover:border-border">
                        <div className="p-3 bg-primary/10 rounded-full text-primary">
                            <BarChart3 className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-bold">Multi-Espacio</h3>
                        <p className="text-muted-foreground">
                            Separa tus finanzas personales de las de tu negocio con espacios independientes.
                        </p>
                    </div>
                    <div className="flex flex-col items-center text-center space-y-4 p-6 hover:bg-background rounded-xl transition-colors border border-transparent hover:border-border">
                        <div className="p-3 bg-primary/10 rounded-full text-primary">
                            <Lock className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-bold">Seguro y Privado</h3>
                        <p className="text-muted-foreground">
                            Tus datos están protegidos con seguridad de nivel empresarial y RLS.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
