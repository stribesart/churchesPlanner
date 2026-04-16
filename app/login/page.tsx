"use client"

import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"

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
    });

    if (res.ok) {
      router.replace("/dashboard")
      router.refresh()
    } else {
      alert("Credenciales incorrectas")
    }
  }

  return (
    <>
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle className="text-center">
            Churches Planner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}/>
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input 
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}/>
            </div>
            <Button className="w-full">
              Iniciar sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
    </>
  )
};