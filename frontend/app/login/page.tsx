import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-2xl">SP</span>
          </div>
          <div>
            <CardTitle className="text-2xl">Smart Planner AI</CardTitle>
            <CardDescription className="text-base mt-2">
              Inicia sesión para continuar
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Correo electrónico
            </label>
            <Input
              type="email"
              placeholder="tu@email.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <Input
              type="password"
              placeholder="••••••••"
            />
          </div>
          <Button className="w-full" size="lg">
            Iniciar Sesión
          </Button>
          <div className="text-center pt-4">
            <p className="text-sm text-gray-600">
              ¿No tienes cuenta?{' '}
              <a href="#" className="text-blue-600 hover:underline font-medium">
                Regístrate
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
