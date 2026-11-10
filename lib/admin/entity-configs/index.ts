// Реестр конфигураций универсального CRUD: адрес /admin/{key} → конфигурация.
import type { EntityConfig } from "../entity-config";
import { documentsConfig, fundsConfig, inventoriesConfig, unitsConfig } from "./catalog";
import { branchesConfig, faqConfig, newsConfig, pagesConfig } from "./content";
import { collectionsConfig, eventsConfig, exhibitionsConfig, exhibitsConfig, personsConfig } from "./museum";

export const ENTITY_CONFIGS: EntityConfig[] = [
  fundsConfig,
  inventoriesConfig,
  unitsConfig,
  documentsConfig,
  exhibitionsConfig,
  exhibitsConfig,
  collectionsConfig,
  personsConfig,
  eventsConfig,
  newsConfig,
  pagesConfig,
  faqConfig,
  branchesConfig,
];

export function getEntityConfig(key: string): EntityConfig | undefined {
  return ENTITY_CONFIGS.find((config) => config.key === key);
}

export const MODERATED_CONFIGS = ENTITY_CONFIGS.filter((config) => config.moderated);
