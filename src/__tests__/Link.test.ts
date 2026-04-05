import { LinkModel } from '../services/models/Link';
import type { OpenAPIParser } from '../services/OpenAPIParser';
import type { RedocNormalizedOptions } from '../services/RedocNormalizedOptions';

describe('LinkModel', () => {
  let mockParser: any;
  let mockOptions: any;
  let mockOperation: any;
  let mockResponse: any;

  beforeEach(() => {
    mockParser = {
      deref: jest.fn((ref) => ({
        resolved: ref,
      })),
      spec: {
        paths: {
          '/users/{id}': {
            get: {
              operationId: 'getUserById',
            },
            put: {
              operationId: 'updateUser',
            },
          },
          '/users/{userId}/posts': {
            get: {
              operationId: 'getUserPosts',
            },
          },
        },
        servers: [{ url: 'https://api.example.com' }],
      },
    };

    mockOptions = {
      expandResponses: 'all',
    };

    mockOperation = {
      operationSpec: {
        servers: [{ url: 'https://api.example.com/v1' }],
      },
    };

    mockResponse = {};
  });

  it('should create a LinkModel with operationId', () => {
    const linkInfo = {
      operationId: 'getUserById',
      description: 'Get user by ID',
      parameters: {
        userId: '$response.body#/id',
      },
    };

    const link = new LinkModel(mockParser, 'getUserLink', linkInfo, mockOperation, mockResponse, mockOptions);

    expect(link.name).toBe('getUserLink');
    expect(link.description).toBe('Get user by ID');
    expect(link.operationId).toBe('getUserById');
    expect(link.isReachable).toBe(true);
    expect(link.path).toBe('/users/{id}');
    expect(link.method).toBe('GET');
  });

  it('should handle unreachable operations', () => {
    const linkInfo = {
      operationId: 'nonExistentOperation',
      description: 'Link to non-existent operation',
    };

    const link = new LinkModel(mockParser, 'badLink', linkInfo, mockOperation, mockResponse, mockOptions);

    expect(link.isReachable).toBe(false);
    expect(link.unreachableReason).toContain('nonExistentOperation');
    expect(link.unreachableReason).toContain('not found');
  });

  it('should parse link parameters correctly', () => {
    const linkInfo = {
      operationId: 'getUserById',
      parameters: {
        userId: '$response.body#/id',
        filter: '$query.status',
      },
    };

    const link = new LinkModel(mockParser, 'testLink', linkInfo, mockOperation, mockResponse, mockOptions);

    expect(link.parameters.length).toBe(2);
    expect(link.parameters[0].name).toBe('userId');
    expect(link.parameters[0].runtimeExpression).toBe('$response.body#/id');
    expect(link.parameters[1].name).toBe('filter');
  });

  it('should resolve server from link, operation, or spec', () => {
    const linkInfo = {
      operationId: 'getUserById',
      server: { url: 'https://custom.example.com' },
    };

    const link = new LinkModel(mockParser, 'customLink', linkInfo, mockOperation, mockResponse, mockOptions);

    expect(link.server.url).toBe('https://custom.example.com');
  });

  it('should toggle parameters expansion', () => {
    const linkInfo = {
      operationId: 'getUserById',
    };

    const link = new LinkModel(mockParser, 'testLink', linkInfo, mockOperation, mockResponse, mockOptions);

    expect(link.parametersExpanded).toBe(false);
    link.toggleParameters();
    expect(link.parametersExpanded).toBe(true);
    link.toggleParameters();
    expect(link.parametersExpanded).toBe(false);
  });

  it('should infer parameter types from runtime expressions', () => {
    const linkInfo = {
      operationId: 'getUserById',
      parameters: {
        pathParam: '$request.path.id',
        queryParam: '$request.query.filter',
        headerParam: '$request.header.X-Token',
      },
    };

    const link = new LinkModel(mockParser, 'testLink', linkInfo, mockOperation, mockResponse, mockOptions);

    expect(link.parameters[0].in).toBe('path');
    expect(link.parameters[1].in).toBe('query');
    expect(link.parameters[2].in).toBe('header');
  });
});