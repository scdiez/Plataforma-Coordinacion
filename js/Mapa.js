function initMap() {
    if (map) return; 

    managerLayers = L.featureGroup();
    pilotLayers = L.featureGroup();

    L.Browser.touch = false;

    map = L.map('map').setView([40.4168, -3.7038], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(map);
    
    managerLayers.addTo(map);
    pilotLayers.addTo(map);

    map.pm.addControls({
        position: 'topleft',
        drawCircleMarker: false, drawPolyline: false, drawRectangle: false,
        drawCircle: true, drawMarker: false, drawText: false,
        editMode: true, dragMode: false, cutPolygon: false,
        removalMode: true, drawPolygon: true
    });

    map.pm.setGlobalOptions({
        snappable: true,
        snapDistance: 20, 
        snapOtherLayers: false, // <-- CLAVE: Evita que el ratón se pegue a las zonas del gestor
        hintlineStyle: { color: currentRole === 'manager' ? '#b91c1c' : '#1a56db', dashArray: '5,5' }
    });

    map.pm.setPathOptions({
        color: currentRole === 'manager' ? '#b91c1c' : '#1a56db',
        fillOpacity: 0.3
    });

    map.on('pm:create', function (e) {
        const layer = e.layer;
        lastDrawnLayer = layer;
        
        if (currentRole === 'manager') {
            const limit = document.getElementById('manager-limit').value;
            const label = document.getElementById('manager-label').value;
            layer.options.altitudeLimit = parseFloat(limit);
            layer.bindTooltip(`<b>${label}</b><br>Techo: ${limit}m AMSL`).openTooltip();
            managerLayers.addLayer(layer);
        } else {
            // <-- CLAVE: Exactamente igual que el gestor, sin borrados agresivos
            pilotLayers.clearLayers();
            pilotLayers.addLayer(layer);
        }
    });

    setTimeout(() => { map.invalidateSize(); }, 200);
}