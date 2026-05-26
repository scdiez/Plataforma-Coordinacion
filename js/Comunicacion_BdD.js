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


async function sendFlightRequestToCloud(layers) {
    // 1. Condición idéntica a la del gestor: verificamos la memoria directa
    if (!lastDrawnLayer) return alert("Primero debes dibujar un polígono en el mapa.");

    // 2. Extracción directa idéntica a la del gestor
    const geojson = getGeoJSONForLayer(lastDrawnLayer);
    const height = parseFloat(document.getElementById('flight-height').value);
    const refCode = "SKY-" + Math.floor(100000 + Math.random() * 900000);
    recheckIntersection(layers); // <-- CLAVE: Revalidamos justo antes de enviar para asegurar que el estado es correcto
    const status = hasAffection ? "pending_validation" : "approved";

    const applicantData = currentRole === 'particular'
        ? {
            applicant_type: 'particular',
            applicant_name: document.getElementById('particular-name').value,
            applicant_document: document.getElementById('particular-id').value,
            applicant_email: document.getElementById('particular-email').value,
            applicant_phone: document.getElementById('particular-phone').value
        }
        : {
            applicant_type: 'empresa',
            company_name: document.getElementById('company-name').value,
            company_cif: document.getElementById('company-cif').value,
            company_email: document.getElementById('company-email').value,
            company_phone: document.getElementById('company-phone').value
        };

    const pilotData = {
        pilot_name: document.getElementById('pilot-name').value,
        pilot_document: document.getElementById('pilot-id').value,
        pilot_email: document.getElementById('pilot-email').value,
        pilot_license: document.getElementById('pilot-license').value,
        pilot_description: document.getElementById('pilot-description').value
    };

    try {
        // 4. Inserción en base de datos
        const tableName = currentRole === 'empresa'
            ? 'vuelos_particulares'
            : 'vuelos_empresas';

        const { data, error } = await supabaseClient
            .from(tableName)
            .insert([
                {
                    pilot_polygon: geojson,
                    pilot_height: height,
                    reference_code: refCode,
                    status: status,
                    ...applicantData,
                    ...pilotData
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