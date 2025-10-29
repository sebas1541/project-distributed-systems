import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, CheckCircle, Clock, Plus, TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          ¡Bienvenido de vuelta! 👋
        </h2>
        <p className="text-gray-600 text-lg">
          Aquí está tu resumen de hoy
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Tareas</p>
                <p className="text-3xl font-bold text-gray-900">24</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Completadas</p>
                <p className="text-3xl font-bold text-green-600">18</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Pendientes</p>
                <p className="text-3xl font-bold text-orange-600">6</p>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Productividad</p>
                <p className="text-3xl font-bold text-purple-600">75%</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tareas Recientes</CardTitle>
                <CardDescription>Tus últimas actividades</CardDescription>
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Tarea
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-xl border border-gray-200/30">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <div>
                  <p className="font-medium text-gray-500 line-through">
                    Revisar documentación del proyecto
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Prioridad: <span className="font-medium text-orange-600">alta</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-xl border border-gray-200/30">
                <div className="w-2 h-2 rounded-full bg-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">
                    Reunión con el equipo de desarrollo
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Prioridad: <span className="font-medium text-red-600">urgente</span>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Crear Tarea
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Clock className="h-4 w-4 mr-2" />
                Ver Calendario
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progreso Semanal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Completadas</span>
                    <span className="font-medium text-gray-900">18/24</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full" style={{ width: '75%' }} />
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600 mb-2">Racha actual</p>
                  <p className="text-2xl font-bold text-blue-600">7 días 🔥</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
