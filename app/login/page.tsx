"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()

    const res = await fetch("/api/auth/login", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ email, password }),
    })

    if (res.ok) {
      router.replace("/users")
      router.refresh()
    } else {
      alert("Credenciales incorrectas")
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 text-slate-900">
      <section className="flex min-h-screen items-center justify-center px-6 py-12">
        <Card className="w-full max-w-md rounded-3xl border bg-white/90 shadow-xl backdrop-blur">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100">
              <span className="text-2xl font-bold text-blue-700">CP</span>
            </div>

            <div>
              <CardTitle className="text-3xl font-bold text-slate-900">
                Churches Planner
              </CardTitle>
              <p className="mt-2 text-sm text-slate-600">
                Inicia sesión para administrar tu iglesia
              </p>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">
                  Correo electrónico
                </Label>
                <Input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">
                  Contraseña
                </Label>
                <Input
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 bg-white"
                />
              </div>

              <Button className="h-11 w-full rounded-full bg-blue-700 font-semibold text-white transition hover:bg-blue-800">
                Iniciar sesión
              </Button>
            </form>

            <div className="mt-4 text-center">
              <a
                href="/register"
                className="inline-flex h-11 w-full items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Registrarse
              </a>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}