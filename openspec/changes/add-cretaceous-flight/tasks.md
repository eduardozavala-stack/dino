# Tasks

## 1. Secuencia de mapas

- [x] 1.1 Declarar el modo de movimiento en cada zona de `dist/game.js` y seleccionar el modo por sus datos. Verificar salto y agachado en las zonas terrestres y ascenso y descenso en las dos zonas acuáticas.
- [x] 1.2 Añadir Cielos del Cretácico después de Mar Neón con entrada a media altura y transición de vuelta al Desierto. Verificar los niveles 05, 06 y 07, la duración activa de cada zona, la continuidad de los puntos y el reinicio al nivel 01.

## 2. Vuelo y controles

- [x] 2.1 Implementar ascenso sostenido, planeo, descenso rápido y límites de altura en la simulación por subpasos. Verificar los tres movimientos, la prioridad del descenso al combinar entradas y la respuesta en los bordes.
- [x] 2.2 Conectar entradas sostenidas de teclado y puntero, y adaptar etiquetas, ayuda y anuncios en `dist/index.html`. Verificar dos entradas de ascenso simultáneas, cancelación táctil, pérdida de foco y reanudación desde pausa con las entradas liberadas.
- [x] 2.3 Integrar DASH con el vuelo y verificar avance, altura durante el impulso, contacto protegido y recarga de 3,5 segundos activos. Confirmar que el indicador y el control vuelven a estar disponibles al completar la recarga.

## 3. Amenazas y ritmo

- [x] 3.1 Dibujar el mapa, los pterosaurios, los acantilados, las ráfagas, los depredadores de superficie, la ceniza y los meteoritos. Implementar hitboxes, empujes y avisos previos. Verificar contactos, límites de las zonas de empuje y lectura de señales en pantalla pequeña y con movimiento reducido.
- [x] 3.2 Programar el despegue protegido y las secuencias progresivas. Verificar al menos dos segundos sin contactos de peligro, el pterosaurio inicial y la aparición posterior de los seis tipos dentro de la zona.
- [x] 3.3 Recorrer cada secuencia y sus transiciones sin DASH a la velocidad inicial del nivel 06 y al tope de 10 unidades por paso. Registrar la trayectoria viable y el espacio de recuperación de cada combinación.

## 4. Integración

- [x] 4.1 Recorrer Mar Neón, Cielos del Cretácico y el Desierto con teclado y controles táctiles. Comprobar la actualización de ayuda, pausa y reanudación, derrota y reinicio, y conservación de un récord guardado antes del cambio.

## Verificación de las rutas

El simulador recorrió el mapa con ascenso, planeo y descenso, con el DASH en recarga durante los encuentros. La altura se mide en unidades del lienzo sobre la línea del suelo. La recuperación es el tiempo entre el último cruce de una amenaza y el primer cruce de la secuencia siguiente, o la salida de zona en el último tramo.

| Secuencia | Altura en nivel 06 | Recuperación en nivel 06 | Altura a velocidad máxima | Recuperación a velocidad máxima |
| --- | ---: | ---: | ---: | ---: |
| Pterosaurio inicial | 23–25 | 3,08 s | 24–25 | 3,13 s |
| Acantilados y corriente descendente | 69–75 | 3,33 s | 69–75 | 3,37 s |
| Ceniza y depredador | 61–63 | 3,22 s | 61–63 | 3,27 s |
| Meteorito y paso bajo | 27–29 | 3,03 s | 27–29 | 3,08 s |
| Ascenso final con corriente, acantilado y fauna | 90–97 | 3,02 s | 91–97 | 3,17 s |
