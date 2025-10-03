import { seedInitialData } from '@/services/firestoreService';

const users = [
    {
        customId: '9j3kL8sP2dR7vXyZ1oA5bC6wE4F2',
        name: 'Admin Tropical',
        email: 'admin@tropical.com',
        role: 'Administrator',
        documentType: 'CC',
        documentNumber: '123456789',
        avatarUrl: 'https://placehold.co/96x96'
    },
    {
        customId: 'aB1cD2eF3gH4iJ5kL6mN7oP8qR9s',
        name: 'Iván de Calidad',
        email: 'calidad@tropical.com',
        role: 'Quality',
        documentType: 'CC',
        documentNumber: '987654321',
        avatarUrl: 'https://placehold.co/96x96'
    },
    {
        customId: 'tU9vW8xY7zZ6aB5cD4eF3gH2iJ1k',
        name: 'Pedro de Producción',
        email: 'produccion@tropical.com',
        role: 'Production',
        documentType: 'CC',
        documentNumber: '1122334455',
        avatarUrl: 'https://placehold.co/96x96'
    }
];

const formulations = [
    {
        id: 'FORM-001',
        item: 'PROD-SK-100',
        name: 'Sabor Carne en Polvo',
        ingredients: 5,
        lastUpdated: '2024-05-20',
        fileName: 'Formulacion_Sabor_Carne.xlsx',
        data: JSON.stringify([
            [],[],[], // Simulating empty rows for structure
            ['Referencia', 'PRODUCTOS', 'CANTIDAD', 'Unidad'],
            ['SK-101', 'Sal', 10, 'kg'],
            ['SK-102', 'Potenciador de Sabor', 5, 'kg'],
            ['SK-103', 'Ajo en Polvo', 2, 'kg'],
            ['SK-104', 'Cebolla en Polvo', 2, 'kg'],
            ['SK-105', 'Pimienta Negra', 1, 'kg']
        ])
    },
    {
        id: 'FORM-002',
        item: 'PROD-SP-200',
        name: 'Sabor Pollo en Polvo',
        ingredients: 4,
        lastUpdated: '2024-05-21',
        fileName: 'Formulacion_Sabor_Pollo.xlsx',
        data: JSON.stringify([
            [],[],[],
            ['Referencia', 'PRODUCTOS', 'CANTIDAD', 'Unidad'],
            ['SP-201', 'Sal', 12, 'kg'],
            ['SP-202', 'Extracto de Pollo', 6, 'kg'],
            ['SP-203', 'Cúrcuma', 1.5, 'kg'],
            ['SP-204', 'Perejil Deshidratado', 0.5, 'kg']
        ])
    },
];

const production = [
    {
        id: 'LOTE-2405-001',
        item: 'PROD-SK-100',
        product: 'Sabor Carne en Polvo',
        lot: 'P202405-101',
        formulationId: 'FORM-001',
        date: '2024-05-21',
        startTime: '08:00',
        endTime: '12:00',
        status: 'Completado',
        responsible: { name: 'Pedro de Producción', id: 'tU9vW8xY7zZ6aB5cD4eF3gH2iJ1k', role: 'Production' },
        performance: 98.5,
        finalProductReal: 19.7,
        finalProductTheoreticalPowder: 20,
        ingredients: [
            { ref: 'SK-101', name: 'Sal', quantity: 10, unit: 'kg', lot: 'LOTE-SAL-001', check: 'C', attentionTo: ''},
            { ref: 'SK-102', name: 'Potenciador de Sabor', quantity: 5, unit: 'kg', lot: 'LOTE-POT-002', check: 'C', attentionTo: ''}
        ],
        packagingMaterials: [
            {product: 'Bolsa 1kg', lot: 'B-001', expiration: '2026-01-01'}
        ],
        signature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    },
];

const hygiene = [
    {
        id: 'HYG-001',
        area: 'Mezcladora #1',
        date: '2024-05-21',
        status: 'Verificado',
        lastFabrication: 'Sabor Carne en Polvo',
        item: 'PROD-SK-100',
        lot: 'P202405-101',
        responsible: { name: 'Pedro de Producción', id: 'tU9vW8xY7zZ6aB5cD4eF3gH2iJ1k', role: 'Production' },
        signature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    }
];

const quality_luminometry = [
    {
        id: 'ATP-001',
        location: 'Mesa de Empaque 1',
        result: 8,
        status: 'Pasa',
        date: '2024-05-21',
        responsible: { name: 'Iván de Calidad', id: 'aB1cD2eF3gH4iJ5kL6mN7oP8qR9s', role: 'Quality' },
        signature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    }
];

const quality_sensory = [
    {
        id: 'SENS-001',
        product: 'Sabor Carne en Polvo',
        lot: 'P202405-101',
        item: 'PROD-SK-100',
        odor: 'Conforme',
        color: 'Conforme',
        appearance: 'Conforme',
        result: 'Aprobado',
        date: '2024-05-21',
        responsible: { name: 'Iván de Calidad', id: 'aB1cD2eF3gH4iJ5kL6mN7oP8qR9s', role: 'Quality' },
        signature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    }
];

const pcc = [
    {
        id: 'PCC-001',
        pccId: 'Malla 800µm',
        meshState: 'Conforme',
        filterState: 'N/A',
        meshInUse: true,
        filterInUse: false,
        date: '2024-05-21',
        responsible: { name: 'Pedro de Producción', id: 'tU9vW8xY7zZ6aB5cD4eF3gH2iJ1k', role: 'Production' },
        signature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    }
];

const scales = [
    {
        id: 'SCALE-001',
        scale: 'Báscula de Piso #1',
        testType: 'Excentricidad',
        result: 'Pasa',
        date: '2024-05-21',
        product: 'Sabor Carne en Polvo',
        lot: 'P202405-101',
        responsible: { name: 'Iván de Calidad', id: 'aB1cD2eF3gH4iJ5kL6mN7oP8qR9s', role: 'Quality' },
        signature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
        unit: "kg",
        patternWeight: 20,
        readings: {
            "Punto 1 (Centro)": 20.01,
            "Punto 2 (Esq. Sup. Izq.)": 20.02,
            "Punto 3 (Esq. Sup. Der.)": 20.01,
            "Punto 4 (Esq. Inf. Izq.)": 19.99,
            "Punto 5 (Esq. Inf. Der.)": 20.00,
        }
    }
];

const endowment = [
    {
        id: 'END-001',
        person: 'Pedro de Producción',
        status: 'Conforme',
        date: '2024-05-21',
        responsible: { name: 'Iván de Calidad', id: 'aB1cD2eF3gH4iJ5kL6mN7oP8qR9s', role: 'Quality' },
        items: { uniformeDia: true, botasUniformeLimpio: true, unasLimpias: true },
        signature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    }
];

const utensils = [
    { id: 'UT-001', name: 'Cuchillo de Corte', entry: 5, exit: 5 },
    { id: 'UT-002', name: 'Espátula de Mezcla', entry: 10, exit: 10 },
];


export const seedAllData = async () => {
    await seedInitialData('users', users);
    await seedInitialData('formulations', formulations);
    await seedInitialData('production', production);
    await seedInitialData('hygiene', hygiene);
    await seedInitialData('quality_luminometry', quality_luminometry);
    await seedInitialData('quality_sensory', quality_sensory);
    await seedInitialData('pcc', pcc);
    await seedInitialData('scales', scales);
    await seedInitialData('endowment', endowment);
    await seedInitialData('utensils', utensils);
}
