/**
 * Ejemplo de uso del sistema de gestión de proyectos Jira - Ticket Service Form
 * 
 * Este archivo demuestra cómo usar los endpoints del sistema de gestión de proyectos
 * para cambiar dinámicamente el proyecto activo y crear tickets desde formularios.
 */

const BASE_URL = 'http://localhost:3000';

// Función auxiliar para hacer peticiones HTTP
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Ejemplo 1: Obtener el proyecto activo actual
async function getCurrentProject() {
  console.log('\n=== Obtener Proyecto Activo ===');
  
  const result = await makeRequest(`${BASE_URL}/api/projects/current`);
  
  if (result.success) {
    console.log('✅ Proyecto activo:', result.data.currentProject?.name || 'Ninguno');
    console.log('📋 Detalles:', JSON.stringify(result.data.currentProject, null, 2));
  } else {
    console.log('❌ Error:', result.data?.error || result.error);
  }
  
  return result;
}

// Ejemplo 2: Obtener todos los proyectos disponibles
async function getAvailableProjects() {
  console.log('\n=== Obtener Proyectos Disponibles ===');
  
  const result = await makeRequest(`${BASE_URL}/api/projects/available`);
  
  if (result.success) {
    console.log(`✅ Se encontraron ${result.data.availableProjects?.length || 0} proyectos:`);
    result.data.availableProjects?.forEach(project => {
      console.log(`   - ${project.key}: ${project.name}`);
    });
  } else {
    console.log('❌ Error:', result.data?.error || result.error);
  }
  
  return result;
}

// Ejemplo 3: Buscar proyectos
async function searchProjects(query) {
  console.log(`\n=== Buscar Proyectos: "${query}" ===`);
  
  const result = await makeRequest(`${BASE_URL}/api/projects/search?query=${encodeURIComponent(query)}`);
  
  if (result.success) {
    console.log(`✅ Se encontraron ${result.data.availableProjects?.length || 0} proyectos que coinciden:`);
    result.data.availableProjects?.forEach(project => {
      console.log(`   - ${project.key}: ${project.name}`);
    });
  } else {
    console.log('❌ Error:', result.data?.error || result.error);
  }
  
  return result;
}

// Ejemplo 4: Cambiar proyecto activo
async function setActiveProject(projectKey) {
  console.log(`\n=== Cambiar Proyecto Activo a: ${projectKey} ===`);
  
  const result = await makeRequest(`${BASE_URL}/api/projects/set-active`, {
    method: 'POST',
    body: JSON.stringify({ projectKey })
  });
  
  if (result.success) {
    console.log('✅ Proyecto cambiado exitosamente');
    console.log('📋 Nuevo proyecto activo:', result.data.currentProject?.name);
  } else {
    console.log('❌ Error:', result.data?.error || result.error);
  }
  
  return result;
}

// Ejemplo 5: Crear ticket desde formulario (usa proyecto activo)
async function createTicketFromForm(formData) {
  console.log('\n=== Crear Ticket desde Formulario ===');
  
  const result = await makeRequest(`${BASE_URL}/api/tickets/landing`, {
    method: 'POST',
    body: JSON.stringify(formData)
  });
  
  if (result.success) {
    console.log('✅ Ticket creado exitosamente desde formulario');
    console.log('🎫 Ticket ID:', result.data.jiraIssue?.key);
    console.log('🔗 URL:', result.data.jiraIssue?.url);
  } else {
    console.log('❌ Error:', result.data?.error || result.error);
  }
  
  return result;
}

// Ejemplo 6: Crear ticket directo (usa proyecto activo)
async function createTicketDirect(ticketData) {
  console.log('\n=== Crear Ticket Directo ===');
  
  const result = await makeRequest(`${BASE_URL}/api/tickets/create`, {
    method: 'POST',
    body: JSON.stringify(ticketData)
  });
  
  if (result.success) {
    console.log('✅ Ticket creado exitosamente');
    console.log('🎫 Ticket ID:', result.data.jiraIssue?.key);
    console.log('🔗 URL:', result.data.jiraIssue?.url);
  } else {
    console.log('❌ Error:', result.data?.error || result.error);
  }
  
  return result;
}

// Ejemplo 7: Validar conexión con Jira
async function validateConnection() {
  console.log('\n=== Validar Conexión con Jira ===');
  
  const result = await makeRequest(`${BASE_URL}/api/projects/validate-connection`);
  
  if (result.success) {
    console.log('✅ Conexión exitosa');
    console.log('📋 Mensaje:', result.data.message);
  } else {
    console.log('❌ Error:', result.data?.error || result.error);
  }
  
  return result;
}

// Ejemplo 8: Obtener estado del ProjectManager
async function getProjectManagerStatus() {
  console.log('\n=== Estado del ProjectManager ===');
  
  const result = await makeRequest(`${BASE_URL}/api/projects/status`);
  
  if (result.success) {
    console.log('✅ Estado obtenido exitosamente');
    console.log('📋 Proyecto activo:', result.data.currentProject?.name || 'Ninguno');
    console.log('📊 Proyectos en cache:', result.data.availableProjects?.length || 0);
  } else {
    console.log('❌ Error:', result.data?.error || result.error);
  }
  
  return result;
}

// Flujo completo de ejemplo para Ticket Service Form
async function runCompleteExample() {
  console.log('🚀 Iniciando ejemplo completo del sistema de gestión de proyectos Jira - Ticket Service Form\n');
  
  try {
    // 1. Validar conexión
    await validateConnection();
    
    // 2. Obtener proyecto actual
    await getCurrentProject();
    
    // 3. Obtener proyectos disponibles
    await getAvailableProjects();
    
    // 4. Buscar proyectos
    await searchProjects('dev');
    
    // 5. Cambiar proyecto activo (ejemplo)
    // await setActiveProject('NEW');
    
    // 6. Obtener estado del ProjectManager
    await getProjectManagerStatus();
    
    // 7. Crear un ticket desde formulario (simulando formulario web)
    const formData = {
      name: 'María García',
      email: 'maria.garcia@example.com',
      company: 'Empresa de Ejemplo',
      phone: '+52 55 9876 5432',
      message: 'Este es un ticket de prueba creado desde un formulario web usando el sistema de gestión de proyectos.'
    };
    
    await createTicketFromForm(formData);
    
    // 8. Crear un ticket directo (simulando integración API)
    const ticketData = {
      name: 'Carlos López',
      email: 'carlos.lopez@example.com',
      company: 'Otra Empresa',
      phone: '+52 55 1111 2222',
      message: 'Este es un ticket creado directamente desde la API usando el proyecto activo.'
    };
    
    await createTicketDirect(ticketData);
    
    console.log('\n✅ Ejemplo completo ejecutado exitosamente');
    console.log('\n📝 Notas importantes:');
    console.log('   - Ambos tickets se crearon usando el proyecto activo actual');
    console.log('   - El sistema permite cambiar el proyecto sin reiniciar el servidor');
    console.log('   - Los formularios web usan automáticamente el proyecto activo');
    console.log('   - La API mantiene compatibilidad con el código existente');
    
  } catch (error) {
    console.error('\n❌ Error durante la ejecución del ejemplo:', error);
  }
}

// Ejemplo específico para formularios web
async function runFormExample() {
  console.log('🌐 Ejemplo específico para formularios web\n');
  
  try {
    // Simular diferentes escenarios de formulario
    const scenarios = [
      {
        name: 'Juan Pérez',
        email: 'juan.perez@empresa1.com',
        company: 'Empresa 1',
        phone: '+52 55 1234 5678',
        message: 'Consulta sobre servicios de desarrollo web'
      },
      {
        name: 'Ana Martínez',
        email: 'ana.martinez@empresa2.com',
        company: 'Empresa 2',
        phone: '+52 55 8765 4321',
        message: 'Solicitud de cotización para proyecto móvil'
      },
      {
        name: 'Luis Rodríguez',
        email: 'luis.rodriguez@empresa3.com',
        company: 'Empresa 3',
        phone: '+52 55 5555 1234',
        message: 'Interés en servicios de consultoría tecnológica'
      }
    ];
    
    console.log('📋 Creando tickets para diferentes empresas...\n');
    
    for (let i = 0; i < scenarios.length; i++) {
      console.log(`--- Escenario ${i + 1} ---`);
      await createTicketFromForm(scenarios[i]);
      console.log(''); // Línea en blanco para separar
    }
    
    console.log('✅ Todos los tickets de formulario creados exitosamente');
    
  } catch (error) {
    console.error('\n❌ Error durante la ejecución del ejemplo de formularios:', error);
  }
}

// Ejecutar ejemplo si se llama directamente
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  global.fetch = fetch;
  
  // Ejecutar ejemplo completo
  runCompleteExample()
    .then(() => {
      console.log('\n' + '='.repeat(60));
      // Ejecutar ejemplo específico de formularios
      return runFormExample();
    })
    .catch(console.error);
} else {
  // Browser environment
  console.log('Para ejecutar este ejemplo en el navegador:');
  console.log('1. runCompleteExample() - Ejemplo completo');
  console.log('2. runFormExample() - Ejemplo específico de formularios');
}

// Exportar funciones para uso individual
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getCurrentProject,
    getAvailableProjects,
    searchProjects,
    setActiveProject,
    createTicketFromForm,
    createTicketDirect,
    validateConnection,
    getProjectManagerStatus,
    runCompleteExample,
    runFormExample
  };
}

