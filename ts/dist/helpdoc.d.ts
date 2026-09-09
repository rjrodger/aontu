type HelpTopic = {
    topic: string;
    summary: string;
    source: string;
    text: string;
};
declare const HELPDOC: HelpTopic[];
type InitFile = {
    file: string;
    mode: number;
    name: string;
    text: string;
};
declare const INITDOC: InitFile[];
export type { HelpTopic, InitFile };
export { HELPDOC, INITDOC };
