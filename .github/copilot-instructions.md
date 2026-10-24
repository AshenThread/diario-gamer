# Configuración de agentes y trabajo con IA

## Alcance

Estas instrucciones describen el contexto de colaboración usado para
`diario-gamer`. No contienen credenciales, tokens ni instrucciones para
reproducir conversaciones privadas.

## Agentes y skills utilizados

- **Frontend design**: dirección visual del hero, baraja, fondos temáticos,
  microinteracciones, tipografías y accesibilidad.
- **Agent customization**: organización de esta configuración y documentación
  de agentes, skills y prompts dentro del workspace.
- **Agentes de exploración y validación**: revisión puntual de estructura,
  builds, estado del repositorio y comprobaciones del despliegue.
- **GitHub CLI**: ramas de trabajo, pull requests, merges y verificación del
  historial.

## Forma de trabajo

1. El propietario definió la intención del producto, el modelo de datos, los
   juegos, la estética, las interacciones y las decisiones de producto.
2. La IA propuso alternativas de implementación, estilos, nombres de fuentes,
   animaciones y validaciones.
3. El propietario revisó visualmente cada cambio, pidió iteraciones y realizó
   las conexiones y configuraciones necesarias entre frontend, backend,
   MongoDB, variables de entorno y Render.
4. Cada cambio aceptado se validó con builds, comprobaciones de formato,
   revisión en navegador y, cuando correspondió, un branch y un pull request.

La distribución declarada del proceso es aproximadamente **90% dirección,
decisiones, integración y revisión del propietario** y **10% sugerencias
asistidas por IA**. La IA funcionó como apoyo técnico; las conexiones entre
las partes del sistema y la decisión final de cada cambio fueron realizadas
por el propietario.

## Prompt de trabajo base

> Trabaja sobre este proyecto React, TypeScript, Express, Mongoose y MongoDB.
> Respeta la estructura existente, conserva la accesibilidad y `prefers-reduced-motion`,
> revisa el contexto antes de editar, realiza cambios quirúrgicos, valida con
> las herramientas del repositorio y documenta solo decisiones verificables.
> La interfaz debe sentirse como un diario personal de progreso gamer, no como
> una plantilla genérica. Prioriza claridad, identidad visual por juego,
> estados de carga/error/vacío y una separación limpia entre modelo, servicio,
> controlador, ruta y pantalla.

Las peticiones posteriores fueron incrementales y específicas: primero
modelo y CRUD, después partidas y resumen, luego ficha, despliegue,
accesibilidad, baraja, fondos, tipografías y glitch. No se copiaron fuentes
propietarias ni se almacenaron secretos en el repositorio.

## Criterios para futuras modificaciones

- Mantener la separación entre `backend/src/modelos`, `servicios`,
  `controladores` y `rutas`.
- Mantener formularios controlados y errores explícitos.
- No introducir credenciales, URLs privadas ni datos sensibles.
- Validar frontend y backend antes de integrar.
- Preferir una rama de trabajo y un pull request para cambios de entrega.
- Mantener el README como documentación del sistema, no como una guía de
  asistencia personalizada.
