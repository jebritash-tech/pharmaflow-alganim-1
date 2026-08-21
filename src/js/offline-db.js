import Dexie from 'dexie';

export const db = new Dexie('pharmacy_db_dev');
db.version(4).stores({
    sales_queue: 'id,synced,created_at',
    medicine_cache: 'id,barcode,name,branch_id',
    user_cache: 'id',
    stock_queue: '++id,medicine_id,quantity,created_at',
});
db.open();

export async function saveOfflineSale(sale) {
    return db.sales_queue.add(sale);
}

export async function getPendingSales() {
    const allSales = await db.sales_queue.toArray();
    return allSales.filter(
        sale => sale.synced === false
    );
}

export async function removeOfflineSale(id) {
    return db.sales_queue.delete(id);
}

export async function countPendingSales() {
    const allSales = await db.sales_queue.toArray();
    return allSales.filter(
        sale => sale.synced === false
    ).length;
}

export async function cacheMedicines(medicines) {
    await db.medicine_cache.clear();
    await db.medicine_cache.bulkPut(
        medicines
    );
}

export async function getCachedMedicines() {
    return await db.medicine_cache.toArray();
}

export async function cacheUser(user) {
    const existing = await getCachedUser();
    await db.user_cache.clear();
    await db.user_cache.put({
        ...existing,
        ...user
    });
}

export async function getCachedUser() {
    return await db.user_cache
        .toCollection()
        .first();
}

export async function saveStockMovement(data) {
    return await db.stock_queue.add({
        medicine_id: data.medicine_id,
        quantity: data.quantity,
        created_at: new Date().toISOString()
    });
}

export async function getPendingStockMovements() {
    return await db.stock_queue.toArray();
}

export async function removeStockMovement(id) {
    return await db.stock_queue.delete(id);
}

export async function reduceMedicineStock(
    medicineId,
    quantity
) {
    const medicine = await db.medicine_cache.get(
        medicineId
    );

    if (!medicine)
        return false;

    medicine.stock = Math.max(
        0,
        Number(medicine.stock || 0)
        - Number(quantity)
    );

    await db.medicine_cache.put(
        medicine
    );

    return true;
}

export async function saveMedicinesToCache(medicines) {
    if (!db) {
        throw new Error('Offline database is not initialized');
    }

    await db.medicine_cache.clear();

    if (!Array.isArray(medicines) || medicines.length === 0) {
        return;
    }

    await db.medicine_cache.bulkPut(
        medicines.map(medicine => ({
            ...medicine,
            cached_at: new Date().toISOString()
        }))
    );
}

/*
|--------------------------------------------------------------------------
| Update Pending Sales Shift ID
|--------------------------------------------------------------------------
|
| تقوم بتحويل shift_id المحلي الخاص بالوردية Offline
| إلى server shift ID بعد نجاح مزامنة الوردية.
|
| مثال:
|
| offline-a1f7c1fc...
|        ↓
|       25
|
|--------------------------------------------------------------------------
*/

export async function updatePendingSalesShiftId(
    localShiftId,
    serverShiftId
) {
    if (
        !localShiftId ||
        serverShiftId === null ||
        serverShiftId === undefined
    ) {
        return 0;
    }

    const numericServerShiftId =
        Number(serverShiftId);

    if (
        !Number.isInteger(
            numericServerShiftId
        ) ||
        numericServerShiftId <= 0
    ) {
        console.warn(
            'Invalid server shift ID:',
            serverShiftId
        );

        return 0;
    }

    let updated = 0;

    await db.transaction(
        'rw',
        db.sales_queue,
        async () => {

            const sales =
                await db.sales_queue.toArray();

            for (
                const sale of sales
            ) {

                if (
                    String(
                        sale.shift_id
                    ) !==
                    String(
                        localShiftId
                    )
                ) {
                    continue;
                }

                await db.sales_queue.put({
                    ...sale,

                    shift_id:
                        numericServerShiftId,

                    shift_id_local:
                        String(
                            localShiftId
                        ),

                    shift_migrated:
                        true,

                    shift_migrated_at:
                        new Date()
                            .toISOString()
                });

                updated++;
            }
        }
    );

    console.log(
        'تم تحديث ورديات الفواتير المحلية:',
        {
            local_shift_id:
                localShiftId,

            server_shift_id:
                numericServerShiftId,

            updated
        }
    );

    return updated;
}

