import { apiClient } from '../client';

export interface SiteSettings {
  winter_effects: boolean;
  updated_at: string;
}

export const siteSettingsService = {
  get: () => apiClient.get<SiteSettings>('/site-settings/'),
  setWinterEffects: (winter_effects: boolean) =>
    apiClient.patch<SiteSettings>('/site-settings/', { winter_effects }),
};
