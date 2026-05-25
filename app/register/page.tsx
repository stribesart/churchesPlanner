"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function RegisterPage() {
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [churchName, setChurchName] = useState("")
  const [location, setLocation] = useState("")
  const [generalServiceDay, setGeneralServiceDay] = useState("")
  const [generalServiceStartTime, setGeneralServiceStartTime] = useState("")
  const [serviceFrequency, setServiceFrequency] = useState("weekly")
  const [adminName, setAdminName] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [age, setAge] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const serviceDays = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ]
  const serviceFrequencies = [
    {
      value: "weekly",
      label: "Semanal",
      description: "La reunión principal ocurre cada semana.",
    },
    {
      value: "biweekly",
      label: "Quincenal",
      description: "La reunión principal ocurre cada dos semanas.",
    },
    {
      value: "monthly",
      label: "Mensual",
      description: "La reunión principal ocurre una vez al mes.",
    },
  ]

  function isPasswordValid(password: string) {
    return /(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}/.test(password)
  }

  function validateStep(stepToValidate: number) {
    if (stepToValidate === 1) {
      if (!churchName.trim()) return "El nombre de la iglesia es obligatorio"
      if (!generalServiceDay.trim()) return "Selecciona el día de servicio general"
      if (!generalServiceStartTime.trim()) return "Selecciona la hora de inicio del servicio"
      return null
    }

    if (stepToValidate === 2) {
      if (!adminName.trim()) return "El nombre del administrador es obligatorio"
      if (!adminEmail.trim()) return "El correo del administrador es obligatorio"
      if (!password) return "La contraseña es obligatoria"
      if (!isPasswordValid(password)) return "La contraseña debe tener mínimo 8 caracteres, incluir una mayúscula, letras y un número"
      if (!confirmPassword) return "Confirma tu contraseña"
      if (password !== confirmPassword) return "Las contraseñas no coinciden"
      if (!age.trim()) return "La edad es obligatoria"
      const ageNumber = Number(age)
      if (!Number.isInteger(ageNumber) || ageNumber <= 0) return "Ingresa una edad válida"
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

    if (step < 2) {
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
        location,
        generalServiceDay,
        generalServiceStartTime,
        serviceFrequency,
        adminName,
        adminEmail,
        password,
        age,
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
                Separa los datos de tu iglesia de la cuenta administradora.
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
                      Ubicación
                    </Label>
                    <Input
                      type="text"
                      placeholder="Ciudad, colonia o dirección"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="h-11 rounded-xl border-slate-200 bg-white"
                    />
                    <p className="text-xs text-slate-500">
                      Opcional. Se usará solo como información del perfil de la iglesia.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">
                      Día de servicio general
                    </Label>
                    <select
                      value={generalServiceDay}
                      onChange={(e) => setGeneralServiceDay(e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-900 outline-none focus:border-blue-500"
                    >
                      <option value="">Selecciona un día</option>
                      {serviceDays.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">
                      Hora de inicio del servicio
                    </Label>
                    <Input
                      type="time"
                      value={generalServiceStartTime}
                      onChange={(e) => setGeneralServiceStartTime(e.target.value)}
                      className="h-11 rounded-xl border-slate-200 bg-white"
                    />
                  </div>

                  <Accordion type="single" collapsible className="rounded-2xl border border-slate-200 bg-white px-4">
                    <AccordionItem value="frequency" className="border-0">
                      <AccordionTrigger className="py-3 text-slate-800 hover:no-underline">
                        Frecuencia
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <div className="grid gap-2">
                          {serviceFrequencies.map((frequency) => (
                            <label
                              key={frequency.value}
                              className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 px-3 py-3 transition hover:bg-slate-50"
                            >
                              <input
                                type="radio"
                                name="service-frequency"
                                value={frequency.value}
                                checked={serviceFrequency === frequency.value}
                                onChange={(e) => setServiceFrequency(e.target.value)}
                                className="mt-1"
                              />
                              <span>
                                <span className="block text-sm font-semibold text-slate-800">
                                  {frequency.label}
                                </span>
                                <span className="block text-xs text-slate-500">
                                  {frequency.description}
                                </span>
                              </span>
                            </label>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                    Esta cuenta será el administrador principal de la iglesia.
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">
                      Nombre del administrador o pastor
                    </Label>
                    <Input
                      type="text"
                      placeholder="Nombre completo"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="h-11 rounded-xl border-slate-200 bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">
                      Correo del administrador
                    </Label>
                    <Input
                      type="email"
                      placeholder="admin@ejemplo.com"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
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
                        className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label={showConfirmPassword ? "Ocultar confirmación" : "Mostrar confirmación"}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
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
                  {step < 2 ? "Siguiente" : loading ? "Registrando..." : "Finalizar registro"}
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
