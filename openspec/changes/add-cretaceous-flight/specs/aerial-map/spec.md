# Spec Delta

## Purpose

Permite continuar la carrera de Dino en un mapa aéreo donde elegir la altura y anticipar amenazas prehistóricas determina cómo avanzar.

## ADDED Requirements

### Requirement: Transición al sexto mapa

El juego SHALL abrir Cielos del Cretácico después de Mar Neón, dentro de la secuencia de zonas de 20 segundos de juego activo, con continuidad de puntuación y récord.

#### Scenario: Despegue después de Mar Neón

- **WHEN** el jugador completa Mar Neón por primera vez
- **THEN** el indicador muestra «06 / CIELOS DEL CRETÁCICO», Dino entra a media altura y se conservan los puntos acumulados
- **AND** el juego anuncia cómo volar y concede al menos dos segundos sin amenazas capaces de alcanzar a Dino

#### Scenario: Continuación de la carrera

- **WHEN** el jugador sobrevive 20 segundos de juego activo en Cielos del Cretácico
- **THEN** la carrera continúa en el Desierto como nivel 07 con los puntos acumulados

#### Scenario: Reinicio después de una colisión

- **WHEN** el jugador reinicia tras perder en Cielos del Cretácico
- **THEN** comienza en el Desierto como nivel 01 con el puntaje de la partida en cero y el récord disponible

### Requirement: Control de altura

El juego SHALL permitir que Dino ascienda al mantener el control de vuelo, planee al soltarlo y descienda más deprisa al mantener el control de bajar, dentro de los límites verticales del mapa.

#### Scenario: Vuelo con teclado

- **WHEN** el jugador mantiene ↑ o Espacio, luego los suelta y después mantiene ↓
- **THEN** Dino asciende, planea y acelera el descenso en ese orden

#### Scenario: Vuelo táctil

- **WHEN** el jugador mantiene y suelta «Volar» o mantiene «Bajar»
- **THEN** los botones producen las mismas acciones que sus equivalentes de teclado
- **AND** al cancelar un toque, el juego libera el control correspondiente

#### Scenario: Regreso tras una pausa

- **WHEN** el jugador pausa o cambia de pestaña con un control de vuelo pulsado y luego reanuda
- **THEN** el tiempo de zona se conserva y Dino planea hasta que el jugador acciona un control de altura de nuevo

### Requirement: DASH durante el vuelo

El juego SHALL conservar el avance y la invulnerabilidad breve del DASH en el aire, con su recarga de 3,5 segundos de juego activo.

#### Scenario: Contacto durante DASH

- **WHEN** Dino entra en contacto con una amenaza que provoca colisión mientras el DASH está activo
- **THEN** la carrera continúa y el indicador anuncia la recarga al terminar el impulso

### Requirement: Amenazas prehistóricas legibles

El mapa aéreo SHALL presentar pterosaurios, acantilados, ráfagas, depredadores de superficie, ceniza volcánica y meteoritos anunciados, con señales visibles antes de los efectos que requieren una reacción.

#### Scenario: Patrones progresivos

- **WHEN** el jugador recorre el mapa desde la entrada hasta la salida
- **THEN** primero encuentra un pterosaurio aislado, luego obstáculos de terreno y viento y después combinaciones que incorporan depredadores, ceniza y meteoritos

#### Scenario: Señales de peligro

- **WHEN** se aproxima una ráfaga, una nube de ceniza o un meteorito
- **THEN** se distingue con antelación la región afectada y, para la ráfaga, la dirección del empuje

### Requirement: Paso seguro sin DASH

Cada secuencia permitida de amenazas SHALL ofrecer una trayectoria resoluble con los controles normales de altura, a la velocidad de esa vuelta y con el DASH en recarga.

#### Scenario: Combinación con DASH en recarga

- **WHEN** aparece una combinación de amenazas y el DASH está en recarga
- **THEN** el jugador puede identificar y alcanzar una abertura segura usando el ascenso, el planeo o el descenso
- **AND** al terminar el patrón dispone de espacio para reaccionar al siguiente
