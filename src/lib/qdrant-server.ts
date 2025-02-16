import { QdrantClient } from '@qdrant/js-client-rest';

const COLLECTION_NAME = 'patient_demographics';

// Initialize Qdrant client for server-side operations
export const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

// Initialize collection if it doesn't exist
export const initializeQdrantCollection = async () => {
  try {
    const collections = await qdrantClient.getCollections();
    const collectionExists = collections.collections.some(
      (collection) => collection.name === COLLECTION_NAME
    );

    if (!collectionExists) {
      console.log('Creating Qdrant collection...');
      await qdrantClient.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 1,
          distance: 'Cosine',
        },
      });

      // Create payload indexes
      await Promise.all([
        qdrantClient.createPayloadIndex(COLLECTION_NAME, {
          field_name: 'first_name',
          field_schema: 'keyword',
        }),
        qdrantClient.createPayloadIndex(COLLECTION_NAME, {
          field_name: 'last_name',
          field_schema: 'keyword',
        }),
        qdrantClient.createPayloadIndex(COLLECTION_NAME, {
          field_name: 'birthdate',
          field_schema: 'keyword',
        }),
        qdrantClient.createPayloadIndex(COLLECTION_NAME, {
          field_name: 'medicare_no',
          field_schema: 'keyword',
        }),
      ]);
      console.log('Qdrant collection created successfully');
    } else {
      console.log('Qdrant collection already exists');
    }
  } catch (error) {
    console.error('Error initializing Qdrant collection:', error);
    throw error;
  }
}; 