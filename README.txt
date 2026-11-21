BODEGA AGRO - SENA - VERSION 2.2
================================
Nueva versión de pruebas con base de datos: bodega-agro2.2.
El proyecto anterior bodega-agro2 queda como versión 1 y no se elimina para fututo uso o recoleccion
de un dato.

CUENTAS DE PRUEBA
Administrador
  Correo: admin@bodegas.local
  Clave: Bodegas2026!
Instructor de Agrotecnia
  Correo: instructor@bodegas.local
  Clave: Instructor2026!
Coordinador
  Correo: coordinador@bodegas.local
  Clave: Coordinador2026!
Encargado de bodega
  Correo: bodega@bodegas.local
  Clave: Bodega2026!

ROLES Y PERMISOS
Administrador:
- Dashboard global, inventario, solicitudes, autorizaciones, entregas y movimientos.
- Crear artículos y consultar todo.
Instructor:
- Crear solicitudes por bodega, agregar artículos/cantidades, justificar, fecha opcional,
  consultar únicamente sus solicitudes.
Coordinador:
- Consultar solicitudes, autorizar o rechazar; puede agregar observación.
Encargado de bodega:
- Consultar inventario, registrar artículos y entradas, consultar movimientos,
  registrar entregas de solicitudes autorizadas y descontar existencias.

FLUJO DE SOLICITUD
Instructor crea solicitud -> Coordinador autoriza/rechaza -> Encargado de bodega entrega
-> el stock se descuenta y el movimiento de salida queda registrado.
El administrador puede supervisar el proceso y también autorizar/entregar.

FUNCIONES NUEVAS PRESENTES EN ESTA VERSIÓN
- Login con contraseña hash.
- Panel según rol.
- Crear solicitudes de instructor.
- Revisión/aprobación/rechazo por Coordinador y Administrador.
- Inventario: búsqueda, alta de artículos, entradas de stock.
- Entregas de solicitudes aprobadas, control básico de stock, registro de movimientos.
- Bodegas de muestra: Vivero, Flores, Ganadería y Construcción.

NOTAS
- Esta es una versión base deL trabajo de BODEGA. Los formularios y permisos están programados,
  probar solicitudes.
