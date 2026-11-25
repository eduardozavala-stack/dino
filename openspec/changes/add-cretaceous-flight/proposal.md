# Proposal

## Why

La llegada a Mar Neón ofrece una transición natural del nado al vuelo. Un sexto mapa daría al jugador una habilidad nueva y amenazas que exigen elegir la altura, manteniendo la progresión de la carrera.

## What Changes

- Agregar **Cielos del Cretácico** como sexto mapa, inmediatamente después de Mar Neón. Dino despega a media altura y recibe una breve introducción a los controles.
- Permitir ascenso sostenido, planeo y descenso rápido con teclado y controles táctiles. El DASH mantiene su función de avance e invulnerabilidad breve.
- Introducir pterosaurios, acantilados, ráfagas, depredadores de superficie, ceniza volcánica y meteoritos anunciados. Cada combinación ofrece un paso alcanzable sin DASH.
- Mantener los 20 segundos de juego activo por zona, la puntuación continua, el récord existente y el recorrido cíclico, que vuelve al Desierto al terminar el sexto mapa.

## Capabilities

### New Capabilities

- `aerial-map` cubre el acceso al mapa aéreo, el control de Dino y las amenazas del recorrido.

### Modified Capabilities

## Impact

- `dist/game.js` concentra la secuencia de mapas, el movimiento, los obstáculos, las colisiones y el dibujo en Canvas.
- `dist/index.html` contiene los controles táctiles, las instrucciones de teclado y el estado anunciado a lectores de pantalla.
- El cambio parte de `main` en `69ca17529cd356353e5a6e7ae10399ccf2e9419c`. El despliegue estático sigue sirviendo `dist/`.
