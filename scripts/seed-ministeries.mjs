import clientPromise from '../lib/mongodb.js';

async function seedMinisteries() {
  try {
    const client = await clientPromise;
    const db = client.db('churchesPlanner');
    const collection = db.collection('ministeries');

    const sampleMinisteries = [
      {
        name: "Ministerio de Jóvenes",
        description: "Ministerio dedicado a la evangelización y formación de jóvenes",
        leader: "Juan Pérez",
        createdAt: new Date()
      },
      {
        name: "Ministerio de Música",
        description: "Encargado de la alabanza y música en los servicios",
        leader: "María González",
        createdAt: new Date()
      },
      {
        name: "Ministerio de Niños",
        description: "Ministerio para la enseñanza y cuidado de los niños",
        leader: "Ana López",
        createdAt: new Date()
      }
    ];

    const result = await collection.insertMany(sampleMinisteries);
    console.log(`${result.insertedCount} ministerios insertados correctamente`);
    console.log('IDs insertados:', result.insertedIds);
  } catch (error) {
    console.error('Error al insertar ministerios:', error);
  } finally {
    process.exit(0);
  }
}

seedMinisteries();