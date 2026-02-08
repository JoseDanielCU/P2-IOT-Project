# P2-IOT-Project

## Descripción del Proyecto
Este proyecto consiste en el desarrollo (o port) de un aplicativo móvil hacia una **aplicación web** para comunidades energéticas, donde los usuarios (hogares) pueden **comprar y vender energía producida**, principalmente mediante fuentes renovables (ej: paneles solares).

Además, el sistema integra un módulo de **predicción de consumo y producción** usando datos recolectados, con el fin de mejorar la gestión energética dentro de la comunidad.

## Problemática

Las comunidades energéticas se basan en un principio simple:  
- Algunos hogares producen más energía de la que consumen (**excedente**)  
- Otros hogares consumen más de lo que producen (**déficit**)  

El problema aparece cuando no existe una plataforma que permita:

### Problemas identificados

- Visualizar en tiempo real la energía generada y consumida por cada hogar.
- Gestionar excedentes y déficits de forma automática o eficiente.
- Evitar pérdidas energéticas por falta de distribución del excedente.
- Predecir el consumo y producción para planificar compras/ventas.
- Centralizar la información para facilitar la toma de decisiones.

### Cifras y Estadisticas

- La integración de energías renovables en redes locales incrementa la necesidad de herramientas de gestión debido a la **intermitencia** (ej: energía solar depende del clima).
- La digitalización energética es un factor clave en redes inteligentes (Smart Grids), ya que reduce desperdicio y permite balancear demanda.
- Los sistemas con predicción pueden mejorar la eficiencia de consumo y reducir costos operativos al anticipar picos de demanda.

## Solución Propuesta

Se propone una plataforma web que permita:

### Gestión inteligente de energía

- Registro de hogares productores y consumidores.
- Monitoreo en tiempo real del consumo y producción.
- Compra y venta de excedentes dentro de la comunidad.
- Sistema de predicción basado en datos históricos y variables externas.

### Predicción de consumo y producción

- Predicción del consumo futuro de cada hogar.
- Predicción de producción futura (especialmente solar).
- Visualización comparativa: real vs predicho.
- Soporte para decisiones como:
  - ¿Cuándo vender?
  - ¿Cuándo comprar?
  - ¿Qué hogares tendrán déficit?
 
### Visualización en tiempo real
- Dashboard comunitario con:
  - Promedios de consumo
  - Producción actual
  - Excedente total
  - Déficit total
  - Energía disponible para venta
  - Predicciones próximas (24h, 7 días, etc.)
## Arquitectura del Sistema

### Arquitectura General
El sistema se divide en 3 componentes principales:

1. **Frontend Web (UI/UX)**
2. **Backend/API **
3. **Módulo de Predicción (ML)**

## Tecnologias

### Frontend
### Backend
### Base de Datos
### Predicción y Datos
### Despliegue
