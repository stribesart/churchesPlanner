"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function RegisterPage() {
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [churchName, setChurchName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [contactNumber, setContactNumber] = useState("")
  const [registrantName, setRegistrantName] = useState("")
  const [age, setAge] = useState("")
  const [role, setRole] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function isPasswordValid(password: string) {
    return /(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}/.test(password)
  }

  function validateStep(stepToValidate: number) {
    if (stepToValidate === 1) {
      if (!churchName.trim()) return "El nombre de la iglesia es obligatorio"
      if (!email.trim()) return "El correo electrónico es obligatorio"
      if (!contactNumber.trim()) return "El número de contacto es obligatorio"
      if (!password) return "La contraseña es obligatoria"
      if (!isPasswordValid(password)) return "La contraseña debe tener mínimo 8 caracteres, incluir una mayúscula, letras y un número"
      if (!confirmPassword) return "Confirma tu contraseña"
      if (password !== confirmPassword) return "Las contraseñas no coinciden"
      return null
    }

    if (stepToValidate === 2) {
      if (!registrantName.trim()) return "El nombre del usuario administrador es obligatorio"
      if (!age.trim()) return "La edad es obligatoria"
      const ageNumber = Number(age)
      if (!Number.isInteger(ageNumber) || ageNumber <= 0) return "Ingresa una edad válida"
      if (!role.trim()) return "El rol es obligatorio"
      return null
    }

    if (stepToValidate === 3) {
      if (!description.trim()) return "La descripción es obligatoria"
      return null
    }

    return null
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const validationError = validateStep(step)
    if (validationError) {
      setError(validationError)
      return
    }

    if (step < 3) {
      setStep(step + 1)
      return
    }

    setLoading(true)

    const res = await fetch("/api/auth/register", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        churchName,
        email,
        password,
        contactNumber,
        registrantName,
        age,
        role,
        description,
      }),
    })

    setLoading(false)

    if (res.ok) {
      router.push("/login")
    } else {
      const data = await res.json()
      setError(data?.message || "Error al registrar la iglesia")
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
                Registra tu iglesia
              </CardTitle>
              <p className="mt-2 text-sm text-slate-600">
                Completa los datos para crear tu iglesia y el usuario administrativo.
              </p>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleRegister} className="space-y-5">
              {step === 1 ? (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">
                      Nombre de la iglesia
                    </Label>
                    <Input
                      type="text"
                      placeholder="Nombre de la iglesia"
                      value={churchName}
                      onChange={(e) => setChurchName(e.target.value)}
                      className="h-11 rounded-xl border-slate-200 bg-white"
                    />
                  </div>

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
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="********"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 rounded-xl border-slate-200 bg-white pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">
                      La contraseña debe tener mínimo 8 caracteres, incluir una mayúscula, letras y un número.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">
                      Confirmación de contraseña
                    </Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="********"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-11 rounded-xl border-slate-200 bg-white pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label={showConfirmPassword ? "Ocultar confirmación" : "Mostrar confirmación"}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">
                      Número de contacto
                    </Label>
                    <Input
                      type="tel"
                      placeholder="+52 1 55 1234 5678"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      className="h-11 rounded-xl border-slate-200 bg-white"
                    />
                  </div>
                </div>
              ) : step === 2 ? (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">
                      Nombre del usuario administrador
                    </Label>
                    <Input
                      type="text"
                      placeholder="Nombre completo"
                      value={registrantName}
                      onChange={(e) => setRegistrantName(e.target.value)}
                      className="h-11 rounded-xl border-slate-200 bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">
                      Edad
                    </Label>
                    <Input
                      type="number"
                      placeholder="Edad"
                      min={1}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="h-11 rounded-xl border-slate-200 bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">
                      Rol
                    </Label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-900 outline-none focus:border-blue-500"
                    >
                      <option value="">Selecciona un rol</option>
                      <option value="Administrador">Administrador</option>
                      <option value="Pastor">Pastor</option>
                      <option value="Coordinador">Coordinador</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">
                      Descripción
                    </Label>
                    <textarea
                      rows={5}
                      placeholder="Descripción corta de la iglesia o el motivo de registro"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-3">
                {step > 1 ? (
                  <Button
                    type="button"
                    className="h-11 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setError("")
                      setStep(step - 1)
                    }}
                  >
                    Regresar
                  </Button>
                ) : (
                  <div />
                )}

                <Button
                  type="submit"
                  className="h-11 rounded-full bg-blue-700 px-5 font-semibold text-white transition hover:bg-blue-800"
                  disabled={loading}
                >
                  {step < 3 ? "Siguiente" : loading ? "Registrando..." : "Finalizar registro"}
                </Button>
              </div>

              <div className="text-center text-sm text-slate-600">
                <a href="/login" className="font-semibold text-blue-700 hover:text-blue-800">
                  ¿Ya tienes cuenta? Inicia sesión
                </a>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
