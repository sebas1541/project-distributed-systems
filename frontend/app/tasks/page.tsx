import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Circle, Clock, Search } from "lucide-react";

export default function TasksPage() {
  return (
    <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Mis Tareas
        </h2>
        <p className="text-gray-600 text-lg">
          Gestiona y organiza tus actividades
        </p>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar tareas..."
              className="pl-10"
            />
          </div>
        </div>
        <Button>
          Nueva Tarea
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">
            Todas
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pendientes
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completadas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <button className="mt-1">
                    <Circle className="h-5 w-5 text-gray-400 hover:text-blue-500 transition-colors" />
                  </button>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Tarea de ejemplo {i}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Descripción de la tarea con detalles importantes
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Hoy, 14:00</span>
                      </div>
                      <span className="px-2 py-1 bg-orange-50 text-orange-600 rounded-lg font-medium">
                        Alta
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardContent className="p-12 text-center">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay tareas pendientes</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay tareas completadas</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
