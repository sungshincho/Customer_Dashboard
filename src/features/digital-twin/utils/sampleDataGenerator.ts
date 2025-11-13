import { supabase } from "@/integrations/supabase/client";

export async function insertSample3DData(userId: string, storeId?: string) {
  try {
    // Check if data already exists
    const exists = await checkSampleDataExists(userId, storeId);
    if (exists) {
      throw new Error('샘플 데이터가 이미 존재합니다');
    }

    // 1. Insert Entity Types
    const { data: entityTypes, error: entityTypesError } = await supabase
      .from('ontology_entity_types')
      .insert([
        {
          user_id: userId,
          name: 'StoreSpace',
          label: '매장 공간',
          description: '전체 매장 바닥 공간',
          model_3d_type: 'space',
          model_3d_dimensions: { width: 20, height: 3, depth: 15 },
          color: '#e0e0e0',
          icon: 'Building',
          properties: [
            { name: 'area', type: 'number', required: true },
            { name: 'zone_type', type: 'string', required: false }
          ]
        },
        {
          user_id: userId,
          name: 'Shelf',
          label: '선반/진열대',
          description: '제품 진열용 선반',
          model_3d_type: 'furniture',
          model_3d_dimensions: { width: 2, height: 2, depth: 0.5 },
          color: '#8b4513',
          icon: 'Box',
          properties: [
            { name: 'capacity', type: 'number', required: true },
            { name: 'shelf_type', type: 'string', required: false }
          ]
        },
        {
          user_id: userId,
          name: 'DisplayTable',
          label: '디스플레이 테이블',
          description: '중앙 디스플레이 테이블',
          model_3d_type: 'furniture',
          model_3d_dimensions: { width: 1.5, height: 0.8, depth: 1.5 },
          color: '#cd853f',
          icon: 'Table',
          properties: [
            { name: 'capacity', type: 'number', required: true }
          ]
        },
        {
          user_id: userId,
          name: 'Product',
          label: '제품',
          description: '판매 제품',
          model_3d_type: 'product',
          model_3d_dimensions: { width: 0.3, height: 0.4, depth: 0.2 },
          color: '#4a90e2',
          icon: 'Package',
          properties: [
            { name: 'sku', type: 'string', required: true },
            { name: 'price', type: 'number', required: true },
            { name: 'stock', type: 'number', required: false }
          ]
        }
      ])
      .select();

    if (entityTypesError) throw entityTypesError;
    if (!entityTypes || entityTypes.length === 0) throw new Error('Failed to create entity types');

    // Find entity type IDs
    const spaceTypeId = entityTypes.find(et => et.name === 'StoreSpace')?.id;
    const shelfTypeId = entityTypes.find(et => et.name === 'Shelf')?.id;
    const tableTypeId = entityTypes.find(et => et.name === 'DisplayTable')?.id;
    const productTypeId = entityTypes.find(et => et.name === 'Product')?.id;

    if (!spaceTypeId || !shelfTypeId || !tableTypeId || !productTypeId) {
      throw new Error('Could not find all entity type IDs');
    }

    // 2. Insert Graph Entities (instances) - with optional store_id
    const { data: entities, error: entitiesError } = await supabase
      .from('graph_entities')
      .insert([
        // Main Store Space
        {
          user_id: userId,
          store_id: storeId,
          entity_type_id: spaceTypeId,
          label: '강남점 매장',
          properties: { area: 300, zone_type: 'retail' },
          model_3d_position: { x: 0, y: 0, z: 0 },
          model_3d_rotation: { x: 0, y: 0, z: 0 },
          model_3d_scale: { x: 1, y: 1, z: 1 }
        },
        // Shelf 1 (Left)
        {
          user_id: userId,
          store_id: storeId,
          entity_type_id: shelfTypeId,
          label: '왼쪽 선반 A',
          properties: { capacity: 50, shelf_type: 'wall-mounted' },
          model_3d_position: { x: -5, y: 0, z: 0 },
          model_3d_rotation: { x: 0, y: Math.PI / 2, z: 0 },
          model_3d_scale: { x: 1, y: 1, z: 1 }
        },
        // Shelf 2 (Right)
        {
          user_id: userId,
          store_id: storeId,
          entity_type_id: shelfTypeId,
          label: '오른쪽 선반 B',
          properties: { capacity: 50, shelf_type: 'wall-mounted' },
          model_3d_position: { x: 5, y: 0, z: 0 },
          model_3d_rotation: { x: 0, y: -Math.PI / 2, z: 0 },
          model_3d_scale: { x: 1, y: 1, z: 1 }
        },
        // Display Table (Center)
        {
          user_id: userId,
          store_id: storeId,
          entity_type_id: tableTypeId,
          label: '중앙 디스플레이 테이블',
          properties: { capacity: 20 },
          model_3d_position: { x: 0, y: 0, z: -3 },
          model_3d_rotation: { x: 0, y: 0, z: 0 },
          model_3d_scale: { x: 1, y: 1, z: 1 }
        },
        // Products
        {
          user_id: userId,
          store_id: storeId,
          entity_type_id: productTypeId,
          label: '삼성 갤럭시 S24',
          properties: { sku: 'SAMS24', price: 1200000, stock: 15 },
          model_3d_position: { x: -5, y: 1, z: 0 },
          model_3d_rotation: { x: 0, y: 0, z: 0 },
          model_3d_scale: { x: 1, y: 1, z: 1 }
        },
        {
          user_id: userId,
          store_id: storeId,
          entity_type_id: productTypeId,
          label: '애플 아이폰 15',
          properties: { sku: 'APPH15', price: 1350000, stock: 12 },
          model_3d_position: { x: 5, y: 1, z: 0 },
          model_3d_rotation: { x: 0, y: 0, z: 0 },
          model_3d_scale: { x: 1, y: 1, z: 1 }
        },
        {
          user_id: userId,
          store_id: storeId,
          entity_type_id: productTypeId,
          label: 'LG 노트북 그램',
          properties: { sku: 'LGGRAM', price: 2100000, stock: 8 },
          model_3d_position: { x: 0, y: 0.8, z: -3 },
          model_3d_rotation: { x: 0, y: 0, z: 0 },
          model_3d_scale: { x: 1, y: 1, z: 1 }
        }
      ])
      .select();

    if (entitiesError) throw entitiesError;

    return {
      entityTypes: entityTypes.length,
      entities: entities?.length || 0
    };
  } catch (error) {
    console.error('Error inserting sample 3D data:', error);
    throw error;
  }
}

export async function checkSampleDataExists(userId: string, storeId?: string): Promise<boolean> {
  try {
    // Check entity types
    const { data: entityTypes } = await supabase
      .from('ontology_entity_types')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    // Check entities (optionally filter by store)
    let entitiesQuery = supabase
      .from('graph_entities')
      .select('id')
      .eq('user_id', userId);

    if (storeId) {
      entitiesQuery = entitiesQuery.eq('store_id', storeId);
    }

    const { data: entities } = await entitiesQuery.limit(1);

    return (entityTypes && entityTypes.length > 0) || (entities && entities.length > 0);
  } catch (error) {
    console.error('Error checking sample data:', error);
    return false;
  }
}

export async function deleteSampleData(userId: string, storeId?: string) {
  try {
    // Delete entities first (optionally filter by store)
    let entitiesQuery = supabase
      .from('graph_entities')
      .delete()
      .eq('user_id', userId);

    if (storeId) {
      entitiesQuery = entitiesQuery.eq('store_id', storeId);
    }

    const { error: entitiesError } = await entitiesQuery;
    if (entitiesError) throw entitiesError;

    // Delete relations (optionally filter by store)
    let relationsQuery = supabase
      .from('graph_relations')
      .delete()
      .eq('user_id', userId);

    if (storeId) {
      relationsQuery = relationsQuery.eq('store_id', storeId);
    }

    const { error: relationsError } = await relationsQuery;
    if (relationsError) throw relationsError;

    // Only delete entity types if no store filter (entity types are global)
    if (!storeId) {
      const { error: entityTypesError } = await supabase
        .from('ontology_entity_types')
        .delete()
        .eq('user_id', userId);

      if (entityTypesError) throw entityTypesError;
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting sample data:', error);
    throw error;
  }
}
