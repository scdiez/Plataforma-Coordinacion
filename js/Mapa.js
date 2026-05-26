function initMap() {
    if (map) return;

    managerLayers = L.featureGroup();
    pilotLayers = L.featureGroup();

    L.Browser.touch = false;

    map = L.map('map', {
        worldCopyJump: false,
        maxBounds: [[32, -20], [47, 10]],
        maxBoundsViscosity: 1.0,
        minZoom: 7
    }).setView([40.4168, -3.7038], 8);
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
        hintlineStyle: {
            color: '#1a56db',
            dashArray: '5,5'
        }
    });

    map.pm.setPathOptions({
        color: '#1a56db',
        fillOpacity: 0.3
    });

    map.on('pm:create', function (e) {
        const layer = e.layer;
        lastDrawnLayer = layer;

        pilotLayers.clearLayers();
        pilotLayers.addLayer(layer);

        // Cerramos el modo de dibujo para que el círculo no siga cambiando de radio
        //map.pm.disableDraw();

        recheckIntersection(pilotLayers.getLayers());
    });

    setTimeout(() => { map.invalidateSize(); }, 200);
}