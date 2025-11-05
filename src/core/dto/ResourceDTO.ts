import {Importance} from "../enum/Importance";
import {ResourceType} from "../enum/ResourceType";

export interface ResourceDTO {
    id: string;
    name: string;
    type: ResourceType;
    description?: string;
    whenToLoad?: string;
    importance?: Importance;
    children: ResourceDTO[];
    content?: string | null;
}