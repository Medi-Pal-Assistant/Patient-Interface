import { QdrantClient } from '@qdrant/js-client-rest';

const COLLECTION_NAME = 'patient_demographics';

// Initialize Qdrant client
export const qdrantClient = new QdrantClient({
  url: process.env.NEXT_PUBLIC_QDRANT_URL,
  apiKey: process.env.NEXT_PUBLIC_QDRANT_API_KEY,
});

// Initialize collection if it doesn't exist
export const initializeCollection = async () => {
  try {
    const collections = await qdrantClient.getCollections();
    const collectionExists = collections.collections.some(
      (collection) => collection.name === COLLECTION_NAME
    );

    if (!collectionExists) {
      await qdrantClient.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 1, // Using minimal vector size since we're only using payload
          distance: 'Cosine',
        },
      });

      // Create payload indexes for common search fields
      await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
        field_name: 'first_name',
        field_schema: 'keyword',
      });

      await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
        field_name: 'last_name',
        field_schema: 'keyword',
      });

      await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
        field_name: 'birthdate',
        field_schema: 'keyword',
      });

      await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
        field_name: 'medicare_no',
        field_schema: 'keyword',
      });
    }
  } catch (error) {
    console.error('Error initializing Qdrant collection:', error);
    throw error;
  }
};

// Function to search for a patient
export const searchPatient = async (
  firstName: string,
  lastName: string,
  birthdate: string,
  medicare_no?: string
) => {
  try {
    const mustConditions = [
      {
        key: 'first_name',
        match: { text: firstName },
      },
      {
        key: 'last_name',
        match: { text: lastName },
      },
      {
        key: 'birthdate',
        match: { text: birthdate },
      },
    ];

    if (medicare_no) {
      mustConditions.push({
        key: 'medicare_no',
        match: { text: medicare_no },
      });
    }

    const searchResult = await qdrantClient.scroll(COLLECTION_NAME, {
      filter: {
        must: mustConditions,
      },
      limit: 1,
    });

    if (searchResult.points.length > 0) {
      const payload = searchResult.points[0].payload as unknown;
      return payload as Patient;
    }

    return null;
  } catch (error) {
    console.error('Error searching for patient:', error);
    throw error;
  }
};


// Patient interface
export interface Patient {
  id: string;
  birthdate: string;
  deathdate: string | null;
  medicare_no: string;
  drivers: string;
  passport: string;
  prefix: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix: string | null;
  maiden_name: string | null;
  marital: string;
  race: string;
  ethnicity: string;
  gender: string;
  birthplace: string;
  address: string;
  city: string;
  state: string;
  county: string | null;
  fips: string | null;
  postcode: string;
  lat: number;
  lon: number;
  healthcare_expenses: number;
  healthcare_coverage: number;
  income: number;
}

// Function to get a patient by ID
export const getPatientById = async (patientId: string): Promise<Patient | null> => {
  try {
    const result = await qdrantClient.retrieve(COLLECTION_NAME, {
      ids: [patientId],
      with_payload: true,
      with_vector: true
    });

    if (result && result.length > 0) {
      const payload = result[0].payload as unknown;
      return payload as Patient;
    }

    return null;
  } catch (error) {
    console.error('Error getting patient by ID:', error);
    throw error;
  }
}; 