import { Resource } from "./Resource";

export interface ResourceParser {
    parse(inputPath: string): Promise<Resource[]>;
}