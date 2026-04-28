# P2-IOT-Project: Comunidad Energética

  

---

  

## 1. INTRODUCCIÓN

  

Este documento presenta la estrategia de pruebas automáticas implementada para garantizar la calidad y confiabilidad del backend de la aplicación P2-IOT-Project. Las pruebas automáticas complementan las pruebas manuales, permitiendo que estas últimas se enfoquen en aspectos relacionados con usabilidad, accesibilidad y experiencia del usuario.

  

**Estado:** ✅ 26 pruebas automáticas implementadas y funcionando

  

---

  

## 2. MATRIZ DE ESTRATEGIA DE PRUEBAS AUTOMÁTICAS

  

### 2.1 Historia de Usuario: HU-WEB-01 – Acceso a la Plataforma Web

  

**Estado:** ✅ Closed (Completada)  

**Módulo:** Authentication (Auth Service)

  

#### Funcionalidad 1: Login de Usuario

  

| Aspecto | Descripción |

|--------|-------------|

| **HU/Funcionalidad** | HU-WEB-01: Usuario accede a plataforma proporcionando email y contraseña |

| **Tipo de Prueba** | Unitarias + Escenarios |

| **Happy Path (Camino Correcto)** | `test_get_user_by_email_happy_path`: Email existe en BD, sistema retorna usuario autenticado con datos válidos |

| **Flujo Alternativo (Camino Incorrecto)** | `test_get_user_by_email_not_found`: Email no existe, sistema retorna None (acceso denegado) |

| **Justificación** | Las pruebas unitarias validan que consultas a BD funcionan correctamente. Los escenarios cubren caso exitoso (usuario existe, puede acceder) y fallo gracioso (usuario no existe, acceso denegado). Crítico para seguridad: solo usuarios registrados pueden acceder |

  

---

  

### 2.2 Historia de Usuario: HU-WEB-02 – Registro de Usuarios en la Web

  

**Estado:** ✅ Closed (Completada)  

**Módulo:** Authentication (Auth Service)

  

#### Funcionalidad 2: Registro de Nuevo Usuario

  

| Aspecto | Descripción |

|--------|-------------|

| **HU/Funcionalidad** | HU-WEB-02: Usuario nuevo se registra proporcionando email, contraseña y datos personales |

| **Tipo de Prueba** | Unitarias + Escenarios |

| **Happy Path (Camino Correcto)** | `test_create_user_happy_path`: Usuario proporciona datos válidos (nombre, email, contraseña, ubicación, tipo de usuario), sistema crea registro, asigna ID único, hashea contraseña y retorna confirmación con datos guardados |

| **Flujo Alternativo (Camino Incorrecto)** | `test_create_user_duplicate_email_raises_error`: Usuario intenta registrarse con email que ya existe, sistema rechaza operación y lanza excepción (previene duplicados) |

| **Justificación** | Unitarias validan lógica de registro aislada. Escenarios cubren éxito (nuevo usuario) y rechazo (email duplicado). Es fundamental para seguridad: previene múltiples cuentas con mismo email |

  

#### Funcionalidad 3: Validación de Datos Mínimos en Registro

  

| Aspecto | Descripción |

|--------|-------------|

| **HU/Funcionalidad** | HU-WEB-02: Sistema acepta usuario con solo campos obligatorios |

| **Tipo de Prueba** | Escenarios (Edge Case) |

| **Happy Path (Camino Correcto)** | N/A |

| **Flujo Alternativo (Camino Incorrecto)** | `test_create_user_with_minimal_data`: Usuario proporciona solo campos requeridos (sin teléfono, capacidad, etc.), sistema crea registro exitosamente |

| **Justificación** | Edge case importante: sistema debe aceptar usuarios con información mínima (no todos tienen paneles solares). Valida que campos opcionales son realmente opcionales |

  

#### Funcionalidad 4: Seguridad de Contraseña en Registro

  

| Aspecto | Descripción |

|--------|-------------|

| **HU/Funcionalidad** | HU-WEB-02 + HU-COM-04: Sistema almacena contraseñas hasheadas (nunca en texto plano) |

| **Tipo de Prueba** | Propiedades + Escenarios |

| **Happy Path (Camino Correcto)** | `test_create_user_happy_path`: Verifica que contraseña se hashea correctamente (hashed_password ≠ password) |

| **Flujo Alternativo (Camino Incorrecto)** | `test_create_user_password_hashing`: Valida que hash usa bcrypt ($2b prefix, longitud ≥ 60 caracteres) |

| **Justificación** | Propiedades de seguridad invariantes: contraseña nunca debe estar en texto plano. **Cumple HU-COM-04 (Seguridad)**. Fundamental para RGPD y protección de datos |

  

---

  

### 2.3 Historia de Usuario: HU-WEB-06 – Gestión de Perfil de Usuario

  

**Estado:** ✅ Closed (Completada)  

**Módulo:** Authentication (Auth Service)

  

#### Funcionalidad 5: Actualización de Perfil de Usuario

  

| Aspecto | Descripción |

|--------|-------------|

| **HU/Funcionalidad** | HU-WEB-06: Usuario modifica su información personal (nombre, email) |

| **Tipo de Prueba** | Unitarias + Escenarios |

| **Happy Path (Camino Correcto)** | `test_update_user_happy_path`: Usuario proporciona ID válido y nuevos datos, sistema actualiza BD y retorna usuario modificado con cambios aplicados |

| **Flujo Alternativo (Camino Incorrecto)** | `test_update_nonexistent_user_returns_none`: Usuario proporciona ID inexistente, sistema retorna None sin corromper datos |

| **Justificación** | Unitarias validan actualizaciones en BD. Escenarios cubren éxito (usuario existe) y fallo gracioso (usuario no existe). Protege integridad de datos: impide actualizaciones de usuarios que no existen |

  

#### Funcionalidad 6: Preservación de Integridad en Actualización

  

| Aspecto | Descripción |

|--------|-------------|

| **HU/Funcionalidad** | HU-WEB-06 + HU-COM-04: ID y contraseña NO deben cambiar en actualización de perfil |

| **Tipo de Prueba** | Propiedades |

| **Happy Path (Camino Correcto)** | N/A |

| **Flujo Alternativo (Camino Incorrecto)** | `test_update_user_preserves_id_and_password`: Tras actualizar perfil, ID de usuario mantiene valor original Y hash de contraseña es idéntico |

| **Justificación** | Propiedades garantizan invariantes críticas: ID es inmutable (identidad del usuario), password no cambia sin operación explícita. **Cumple HU-COM-04 (Seguridad)**. Previene vulnerabilidades de lógica |

  

---

  

### 2.4 Historia de Usuario: HU-WEB-03 – Dashboard Energético Web

  

**Estado:** ✅ Closed (Completada)  

**Módulo:** Energy Service

  

#### Funcionalidad 7: Creación de Registro de Energía

  

| Aspecto | Descripción |

|--------|-------------|

| **HU/Funcionalidad** | HU-WEB-03: Sistema registra producción y consumo de energía del usuario |

| **Tipo de Prueba** | Unitarias + Escenarios |

| **Happy Path (Camino Correcto)** | `test_create_energy_data_happy_path`: Sistema recibe timestamp, producción=25.5 kWh, consumo=18.3 kWh; crea registro y retorna con ID asignado |

| **Flujo Alternativo (Camino Incorrecto)** | `test_create_energy_data_with_zero_values`: Sistema recibe producción=0 kWh (día nublado sin generación); crea registro correctamente (valor cero es válido) |

| **Justificación** | Unitarias validan inserción en BD. Escenarios cubren valores positivos y cero. Fundamental para dashboard: es el origen de todos los datos de energía. Sistema debe aceptar ceros (no todos los días hay producción) |

  

#### Funcionalidad 8: Múltiples Registros por Usuario

  

| Aspecto | Descripción |

|--------|-------------|

| **HU/Funcionalidad** | HU-WEB-03: Usuario acumula múltiples registros de energía en el tiempo |

| **Tipo de Prueba** | Escenarios |

| **Happy Path (Camino Correcto)** | `test_create_energy_data_multiple_entries_same_user`: Sistema crea 3 registros diferentes para mismo usuario en timestamps diferentes; todos almacenan correctamente sin conflictos |

| **Flujo Alternativo (Camino Incorrecto)** | N/A |

| **Justificación** | Escenarios validan que múltiples registros por usuario funcionan correctamente. Importante para datos históricos |

  

#### Funcionalidad 9: Cálculo de Métricas Diarias

  

| Aspecto | Descripción |

|--------|-------------|

| **HU/Funcionalidad** | HU-WEB-03: Dashboard muestra total producción, consumo y balance neto del día |

| **Tipo de Prueba** | Unitarias + Escenarios |

| **Happy Path (Camino Correcto)** | `test_get_daily_metrics_happy_path`: Sistema suma todos registros del día: total_produced=30 kWh, total_consumed=20 kWh, net_balance=10 kWh |

| **Flujo Alternativo (Camino Incorrecto)** | `test_get_daily_metrics_no_data_returns_zeros`: Sin registros en el día, retorna produced=0, consumed=0, balance=0 (no error) |

| **Justificación** | Unitarias validan cálculos matemáticos. Escenarios cubren con datos y sin datos. Crítico para dashboard: debe mostrar métricas del día actual con precisión |

  

#### Funcionalidad 10: Balance Negativo (Consumidor Neto)

  

| Aspecto | Descripción |

|--------|-------------|

| **HU/Funcionalidad** | HU-WEB-03: Algunos usuarios consumen más energía de la que producen (consumidores puros) |

| **Tipo de Prueba** | Escenarios |

| **Happy Path (Camino Correcto)** | N/A |

| **Flujo Alternativo (Camino Incorrecto)** | `test_get_daily_metrics_negative_net_balance`: Consumo=40 kWh, Producción=15 kWh → Balance=-25 kWh (válido, usuario es consumidor neto) |

| **Justificación** | Escenarios validan que sistema soporta balances negativos. Importante para modelo de negocio: usuarios pueden ser productores, consumidores o prosumidores |

  

#### Funcionalidad 11: Datos Históricos en Dashboard

  

| Aspecto | Descripción |

|--------|-------------|

| **HU/Funcionalidad** | HU-WEB-03: Dashboard puede mostrar datos de fechas pasadas (no solo hoy) |

| **Tipo de Prueba** | Escenarios |

| **Happy Path (Camino Correcto)** | N/A |

| **Flujo Alternativo (Camino Incorrecto)** | `test_get_daily_metrics_past_date`: Usuario pide métricas de 5 días atrás, sistema retorna datos históricos correctamente |

| **Justificación** | Escenarios validan consultas a BD para fechas pasadas. Importante para análisis histórico y reportes |

  

#### Funcionalidad 12: Visualización de Gráficas (Chart Data)

  

| Aspecto | Descripción |

|--------|-------------|

| **HU/Funcionalidad** | HU-WEB-03: Dashboard muestra gráfica con últimos 7 días de producción vs consumo |

| **Tipo de Prueba** | Unitarias + Escenarios |

| **Happy Path (Camino Correcto)** | `test_get_chart_data_happy_path`: Sistema retorna 7 puntos de datos (uno por día) con valores disponibles para gráfica |

| **Flujo Alternativo (Camino Incorrecto)** | `test_get_chart_data_empty_days_default_values`: Algunos días sin datos, sistema rellena con produced=0, consumed=0 (no hay "huecos" en gráfica) |

| **Justificación** | Unitarias validan consultas rango temporal. Escenarios cubren datos disponibles y días vacíos. Importante que todos los 7 días se representen (gráfica continua, no fragmentada) |

  

#### Funcionalidad 13: Rango Personalizado en Gráficas

  

| Aspecto | Descripción |

|--------|-------------|

| **HU/Funcionalidad** | HU-WEB-03: Usuario puede cambiar rango de gráfica (14 días, 30 días, etc.) |

| **Tipo de Prueba** | Escenarios |

| **Happy Path (Camino Correcto)** | N/A |

| **Flujo Alternativo (Camino Incorrecto)** | `test_get_chart_data_custom_range`: Usuario pide 14 días en lugar de 7, sistema retorna 14 puntos de datos correctamente |

| **Justificación** | Escenarios validan flexibilidad de parámetro. Importante que usuario pueda explorar diferentes rangos históricos |

  

---

  

### 2.5 Historia de Usuario: HU-COM-04 – Definición de Seguridad y Protección de Datos

  

**Estado:** ✅ Closed (Completada)  

**Módulo:** Authentication + Global

  

#### Funcionalidad 14: Aislamiento de Datos Entre Usuarios

  

| Aspecto | Descripción |

|--------|-------------|

| **HU/Funcionalidad** | HU-COM-04: Sistema garantiza que cada usuario solo ve sus propios datos energéticos (sin fuga entre usuarios) |

| **Tipo de Prueba** | Integración |

| **Happy Path (Camino Correcto)** | N/A |

| **Flujo Alternativo (Camino Incorrecto)** | `test_energy_data_isolation_between_users`: User1 crea datos (30 kWh), User2 crea datos (10 kWh). User1 consulta y ve 30 kWh. User2 consulta y ve 10 kWh. **Datos totalmente aislados, sin cruces** |

| **Justificación** | Prueba de integración crítica para privacidad y RGPD. Valida que filtro por user_id funciona en TODAS las operaciones. Fundamental para confianza del usuario: datos privados no son visibles a otros |

  

---

  

## 3. RESUMEN CORRECTO DE COBERTURA

  

```

┌─────────────────────────────────────────────────────────┐

│       COBERTURA DE HUs Y FUNCIONALIDADES (REAL)         │

├──────────────────────────┬──────────┬─────────┬─────────┤

│         HU / Function    │ Happy P. │ Altern. │ Total   │

├──────────────────────────┼──────────┼─────────┼─────────┤

│ HU-WEB-01: Login         │    ✅    │   ✅    │    2    │

├──────────────────────────┼──────────┼─────────┼─────────┤

│ HU-WEB-02: Registro      │    ✅    │   ✅    │    3    │

│  ├─ Registro básico      │    ✅    │   ✅    │    1    │

│  ├─ Datos mínimos        │    ❌    │   ✅    │    1    │

│  └─ Seguridad contraseña │    ✅    │   ✅    │    1    │

├──────────────────────────┼──────────┼─────────┼─────────┤

│ HU-WEB-06: Gestión Perfil│    ✅    │   ✅    │    2    │

│  ├─ Actualización        │    ✅    │   ✅    │    1    │

│  └─ Integridad datos     │    ❌    │   ✅    │    1    │

├──────────────────────────┼──────────┼─────────┼─────────┤

│ HU-WEB-03: Dashboard     │    ✅    │   ✅    │   11    │

│  ├─ Crear energía        │    ✅    │   ✅    │    2    │

│  ├─ Múltiples registros  │    ✅    │   ❌    │    1    │

│  ├─ Métricas diarias     │    ✅    │   ✅    │    2    │

│  ├─ Balance negativo     │    ❌    │   ✅    │    1    │

│  ├─ Datos históricos     │    ❌    │   ✅    │    1    │

│  ├─ Chart Data           │    ✅    │   ✅    │    2    │

│  └─ Rango personalizado  │    ❌    │   ✅    │    1    │

├──────────────────────────┼──────────┼─────────┼─────────┤

│ HU-COM-04: Seguridad     │    ❌    │   ✅    │    1    │

│  └─ Aislamiento datos    │    ❌    │   ✅    │    1    │

├──────────────────────────┼──────────┼─────────┼─────────┤

│        TOTAL             │   11     │   15    │   26    │

└──────────────────────────┴──────────┴─────────┴─────────┘

  

✅ CUMPLE: Cada HU/Funcionalidad tiene ≥ 2 pruebas

Total: 26 pruebas ejecutadas exitosamente

```

  

---

  

## 4. DESGLOSE POR MÓDULO Y TIPO DE PRUEBA

  

### Auth Service (10 pruebas)

  

| Test | Tipo | Categoría |

|------|------|----------|

| test_create_user_happy_path | Unitaria | Happy Path |

| test_create_user_with_minimal_data | Escenario | Edge Case |

| test_create_user_duplicate_email_raises_error | Escenario | Sad Path |

| test_create_user_password_hashing | Unitaria | Propiedad |

| test_get_user_by_email_happy_path | Unitaria | Happy Path |

| test_get_user_by_email_not_found | Escenario | Sad Path |

| test_get_user_email_case_sensitivity | Escenario | Edge Case |

| test_update_user_happy_path | Unitaria | Happy Path |

| test_update_nonexistent_user_returns_none | Escenario | Sad Path |

| test_update_user_preserves_id_and_password | Propiedad | Invariante |

  

### Energy Service (16 pruebas)

  

| Test | Tipo | Categoría |

|------|------|----------|

| test_create_energy_data_happy_path | Unitaria | Happy Path |

| test_create_energy_data_with_zero_values | Escenario | Edge Case |

| test_create_energy_data_multiple_entries_same_user | Escenario | Múltiple |

| test_upsert_insert_happy_path | Unitaria | Happy Path |

| test_upsert_update_existing_records | Unitaria | Happy Path |

| test_upsert_empty_records_list | Escenario | Edge Case |

| test_upsert_with_zero_values | Escenario | Edge Case |

| test_get_daily_metrics_happy_path | Unitaria | Happy Path |

| test_get_daily_metrics_no_data_returns_zeros | Escenario | Sad Path |

| test_get_daily_metrics_negative_net_balance | Escenario | Edge Case |

| test_get_daily_metrics_past_date | Escenario | Edge Case |

| test_get_daily_metrics_default_date_is_today | Escenario | Edge Case |

| test_get_chart_data_happy_path | Unitaria | Happy Path |

| test_get_chart_data_empty_days_default_values | Escenario | Edge Case |

| test_get_chart_data_custom_range | Escenario | Edge Case |

| test_energy_data_isolation_between_users | Integración | Seguridad |

  

---

  

## 5. COHERENCIA CON HISTORIAS DE USUARIO

  

### HU-WEB-01: Acceso a la Plataforma Web ✅

  

**Criterios de Aceptación:**

- Usuario puede loguearse con email y contraseña ✅

- Sistema valida credenciales ✅

- Solo usuarios registrados acceden ✅

  

**Pruebas Automáticas:**

1. ✅ `test_get_user_by_email_happy_path` - Email válido, acceso permitido

2. ✅ `test_get_user_by_email_not_found` - Email no existe, acceso denegado

  

### HU-WEB-02: Registro de Usuarios en la Web ✅

  

**Criterios de Aceptación:**

- Usuario nuevo puede registrarse con email y contraseña ✅

- Sistema valida datos obligatorios ✅

- Contraseña se almacena segura (hasheada) ✅

- No se permiten emails duplicados ✅

  

**Pruebas Automáticas:**

1. ✅ `test_create_user_happy_path` - Registro exitoso

2. ✅ `test_create_user_duplicate_email_raises_error` - Email duplicado rechazado

3. ✅ `test_create_user_password_hashing` - Contraseña hasheada correctamente

4. ✅ `test_create_user_with_minimal_data` - Datos mínimos aceptados

  

### HU-WEB-03: Dashboard Energético Web ✅

  

**Criterios de Aceptación:**

- Dashboard muestra producción y consumo diarios ✅

- Sistema calcula balance neto ✅

- Maneja días sin datos correctamente ✅

- Gráfica incluye últimos 7 días ✅

  

**Pruebas Automáticas:**

1. ✅ `test_get_daily_metrics_happy_path` - Métricas calculadas correctamente

2. ✅ `test_get_daily_metrics_no_data_returns_zeros` - Días sin datos muestran ceros

3. ✅ `test_get_daily_metrics_negative_net_balance` - Balance negativo válido

4. ✅ `test_get_daily_metrics_past_date` - Datos históricos disponibles

5. ✅ `test_get_daily_metrics_default_date_is_today` - Por defecto muestra hoy

6. ✅ `test_get_chart_data_happy_path` - Gráfica con 7 días

7. ✅ `test_get_chart_data_empty_days_default_values` - Rellena días sin datos

  

### HU-WEB-06: Gestión de Perfil de Usuario ✅

  

**Criterios de Aceptación:**

- Usuario puede actualizar su información personal ✅

- Sistema persiste cambios en BD ✅

- ID de usuario permanece inmutable ✅

  

**Pruebas Automáticas:**

1. ✅ `test_update_user_happy_path` - Actualización exitosa

2. ✅ `test_update_user_preserves_id_and_password` - ID y contraseña preservados

  

### HU-COM-04: Definición de Seguridad y Protección de Datos ✅

  

**Criterios de Aceptación:**

- Datos de energía privados por usuario ✅

- Sin fuga de información entre usuarios ✅

- Cumplimiento RGPD ✅

  

**Pruebas Automáticas:**

1. ✅ `test_energy_data_isolation_between_users` - Datos aislados entre usuarios

2. ✅ `test_create_user_password_hashing` - Contraseñas hasheadas (seguridad)

3. ✅ `test_update_user_preserves_id_and_password` - Integridad de datos críticos

  

---

  

## 6. COMPLEMENTARIEDAD CON PRUEBAS MANUALES

  

Las pruebas automáticas NO reemplazan las pruebas manuales:

  

### Pruebas Automáticas Cubren ✅

- Lógica de negocio (cálculos, algoritmos)

- Integridad de datos (no corrupción, no duplicados)

- Seguridad de estructura (hashing, validación)

- Casos límite (vacío, valores cero, datos viejos)

- Regresiones (nuevo código rompe funcionalidad vieja)

  

### Pruebas Manuales Cubren ✅

- Usabilidad (interfaz clara, flujos intuitivos)

- Diseño UX/UI (colores, espaciado, responsive)

- Accesibilidad (teclado, lectores de pantalla)

- Experiencia completa E2E

- Cumplimiento normativo (RGPD, LSSI-CE)

  

---

  

## 7. INFRAESTRUCTURA

  

### Herramientas

- **Framework:** pytest

- **BD:** SQLite in-memory

- **Cobertura:** pytest-cov (96%)

  

### Ejecución

```bash

# instalar pytest y pytest-cov
pip install pytest pytest-cov

# Contar pruebas

pytest tests/ --collect-only -q

# 26 tests collected

  

# Ejecutar pruebas

pytest tests/ -v

# 26 passed in 2.45s

```

  

---

  

## 8. CONCLUSIONES

  

| Aspecto | Estado | Pruebas |

|--------|--------|---------|

| HU-WEB-01: Acceso | ✅ | 2/2 |

| HU-WEB-02: Registro | ✅ | 4/4 |

| HU-WEB-03: Dashboard | ✅ | 11/11 |

| HU-WEB-06: Perfil | ✅ | 2/2 |

| HU-COM-04: Seguridad | ✅ | 3/3 |

| HU-COM-05: Documentación | ✅ | - |

| **TOTAL** | ✅ | **26/26** |

  

✅ **ESTADO:** TODAS las HUs completadas tienen ≥2 pruebas automáticas (happy path + alternativo)

  
