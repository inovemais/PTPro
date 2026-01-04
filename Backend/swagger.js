const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PTPro API',
      version: '1.0.0',
      description: 'API documentation for PTPro - Personal Trainer Management System',
      contact: {
        name: 'API Support',
        email: 'support@ptpro.com'
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
          description: 'JWT token stored in httpOnly cookie. Login via /auth/login to get the token.'
        },
      },
      security: [
        {
          cookieAuth: []
        }
      ],
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'User ID'
            },
            name: {
              type: 'string',
              description: 'User name (unique)'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email (unique)'
            },
            password: {
              type: 'string',
              description: 'User password (hashed)'
            },
            role: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  enum: ['admin', 'user']
                },
                scope: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['admin', 'PersonalTrainer', 'client']
                  }
                }
              }
            },
            age: {
              type: 'number',
              description: 'User age'
            },
            address: {
              type: 'string',
              description: 'User address'
            },
            country: {
              type: 'string',
              description: 'User country'
            },
            taxNumber: {
              type: 'number',
              description: 'Tax identification number (unique)'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            message: {
              type: 'string',
              description: 'Detailed error message'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email'
            },
            password: {
              type: 'string',
              description: 'User password'
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            auth: {
              type: 'boolean',
              description: 'Authentication status'
            },
            token: {
              type: 'string',
              description: 'JWT token'
            },
            qrCode: {
              type: 'string',
              description: 'Base64 encoded QR code image'
            },
            decoded: {
              type: 'object',
              properties: {
                id: {
                  type: 'string'
                },
                name: {
                  type: 'string'
                },
                role: {
                  type: 'array',
                  items: {
                    type: 'string'
                  }
                }
              }
            }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password', 'address', 'country', 'taxNumber', 'role'],
          properties: {
            name: {
              type: 'string',
              description: 'Username (must be unique)',
              example: 'admin'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email (must be unique)',
              example: 'admin@ptpro.com'
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'User password',
              example: 'password123'
            },
            role: {
              type: 'object',
              required: ['name', 'scope'],
              properties: {
                name: {
                  type: 'string',
                  enum: ['admin', 'user'],
                  example: 'admin'
                },
                scope: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['admin', 'PersonalTrainer', 'client']
                  },
                  description: 'Must include "admin" to create an admin user, or "client"/"PersonalTrainer" for other users',
                  example: ['admin']
                }
              }
            },
            age: {
              type: 'number',
              description: 'User age (optional)',
              example: 30
            },
            address: {
              type: 'string',
              description: 'User address',
              example: '123 Main Street'
            },
            country: {
              type: 'string',
              description: 'User country',
              example: 'Portugal'
            },
            taxNumber: {
              type: 'number',
              description: 'Tax identification number (must be unique)',
              example: 123456789
            }
          }
        },
        RegisterResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'User saved'
            },
            user: {
              $ref: '#/components/schemas/User'
            },
            auth: {
              type: 'boolean',
              example: true
            },
            token: {
              type: 'string',
              description: 'JWT token for the newly created user'
            },
            decoded: {
              type: 'object',
              properties: {
                id: {
                  type: 'string'
                },
                name: {
                  type: 'string'
                },
                role: {
                  type: 'array',
                  items: {
                    type: 'string'
                  }
                }
              }
            }
          }
        },
        StandardResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              description: 'Response data'
            },
            meta: {
              type: 'object',
              description: 'Metadata (pagination, etc.)'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            data: {
              type: 'null'
            },
            meta: {
              type: 'object',
              properties: {
                error: {
                  type: 'string'
                }
              }
            }
          }
        },
        ValidationErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            data: {
              type: 'null'
            },
            meta: {
              type: 'object',
              properties: {
                error: {
                  type: 'string'
                },
                errors: {
                  type: 'object'
                }
              }
            }
          }
        },
        Trainer: {
          type: 'object',
          properties: {
            _id: {
              type: 'string'
            },
            userId: {
              type: 'object',
              $ref: '#/components/schemas/User'
            },
            bio: {
              type: 'string'
            },
            specialties: {
              type: 'array',
              items: {
                type: 'string'
              }
            },
            isValidated: {
              type: 'boolean',
              default: false
            },
            photo: {
              type: 'string'
            }
          }
        },
        TrainerCreate: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: {
              type: 'string',
              description: 'User ID'
            },
            bio: {
              type: 'string'
            },
            specialties: {
              type: 'array',
              items: {
                type: 'string'
              }
            },
            photo: {
              type: 'string'
            }
          }
        },
        TrainerUpdate: {
          type: 'object',
          properties: {
            bio: {
              type: 'string'
            },
            specialties: {
              type: 'array',
              items: {
                type: 'string'
              }
            },
            isValidated: {
              type: 'boolean'
            },
            photo: {
              type: 'string'
            }
          }
        },
        Client: {
          type: 'object',
          properties: {
            _id: {
              type: 'string'
            },
            userId: {
              type: 'object',
              $ref: '#/components/schemas/User'
            },
            trainerId: {
              type: 'string',
              description: 'Associated trainer ID'
            },
            heightCm: {
              type: 'number'
            },
            weightKg: {
              type: 'number'
            },
            goal: {
              type: 'string'
            },
            notes: {
              type: 'string'
            }
          }
        },
        ClientCreate: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: {
              type: 'string'
            },
            trainerId: {
              type: 'string'
            },
            heightCm: {
              type: 'number'
            },
            weightKg: {
              type: 'number'
            },
            goal: {
              type: 'string'
            },
            notes: {
              type: 'string'
            }
          }
        },
        ClientUpdate: {
          type: 'object',
          properties: {
            trainerId: {
              type: 'string'
            },
            heightCm: {
              type: 'number'
            },
            weightKg: {
              type: 'number'
            },
            goal: {
              type: 'string'
            },
            notes: {
              type: 'string'
            }
          }
        },
        ChangeRequestCreate: {
          type: 'object',
          required: ['requestedTrainerId'],
          properties: {
            requestedTrainerId: {
              type: 'string',
              description: 'ID of the trainer to switch to'
            },
            reason: {
              type: 'string',
              description: 'Reason for the change request'
            }
          }
        },
        PlanCreate: {
          type: 'object',
          required: ['trainerId', 'clientId', 'name', 'frequencyPerWeek', 'startDate'],
          properties: {
            trainerId: {
              type: 'string'
            },
            clientId: {
              type: 'string'
            },
            name: {
              type: 'string'
            },
            description: {
              type: 'string'
            },
            frequencyPerWeek: {
              type: 'integer',
              enum: [3, 4, 5]
            },
            startDate: {
              type: 'string',
              format: 'date'
            },
            endDate: {
              type: 'string',
              format: 'date'
            },
            sessions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  weekday: {
                    type: 'string',
                    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                  },
                  exercises: {
                    type: 'array',
                    maxItems: 10,
                    items: {
                      type: 'object',
                      properties: {
                        name: {
                          type: 'string'
                        },
                        sets: {
                          type: 'number'
                        },
                        reps: {
                          type: 'number'
                        },
                        instructions: {
                          type: 'string'
                        },
                        videoUrl: {
                          type: 'string'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        PlanUpdate: {
          type: 'object',
          properties: {
            name: {
              type: 'string'
            },
            description: {
              type: 'string'
            },
            frequencyPerWeek: {
              type: 'integer',
              enum: [3, 4, 5]
            },
            startDate: {
              type: 'string',
              format: 'date'
            },
            endDate: {
              type: 'string',
              format: 'date'
            },
            isActive: {
              type: 'boolean'
            },
            sessions: {
              type: 'array',
              items: {
                type: 'object'
              }
            }
          }
        },
        WorkoutLogCreate: {
          type: 'object',
          required: ['workoutPlanId', 'date', 'status'],
          properties: {
            workoutPlanId: {
              type: 'string'
            },
            date: {
              type: 'string',
              format: 'date'
            },
            status: {
              type: 'string',
              enum: ['completed', 'missed', 'partial']
            },
            reason: {
              type: 'string',
              description: 'Required if status is "missed"'
            },
            photo: {
              type: 'string',
              format: 'binary',
              description: 'Optional photo upload'
            }
          }
        },
        WorkoutLogUpdate: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['completed', 'missed', 'partial']
            },
            reason: {
              type: 'string'
            },
            photo: {
              type: 'string',
              format: 'binary'
            }
          }
        },
        MessageCreate: {
          type: 'object',
          required: ['receiverId', 'text'],
          properties: {
            receiverId: {
              type: 'string',
              description: 'ID of the message receiver'
            },
            text: {
              type: 'string',
              description: 'Message text'
            }
          }
        },
        Message: {
          type: 'object',
          properties: {
            _id: {
              type: 'string'
            },
            senderId: {
              type: 'string'
            },
            receiverId: {
              type: 'string'
            },
            text: {
              type: 'string'
            },
            read: {
              type: 'boolean',
              default: false
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Auth',
        description: 'Authentication endpoints'
      },
      {
        name: 'Users',
        description: 'User management endpoints'
      },
      {
        name: 'Trainers',
        description: 'Trainer profile management'
      },
      {
        name: 'Clients',
        description: 'Client profile management'
      },
      {
        name: 'Change Requests',
        description: 'Trainer change requests'
      },
      {
        name: 'Plans',
        description: 'Training plans management'
      },
      {
        name: 'WorkoutLogs',
        description: 'Workout logs tracking'
      },
      {
        name: 'Chat',
        description: 'Messaging between users'
      },
      {
        name: 'Uploads',
        description: 'File uploads'
      }
    ],
    responses: {
      UnauthorizedError: {
        description: 'Unauthorized - Invalid or missing token',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            }
          }
        }
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            }
          }
        }
      },
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ValidationErrorResponse'
            }
          }
        }
      }
    }
  },
  apis: [
    './server/*.js',
    './server/src/modules/**/*.js',
    './index.js'
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

