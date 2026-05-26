function isCircleLayer(layer) {
    return !!layer && typeof layer.getRadius === 'function' && typeof layer.getLatLng === 'function';
}

function getGeoJSONForLayer(layer) {
    if (!layer) return null;

    if (isCircleLayer(layer)) {
        const center = layer.getLatLng();
        const radiusKm = layer.getRadius() / 1000;
        return turf.circle([center.lng, center.lat], radiusKm, {
            steps: 64,
            units: 'kilometers'
        });
    }

    return layer.toGeoJSON();
}

function getGeoJSONForFeatureGroup(featureGroup) {
    if (!featureGroup || typeof featureGroup.getLayers !== 'function') {
        return featureGroup && featureGroup.toGeoJSON ? featureGroup.toGeoJSON() : null;
    }

    const layers = featureGroup.getLayers();
    if (!layers.length) {
        return featureGroup.toGeoJSON();
    }

    return {
        type: 'FeatureCollection',
        features: layers.map(layer => getGeoJSONForLayer(layer)).filter(Boolean)
    };
}