import type { Val } from './type';
declare class Site {
    row: number;
    col: number;
    url: string;
    constructor(val?: Val | {
        row?: number;
        col?: number;
        url?: string;
    });
}
export { Site, };
