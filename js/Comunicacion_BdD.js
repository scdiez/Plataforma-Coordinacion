async function fetchZonesFromCloud() {
    try {
        let { data: heliport_zones, error } = await supabaseClient
            .from('heliport_zones')
            .select('*');
            
        if (error) throw error;
        managerLayers.clearLayers();

        if (heliport_zones) {
            heliport_zones.forEach(zone => {
                if (zone.polygon_data) {
                    const layer = L.geoJSON(zone.polygon_data, {
                        style: { color: '#b91c1c', fillOpacity: 0.25, weight: 2 },
                        interactive: false 
                    });
                    
                    layer.eachLayer(l => {
                        l.options.pmIgnore = true; // <-- CLAVE: Geoman ignorará estas capas por completo
                        l.options.altitudeLimit = zone.altitude_limit;
                        l.bindTooltip(`<b>${zone.label}</b><br>Techo: ${zone.altitude_limit}m AMSL`);
                        managerLayers.addLayer(l);
                    });
                }
            });
        }
    } catch (err) {
        console.error("Error al descargar zonas:", err.message);
    }
}

async function Datos_Solicitudes() {
    try {
        let { data: heliport_zones, error } = await supabaseClient
            .from('heliport_zones')
            .select('*');
            
        if (error) throw error;
        managerLayers.clearLayers();

        if (heliport_zones) {
            heliport_zones.forEach(zone => {
                if (zone.polygon_data) {
                    const layer = L.geoJSON(zone.polygon_data, {
                        style: { color: '#b91c1c', fillOpacity: 0.25, weight: 2 },
                        interactive: false 
                    });
                    
                    layer.eachLayer(l => {
                        l.options.pmIgnore = true; // <-- CLAVE: Geoman ignorará estas capas por completo
                        l.options.altitudeLimit = zone.altitude_limit;
                        l.bindTooltip(`<b>${zone.label}</b><br>Techo: ${zone.altitude_limit}m AMSL`);
                        managerLayers.addLayer(l);
                    });
                }
            });
        }
    } catch (err) {
        console.error("Error al descargar zonas:", err.message);
    }
}

async function saveZoneToCloud() {
    if (!lastDrawnLayer) return alert("Primero debes dibujar un polígono en el mapa.");
    
    const geojson = lastDrawnLayer.toGeoJSON();
    const limit = parseFloat(document.getElementById('manager-limit').value);
    const label = document.getElementById('manager-label').value;

    try {
        const { data, error } = await supabaseClient
            .from('heliport_zones')
            .insert([
                { polygon_data: geojson, altitude_limit: limit, label: label }
            ]);

        if (error) throw error;

        alert("¡Éxito! La zona se ha subido a tu base de datos global.");
        lastDrawnLayer = null;
    } catch (err) {
        alert("Error de subida: " + err.message);
    }
}

async function sendFlightRequestToCloud(layers) {
    // 1. Condición idéntica a la del gestor: verificamos la memoria directa
    if (!lastDrawnLayer) return alert("Primero debes dibujar un polígono en el mapa.");
    
    // 2. Extracción directa idéntica a la del gestor
    const geojson = lastDrawnLayer.toGeoJSON();
    const height = parseFloat(document.getElementById('pilot-height').value);
    const refCode = "SKY-" + Math.floor(100000 + Math.random() * 900000);
    recheckIntersection(layers); // <-- CLAVE: Revalidamos justo antes de enviar para asegurar que el estado es correcto
    const status = hasAffection ? "pending_validation" : "approved";

    // 3. Datos del formulario
    const pilotName = document.getElementById('pilot-name').value;
    const pilotCompany = document.getElementById('pilot-company').value;
    const pilotDescription = document.getElementById('pilot-description').value;
    const pilotEmail = document.getElementById('pilot-email').value;

    try {
        // 4. Inserción en base de datos
        const { data, error } = await supabaseClient
            .from('flight_requests')
            .insert([
                { 
                    pilot_polygon: geojson, 
                    pilot_height: height, 
                    reference_code: refCode, 
                    status: status,
                    pilot_name: pilotName,
                    pilot_company: pilotCompany,
                    pilot_description: pilotDescription,
                    pilot_email: pilotEmail
                }
            ]);

        // Si Supabase devuelve un error, lo lanzamos para que se muestre en el alert
        if (error) throw error;

        // 5. Mensaje de éxito idéntico al gestor (pero con recarga para limpiar pantalla)
        alert(`¡Éxito! Enviado a la nube.\nCódigo REF: ${refCode}\nEstado: ${status === 'approved' ? 'APROBADO DIRECTO' : 'PENDIENTE GESTOR'}`);
        lastDrawnLayer = null;
        location.reload();
        
    } catch (err) {
        alert("Error de subida: " + err.message);
    }
}