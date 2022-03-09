declare const axios: any;
declare const https: any;
declare const constant: any;
declare function get_availability(url: string): Promise<1 | 0>;
declare function get_latency(url: string): Promise<number>;
