import {Importance} from "../enum/Importance";
import {ResourceType} from "../enum/ResourceType";

export interface Resource {
    id: string;
    name: string;
    type: ResourceType;
    description?: string;
    whenToLoad?: string;
    importance?: Importance;
    children: Resource[];
    content?: string | null;
}