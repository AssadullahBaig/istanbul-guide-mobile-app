import { historicalPlaces } from "../constants/historicalPlaces";
import { MapItem } from "../types/map";

export async function getHistoricalPlaces(): Promise<MapItem[]> {
    return Promise.resolve(historicalPlaces);
}