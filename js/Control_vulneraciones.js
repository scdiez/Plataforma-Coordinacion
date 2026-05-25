function recheckIntersection(layers) {
    //const layers = pilotLayers.getLayers();
    if (layers.length === 0) return;
    
    hasAffection = false;
    const pilotGeo = layers.toGeoJSON();
    const pilotHeight = parseFloat(document.getElementById('pilot-height').value);
    
    let isIntersectingMap = false;
    let isInvadingHeight = false;
    let managerGeo= null;

    managerLayers.eachLayer(managerLayer => {
         managerGeo = managerLayer.toGeoJSON();
        
        try {
            const intersect = turf.intersect(pilotGeo.features[0].geometry, managerGeo.geometry);
            
            if (intersect) {
                isIntersectingMap = true;
                const limit = managerLayer.options.altitudeLimit;
                if (pilotHeight >= limit) {
                    isInvadingHeight = true;
                    hasAffection = true;
                }
            }
        } catch (err) {
            console.error("Error validando el espacio aéreo con Turf.js:", err);
        }
    });

    const res = document.getElementById('affection-result');
    res.classList.remove('hidden');
    
    if (isInvadingHeight) {
        res.innerHTML = `<div class="status-badge status-warn"><b>❌ CONFLICTO CRÍTICO</b><br>Invades el espacio aéreo del helipuerto en planta y altura. Requerirá aprobación manual del gestor.</div>`;
    } else if (isIntersectingMap) {
        res.innerHTML = `<div class="status-badge status-ok" style="background:#eef2ff; color:#3730a3; border-color:#c7d2fe"><b>⚠️ TRÁNSITO BAJO LA SERVIDUMBRE</b><br>Coincides en planta, pero vuelas por debajo del techo crítico. Aprobación directa autorizada con precaución.</div>`;
    } else {
        res.innerHTML = `<div class="status-badge status-ok"><b>✅ ESPACIO LIBRE</b><br>No interfieres con ninguna infraestructura aeronáutica registrada en la nube.</div>`;
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

    try {
        // 3. Inserción en base de datos
        const { data, error } = await supabaseClient
            .from('flight_requests')
            .insert([
                { pilot_polygon: geojson, pilot_height: height, reference_code: refCode, status: status }
            ]);

        // Si Supabase devuelve un error, lo lanzamos para que se muestre en el alert
        if (error) throw error;

        // 4. Mensaje de éxito idéntico al gestor (pero con recarga para limpiar pantalla)
        alert(`¡Éxito! Enviado a la nube.\nCódigo REF: ${refCode}\nEstado: ${status === 'approved' ? 'APROBADO DIRECTO' : 'PENDIENTE GESTOR'}`);
        //lastDrawnLayer = null;
        //location.reload();
        
    } catch (err) {
        alert("Error de subida: " + err.message);
    }
}
