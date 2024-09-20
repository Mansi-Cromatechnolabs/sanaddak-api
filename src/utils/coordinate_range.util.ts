export const degreesToRadians = (degrees: number): number => {
	return degrees * Math.PI / 180;
}

export const radiansToDegrees = (radians: number): number => {
	return radians * 180 / Math.PI;
}

export const calculateLatLngRange = (latitude: number, longitude: number, radius: number = 500) => {
	const R = 6371;
	const maxLat = latitude + radiansToDegrees(radius / R);
	const minLat = latitude - radiansToDegrees(radius / R);
	const maxLon = longitude + radiansToDegrees(radius / (R * Math.cos(degreesToRadians(latitude))));
	const minLon = longitude - radiansToDegrees(radius / (R * Math.cos(degreesToRadians(latitude))));
	return {
		minLatitude: minLat,
		maxLatitude: maxLat,
		minLongitude: minLon,
		maxLongitude: maxLon
	};
}
