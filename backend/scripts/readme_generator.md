# 🚀 Generador Automático de CRUD

Este generador crea automáticamente modelos, controladores y rutas para tus tablas de SQL Server con **configuración personalizable**.

## 📋 Características

✅ Lee el esquema de la base de datos automáticamente  
✅ **Configuración flexible por tabla** (multiselect, JOINs, búsquedas)  
✅ Genera modelos con filtros dinámicos integrados  
✅ Crea controladores con paginación y búsqueda  
✅ Incluye endpoint para valores únicos (multiselect)  
✅ Genera rutas REST completas  
✅ Soporte para filtros avanzados de PrimeNG  

## 🎯 Uso Rápido

### 1. Ver configuración de una tabla

```bash
node generate-crud.js archivos_municipio --list-config
```

Esto muestra la configuración actual:
```
📋 Configuración para: archivos_municipio

Multiselect: [ 'tipo_archivo', 'categoria_archivo', 'subcategoria_archivo', 'estatus_archivo', 'nombre_municipio' ]
Filtros de fecha: [ 'fecha_archivo', 'fecha_modificacion' ]
Excluir de filtros: [ 'archivo' ]
Campos de búsqueda: [ 'nombre_archivo', 'palabras_clave', 'categoria_archivo' ]
Ordenamiento por defecto: { field: 'fecha_modificacion', order: 'DESC' }

JOINs configurados:
  - municipios (m): a.id_municipio = m.id_municipio
```

### 2. Generar CRUD

```bash
node generate-crud.js archivos_municipio
```

### 3. Generar múltiples tablas

```bash
node generate-crud.js documentos_cendoc revistas archivos_municipio
```

## ⚙️ Configuración Personalizada

### Editar `scripts/crud.config.js`

```javascript
module.exports = {
  // Configuración para tu tabla
  mi_tabla: {
    // 🔢 Columnas que deben ser multiselect
    multiselect: [
      'tipo_archivo',
      'categoria_archivo',
      'estatus'
    ],
    
    // 📅 Columnas de fecha
    dateFilters: [
      'fecha_registro',
      'fecha_modificacion'
    ],
    
    // 🚫 Columnas que NO deben tener filtros
    excludeFromFilters: [
      'archivo',
      'password_hash'
    ],
    
    // 🔗 JOINs con otras tablas
    joins: [
      {
        table: 'municipios',
        alias: 'm',
        on: 'a.id_municipio = m.id_municipio',
        selectFields: ['m.nombre as nombre_municipio']
      },
      {
        table: 'categorias',
        alias: 'c',
        on: 'a.id_categoria = c.id_categoria',
        selectFields: ['c.nombre as nombre_categoria']
      }
    ],
    
    // 🔍 Campos para búsqueda global
    searchFields: [
      'nombre',
      'descripcion',
      'palabras_clave'
    ],
    
    // 📊 Ordenamiento por defecto
    defaultSort: {
      field: 'fecha_modificacion',
      order: 'DESC'
    }
  }
};
```

## 📝 Ejemplos de Configuración

### Ejemplo 1: Tabla simple sin JOINs

```javascript
const archivosMunicipioRoutes = require('./routes/archivos_municipioRoutes');
app.use('/api/archivos_municipio', archivosMunicipioRoutes);
```

### 2. Usar en Angular (Frontend)

#### Servicio TypeScript

```typescript
// Agregar método al servicio
getValoresUnicos(): Observable<{
  success: boolean;
  data: {
    tipo_archivo: string[];
    categoria_archivo: string[];
    subcategoria_archivo: string[];
  };
}> {
  return this.http.get<any>(`${this.apiUrl}/valores-unicos`);
}
```

#### Componente

```typescript
readonly valoresUnicos = signal<any>({});

constructor() {
  this.apiService.getValoresUnicos().subscribe({
    next: (resp) => {
      if (resp.success && resp.data) {
        this.valoresUnicos.set(resp.data);
      }
    }
  });
}

// Computed para opciones
readonly tipoOptions = computed(() => 
  this.valoresUnicos().tipo_archivo?.map(v => ({ 
    label: v, 
    value: v 
  })) || []
);
```

#### Configuración de columnas

```typescript
columns: ColumnConfig[] = [
  {
    field: 'tipo_archivo',
    header: 'Tipo',
    filterType: 'multiselect',
    renderAs: 'tag',
    options: this.tipoOptions // ← Opciones desde backend
  }
];
```

## 🎨 Tipos de Filtros Generados

El generador reconoce automáticamente el tipo de dato:

| Tipo SQL | Filtro | Operadores |
|----------|--------|------------|
| `varchar`, `nvarchar`, `text` | `string` | contains, startsWith, endsWith, equals, notEquals |
| `int`, `bigint`, `decimal`, `money` | `int` | equals, notEquals, lt, lte, gt, gte |
| `date`, `datetime`, `datetime2` | `date` | dateIs, dateIsNot, dateBefore, dateAfter |

## 📚 Ejemplo Completo

### 1. Generar archivos
```bash
node generate.js productos
```

### 2. Registrar en app.js
```javascript
const productosRoutes = require('./routes/productosRoutes');
app.use('/api/productos', productosRoutes);
```

### 3. Usar en Angular
```typescript
// En el servicio
class ApiProductos {
  getValoresUnicos() {
    return this.http.get(`${this.apiUrl}/valores-unicos`);
  }
  
  getFiltrados(filtros: any) {
    let params = new HttpParams();
    Object.keys(filtros).forEach(key => {
      if (filtros[key]) {
        params = params.set(key, filtros[key].toString());
      }
    });
    return this.http.get(`${this.apiUrl}/filtrados`, { params });
  }
}

// En el componente
columns: ColumnConfig[] = [
  {
    field: 'categoria',
    header: 'Categoría',
    filterType: 'multiselect',
    options: this.categoriaOptions
  }
];
```

## ⚠️ Consideraciones

### Tablas con JOINs

Si tu tabla usa JOINs (como `archivos_municipio` con `municipios`), necesitarás modificar manualmente el modelo:

```javascript
// En el método getFiltrados, cambiar:
let query = `SELECT * FROM ${tableName} WHERE 1=1`;

// Por:
let query = `
  SELECT 
    a.*,
    m.nombre as nombre_municipio
  FROM ${tableName} a
  INNER JOIN municipios m ON a.id_municipio = m.id_municipio
  WHERE 1=1
`;
```

### Campos con archivos

Para tablas que manejan uploads, modifica el controlador:

```javascript
// Agregar manejo de archivos en create/update
const path = require('path');
const fs = require('fs');

// En create:
const baseFolder = `${backendPublicPath}/${TABLE_NAME}/${id}`;
fs.mkdirSync(baseFolder, { recursive: true });

if (req.files && req.files.archivo) {
  const archivo = req.files.archivo[0];
  const oldPath = path.join(tempPath, archivo.filename);
  const newPath = path.join(baseFolder, archivo.filename);
  fs.renameSync(oldPath, newPath);
  
  await Model.update(TABLE_NAME, id, { 
    archivo: archivo.filename 
  }, ID_COLUMN);
}
```

### Multiselect personalizado

El generador detecta campos con nombres comunes (`estatus`, `tipo`, `categoria`) como multiselect. Para personalizar:

```javascript
// En el controlador, modificar:
estatus: estatus ? parseArrayParam(estatus, "string") : [],
```

## 🐛 Solución de Problemas

### Error: "Cannot find module"
```bash
# Asegúrate de estar en la carpeta backend
cd backend
node generate.js tabla
```

### Error: "Connection failed"
Verifica tu configuración en `config/database.js`:
```javascript
const config = {
  server: 'localhost',
  database: 'tu_base_de_datos',
  // ...
};
```

### Los filtros no funcionan
Verifica que los filtros estén configurados en `utils/filters.js` y que el modelo use `buildConditions`.

## 📝 Notas

- El generador es compatible con SQL Server (MSSQL)
- Los campos con `IDENTITY` se excluyen automáticamente de los filtros
- Los campos `fecha_modificacion` y `fecha_captura` se excluyen de validaciones
- El endpoint `valores-unicos` solo devuelve valores para campos de texto

## 🔄 Próximas Mejoras

- [ ] Soporte para PostgreSQL y MySQL
- [ ] Generación de interfaces TypeScript
- [ ] Opción `--all` para todas las tablas
- [ ] Templates personalizables
- [ ] Generación de tests unitarios

## 📞 Soporte

Si encuentras algún problema o necesitas ayuda, revisa:
1. La consola del backend para errores SQL
2. La consola del navegador para errores HTTP
3. Los logs del generador

---

**Creado con ❤️ para automatizar tu backend**