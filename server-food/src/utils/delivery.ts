import {
  calculateDistance as haversineDistance,
  calculateBearing,
  isPointWithinRadius,
  formatDistance,
} from './distance';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface Route {
  waypoints: Coordinates[];
  distance: number; // in meters
  duration: number; // in seconds
  polyline?: string; // encoded polyline for map display
  estimatedDeliveryTime?: Date;
  lastUpdated?: Date;
  bearing?: number; // bearing from current to next waypoint
  formattedDistance?: string; // human-readable distance
}

export function coordinatesToGeoJSON(coords: Coordinates): GeoJSONPoint {
  return {
    type: 'Point',
    coordinates: [coords.longitude, coords.latitude]
  };
}

export function geoJSONToCoordinates(point: GeoJSONPoint): Coordinates {
  return {
    latitude: point.coordinates[1],
    longitude: point.coordinates[0]
  };
}

export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
  return haversineDistance(
    point1.latitude,
    point1.longitude,
    point2.latitude,
    point2.longitude
  );
}

export function getTrafficMultiplier(hour: number): number {
  // Rush hours: 7-9 AM and 4-7 PM
  const morningRush = hour >= 7 && hour <= 9;
  const eveningRush = hour >= 16 && hour <= 19;
  
  if (morningRush || eveningRush) {
    return 1.5; // 50% slower during rush hours
  }
  
  // Late night: 11 PM - 5 AM
  const lateNight = hour >= 23 || hour <= 5;
  if (lateNight) {
    return 0.8; // 20% faster during late night
  }
  
  return 1.0; // Normal traffic
}

export function estimateDeliveryTime(
  distance: number,
  trafficMultiplier: number
): Date {
  // Base speed: 30 km/h in city traffic
  const baseSpeedKmh = 30;
  const baseSpeedMps = (baseSpeedKmh * 1000) / 3600;
  
  // Calculate travel time in seconds
  const travelTimeSeconds = (distance / baseSpeedMps) * trafficMultiplier;
  
  // Add 10 minutes for pickup and 5 minutes for delivery
  const totalTimeSeconds = travelTimeSeconds + (15 * 60);
  
  const estimatedTime = new Date();
  estimatedTime.setSeconds(estimatedTime.getSeconds() + totalTimeSeconds);
  
  return estimatedTime;
}

export function calculateOptimalRoute(
  driverLocation: Coordinates,
  restaurantLocation: Coordinates,
  deliveryLocation: Coordinates
): Route {
  // Calculate distances
  const toRestaurant = calculateDistance(driverLocation, restaurantLocation);
  const toDelivery = calculateDistance(restaurantLocation, deliveryLocation);
  const totalDistance = toRestaurant + toDelivery;
  
  // Estimate duration based on current traffic
  const currentHour = new Date().getHours();
  const trafficMultiplier = getTrafficMultiplier(currentHour);
  const baseSpeedMps = (30 * 1000) / 3600; // 30 km/h in meters per second
  const duration = (totalDistance / baseSpeedMps) * trafficMultiplier;
  
  const estimatedTime = estimateDeliveryTime(totalDistance, trafficMultiplier);
  
  // Calculate bearing to next waypoint
  const bearing = calculateBearing(
    driverLocation.latitude,
    driverLocation.longitude,
    restaurantLocation.latitude,
    restaurantLocation.longitude
  );

  return {
    waypoints: [driverLocation, restaurantLocation, deliveryLocation],
    distance: totalDistance,
    duration: duration,
    polyline: encodePolyline([driverLocation, restaurantLocation, deliveryLocation]),
    estimatedDeliveryTime: estimatedTime,
    lastUpdated: new Date(),
    bearing: bearing,
    formattedDistance: formatDistance(totalDistance)
  };
}

// Helper function to encode coordinates into a polyline string
function encodePolyline(points: Coordinates[]): string {
  // Simplified polyline encoding - in a real app, use a proper polyline encoding library
  return points
    .map(p => `${p.latitude.toFixed(5)},${p.longitude.toFixed(5)}`)
    .join('|');
}

export const isWithinDeliveryRadius = (
  restaurantLocation: Coordinates,
  deliveryLocation: Coordinates,
  maxRadius: number = 10 // Maximum delivery radius in kilometers
): boolean => {
  return isPointWithinRadius(
    restaurantLocation.latitude,
    restaurantLocation.longitude,
    deliveryLocation.latitude,
    deliveryLocation.longitude,
    maxRadius * 1000 // Convert km to meters
  );
};

export const groupOrdersByArea = (
  orders: Array<{ location: Coordinates }>,
  maxClusterRadius: number = 2 // Maximum radius for grouping orders in kilometers
): Array<Array<{ location: Coordinates }>> => {
  if (orders.length === 0) return [];

  const clusters: Array<Array<{ location: Coordinates }>> = [];
  const visited = new Set<number>();

  for (let i = 0; i < orders.length; i++) {
    if (visited.has(i)) continue;

    const cluster: Array<{ location: Coordinates }> = [orders[i]];
    visited.add(i);

    for (let j = 0; j < orders.length; j++) {
      if (visited.has(j)) continue;

      if (isPointWithinRadius(
        orders[i].location.latitude,
        orders[i].location.longitude,
        orders[j].location.latitude,
        orders[j].location.longitude,
        maxClusterRadius * 1000
      )) {
        cluster.push(orders[j]);
        visited.add(j);
      }
    }

    clusters.push(cluster);
  }

  return clusters;
};

export const getClusterCenter = (
  orders: Array<{ location: Coordinates }>
): Coordinates => {
  if (orders.length === 0) {
    throw new Error('Cannot calculate center of empty cluster');
  }

  const sum = orders.reduce(
    (acc, curr) => ({
      latitude: acc.latitude + curr.location.latitude,
      longitude: acc.longitude + curr.location.longitude,
    }),
    { latitude: 0, longitude: 0 }
  );

  return {
    latitude: sum.latitude / orders.length,
    longitude: sum.longitude / orders.length,
  };
};
