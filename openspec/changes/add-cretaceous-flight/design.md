# Design

## Context

`dist/game.js` ejecuta la simulación de Canvas en unidades de 60 Hz con subpasos para las colisiones rápidas. Las zonas se recorren por índice y `isWater()` identifica las dos zonas acuáticas por su posición. `dist/index.html` ofrece controles táctiles y una región de estado para lectores de pantalla. El comportamiento esperado está en [aerial-map](specs/aerial-map/spec.md).

## Goals / Non-Goals

**Goals**

- Encapsular la física del vuelo y los patrones de amenazas en el mapa aéreo.
- Reutilizar el bucle de simulación, el desplazamiento lateral y los controles de pausa, reinicio y DASH.

**Non-Goals**

- El alcance se limita a la carrera de desplazamiento lateral y sus controles de altura. La exploración libre y el combate quedan para cambios futuros.

## Decisions

### Modo de movimiento declarado por zona

Cada zona declara `land`, `water` o `air`. La transición lee ese modo para inicializar la altura, limpiar obstáculos e inputs previos y actualizar las instrucciones. La secuencia sigue usando el orden de `zones`, con el sexto elemento después de Mar Neón y regreso cíclico al Desierto. La entrada al aire fija la velocidad vertical en cero y coloca a Dino a media altura.

Ampliar la comparación por índices sería un cambio más pequeño, con el costo de acoplar físicas y orden de mapas. Declarar el modo por zona permite cambiar el orden sin alterar la forma en que Dino se mueve.

### Física de vuelo y controles sostenidos

En el aire la simulación alterna entre ascenso, planeo y descenso rápido según los controles sostenidos. El descenso tiene prioridad si ambos están pulsados. La altura y la velocidad vertical se limitan al rango jugable, con la zona de peligro inferior dentro de ese rango. Durante DASH se conserva la altura, el avance horizontal y la invulnerabilidad del motor actual. Al terminar, se vuelve a evaluar el control vigente.

Cada tecla y puntero conserva su propio estado para que soltar una entrada no libere otra que sigue pulsada. Se limpian las entradas aéreas al cambiar de zona, iniciar, morir, pausar o perder el foco. Los botones táctiles usan captura de puntero y liberación al cancelar el gesto. Las etiquetas visibles y accesibles cambian al entrar al aire y al salir.

El aleteo por toque sería familiar para quien acaba de nadar y requeriría pulsaciones repetidas. Mantener para subir facilita ajustar la altura con teclado y pantalla táctil.

### Patrones de amenazas con pasos alcanzables

El mapa usa secuencias cortas predefinidas. Los contactos se ordenan por etapas dentro de los 20 segundos activos. El pterosaurio aislado aparece tras la ventana de despegue. Los acantilados y el viento introducen pasos de altura. Las últimas secuencias incorporan depredadores cerca de la superficie, ceniza que bloquea una franja y meteoritos con aviso de impacto.

Las cajas de colisión siguen la silueta jugable. Las ráfagas son zonas de empuje vertical señalizadas. La ceniza y los meteoritos marcan su área antes de activarse. Al combinar amenazas, se calculan la abertura útil y el tiempo para alcanzarla teniendo en cuenta la caja de Dino, la velocidad horizontal, el empuje y los límites de ascenso y descenso. Los patrones incluyen espacio para recuperar altura antes del siguiente encuentro.

La generación aleatoria por obstáculo, que el juego emplea en tierra y agua, daría más variedad. Los patrones definidos facilitan verificar todas las combinaciones a la velocidad inicial del sexto mapa y al máximo de 10 unidades por paso, que puede alcanzarse en vueltas posteriores.

## Risks / Trade-offs

- Controles retenidos tras perder el foco → Limpiar entradas en las transiciones y comprobar pausa, cambio de pestaña, cancelación táctil y pulsaciones simultáneas.
- Paso visible que resulta físicamente inalcanzable → Verificar cada patrón completo con DASH en recarga, incluida la trayectoria de recuperación antes del siguiente patrón.
- Señales difíciles de leer en móvil o con movimiento reducido → Usar siluetas, marcas de área y dirección además del color. Conservar las señales aunque se reduzcan los efectos decorativos.
- Regresiones en salto o nado al añadir el tercer modo → Verificar los cinco mapas actuales y los cambios de tierra a agua, de agua a aire y de aire a tierra con los controles existentes.

## Migration Plan

El sitio conserva el despliegue estático de `dist/` y la clave de récord `dino-rift-best`. Los archivos HTML y JavaScript se publican juntos. Una reversión puede restaurar ambos archivos desde la revisión anterior y conservar el récord guardado en el navegador.
