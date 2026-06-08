import type { Val } from './type';
type SiteSpec = {
    row?: number;
    col?: number;
    url?: string;
};
declare class Site {
    row: number;
    col: number;
    url: string;
    constructor(val?: Val | SiteSpec);
}
export { Site, };
