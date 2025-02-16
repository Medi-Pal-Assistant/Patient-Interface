import { useCallback } from 'react'

export type ToolDefinition = {
  type: 'function'
  name: string
  function: {
    name: string
    description: string
    parameters: {
      type: string
      properties: Record<string, {
        type: string
        description: string
        enum?: string[]
      }>
      required?: string[]
    }
  }
}

export type VoiceToolDefinition = {
  type: 'function'
  name: string
  description: string
  parameters: {
    type: string
    properties: Record<string, {
      type: string
      description: string
      enum?: string[]
    }>
    required?: string[]
  }
}

export const useToolDefinitions = () => {
  const getToolDefinitions = useCallback((): ToolDefinition[] => {
    return [
      {
        type: 'function',
        name: 'get_patient_id',
        function: {
          name: 'get_patient_id',
          description: "Retrieve a patient's ID using their name components and date of birth",
          parameters: {
            type: 'object',
            properties: {
              firstName: {
                type: 'string',
                description: "Patient's first name"
              },
              lastName: {
                type: 'string',
                description: "Patient's last name"
              },
              dateOfBirth: {
                type: 'string',
                description: "Patient's date of birth in YYYY-MM-DD format"
              },
              medicareNo: {
                type: 'string',
                description: "Patient's Medicare number (optional)"
              }
            },
            required: ['firstName', 'lastName', 'dateOfBirth']
          }
        }
      },
      {
        type: 'function',
        name: 'get_patient_details',
        function: {
          name: 'get_patient_details',
          description: 'Retrieve detailed information about a patient using their ID',
          parameters: {
            type: 'object',
            properties: {
              patientId: {
                type: 'string',
                description: 'The unique identifier of the patient'
              }
            },
            required: ['patientId']
          }
        }
      }
    ]
  }, [])

  const getVoiceToolDefinitions = useCallback((): VoiceToolDefinition[] => {
    return getToolDefinitions().map(tool => ({
      type: 'function',
      name: tool.function.name,
      description: tool.function.description,
      parameters: tool.function.parameters
    }))
  }, [])

  return { getToolDefinitions, getVoiceToolDefinitions }
}
