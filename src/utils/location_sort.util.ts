import {
    Client,
    TravelMode,
    TravelRestriction,
    UnitSystem,
} from '@googlemaps/google-maps-services-js';
import axios from 'axios';
import { StoreLocationDTO } from 'src/app/store/dto/store-locations.dto';


const axiosInstance = axios.create();
const map = new Client({ axiosInstance });

export const distance = async (source: StoreLocationDTO, store: any) => {
    try {
        const response = await map.distancematrix({
            params: {
                origins: [{ lat: source.latitude, lng: source.longitude }],
                destinations: [
                    ...store?.map(({ location }) => {
                        return { lat: location.latitude, lng: location.longitude };
                    }),
                ],
                key: process.env.GOOGLE_API_KEY,
                avoid: [TravelRestriction.tolls],
                mode: TravelMode.driving,
                units: UnitSystem.metric,
            },
        });
        response.data.rows[0]?.elements.forEach((value, index) => {
            store[index]['location']['route'] = value;
        });
        return store.sort(
            (a, b) =>
                a.location.route.distance.value - b.location.route.distance.value,
        );
    } catch (error) {
        console.error('Error fetching distance:', error.message);
    }
};
