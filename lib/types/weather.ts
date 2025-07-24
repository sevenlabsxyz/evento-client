export interface WeatherCondition {
	id: number;
	main: string;
	description: string;
	icon: string;
}

export interface WeatherData {
	temperature: number;
	unit: 'C' | 'F';
	condition: string;
	description: string;
	icon: string;
	humidity?: number;
	windSpeed?: number;
	feelsLike?: number;
}

export interface OpenWeatherMapResponse {
	coord: {
		lon: number;
		lat: number;
	};
	weather: WeatherCondition[];
	base: string;
	main: {
		temp: number;
		feels_like: number;
		temp_min: number;
		temp_max: number;
		pressure: number;
		humidity: number;
		sea_level?: number;
		grnd_level?: number;
	};
	visibility: number;
	wind: {
		speed: number;
		deg: number;
		gust?: number;
	};
	clouds: {
		all: number;
	};
	dt: number;
	sys: {
		type: number;
		id: number;
		country: string;
		sunrise: number;
		sunset: number;
	};
	timezone: number;
	id: number;
	name: string;
	cod: number;
}

export interface OpenWeatherMapHistoricalResponse {
	lat: number;
	lon: number;
	timezone: string;
	timezone_offset: number;
	data: {
		dt: number;
		sunrise: number;
		sunset: number;
		temp: number;
		feels_like: number;
		pressure: number;
		humidity: number;
		dew_point: number;
		uvi: number;
		clouds: number;
		visibility: number;
		wind_speed: number;
		wind_deg: number;
		weather: WeatherCondition[];
	}[];
}

export interface OpenWeatherMapForecastResponse {
	cod: string;
	message: number;
	cnt: number;
	list: {
		dt: number;
		main: {
			temp: number;
			feels_like: number;
			temp_min: number;
			temp_max: number;
			pressure: number;
			sea_level: number;
			grnd_level: number;
			humidity: number;
			temp_kf: number;
		};
		weather: WeatherCondition[];
		clouds: {
			all: number;
		};
		wind: {
			speed: number;
			deg: number;
			gust: number;
		};
		visibility: number;
		pop: number;
		sys: {
			pod: string;
		};
		dt_txt: string;
	}[];
	city: {
		id: number;
		name: string;
		coord: {
			lat: number;
			lon: number;
		};
		country: string;
		population: number;
		timezone: number;
		sunrise: number;
		sunset: number;
	};
}

export interface GeocodeResponse {
	name: string;
	local_names?: Record<string, string>;
	lat: number;
	lon: number;
	country: string;
	state?: string;
}

export type WeatherError =
	| 'api_key_missing'
	| 'location_not_found'
	| 'api_limit_exceeded'
	| 'network_error'
	| 'invalid_date'
	| 'unknown_error';

export interface WeatherHookResult {
	weather: WeatherData | null;
	loading: boolean;
	error: WeatherError | null;
}
