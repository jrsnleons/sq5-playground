import { supabase, isSupabaseConfigured } from './supabase';
import { localCache, EquipmentInventoryItem, DEFAULT_INVENTORY_ITEMS } from './localCache';

export const inventoryService = {
  async fetchInventory(): Promise<EquipmentInventoryItem[]> {
    if (!isSupabaseConfigured() || !supabase || !navigator.onLine) {
      return localCache.getInventoryItems();
    }

    try {
      const { data, error } = await supabase
        .from('equipment_inventory')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.warn('Supabase fetch equipment_inventory error, using local cache:', error.message);
        return localCache.getInventoryItems();
      }

      if (data && Array.isArray(data) && data.length > 0) {
        const items: EquipmentInventoryItem[] = data.map((d) => ({
          id: d.id,
          name: d.name,
          category: d.category,
          model: d.model || '',
          description: d.description || '',
          total_stock: typeof d.total_stock === 'number' ? d.total_stock : 1,
          connectors: Array.isArray(d.connectors) ? d.connectors : [],
          notes: d.notes || '',
          is_custom: Boolean(d.is_custom),
          created_at: d.created_at,
          updated_at: d.updated_at
        }));

        localCache.saveInventoryItems(items);
        return items;
      }
    } catch (err) {
      console.warn('Network error fetching inventory:', err);
    }

    return localCache.getInventoryItems();
  },

  async saveInventoryItem(
    item: Partial<EquipmentInventoryItem> & { id: string; name: string; category: string }
  ): Promise<{ item: EquipmentInventoryItem; savedToCloud: boolean }> {
    const existingList = localCache.getInventoryItems();
    const existing = existingList.find((i) => i.id === item.id);

    const fullItem: EquipmentInventoryItem = {
      id: item.id,
      name: item.name,
      category: item.category,
      model: item.model ?? existing?.model ?? '',
      description: item.description ?? existing?.description ?? '',
      total_stock: typeof item.total_stock === 'number' ? Math.max(0, item.total_stock) : (existing?.total_stock ?? 1),
      connectors: item.connectors ?? existing?.connectors ?? [],
      notes: item.notes ?? existing?.notes ?? '',
      is_custom: item.is_custom ?? existing?.is_custom ?? false,
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    localCache.saveInventoryItem(fullItem);

    let savedToCloud = false;
    if (isSupabaseConfigured() && supabase && navigator.onLine) {
      try {
        const { error } = await supabase
          .from('equipment_inventory')
          .upsert({
            id: fullItem.id,
            name: fullItem.name,
            category: fullItem.category,
            model: fullItem.model,
            description: fullItem.description,
            total_stock: fullItem.total_stock,
            connectors: fullItem.connectors,
            notes: fullItem.notes,
            is_custom: fullItem.is_custom,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });

        if (!error) {
          savedToCloud = true;
        } else {
          console.warn('Supabase upsert inventory item error:', error.message);
        }
      } catch (err) {
        console.warn('Failed to upsert inventory to Supabase:', err);
      }
    }

    return { item: fullItem, savedToCloud };
  },

  async deleteInventoryItem(itemId: string): Promise<boolean> {
    localCache.removeInventoryItem(itemId);

    if (isSupabaseConfigured() && supabase && navigator.onLine) {
      try {
        const { error } = await supabase
          .from('equipment_inventory')
          .delete()
          .eq('id', itemId);

        if (error) {
          console.warn('Supabase delete inventory error:', error.message);
          return false;
        }
        return true;
      } catch (err) {
        console.warn('Failed to delete inventory item on Supabase:', err);
      }
    }

    return true;
  }
};
