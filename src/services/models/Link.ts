import { action, observable, makeObservable } from 'mobx';
import type { OpenAPILink, Referenced } from '../../types';
import type { OpenAPIParser } from '../OpenAPIParser';
import type { RedocNormalizedOptions } from '../RedocNormalizedOptions';

export interface LinkParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'body';
  required: boolean;
  description: string;
  runtimeExpression: string;
}

export interface LinkServerInfo {
  url: string;
  description?: string;
}

/**
 * Link model for OpenAPI 3.0+ Link Objects
 * Inherits server from: link > operation > pathItem > API spec
 */
export class LinkModel {
  @observable
  parametersExpanded: boolean = false;

  name: string;
  description: string;
  operationId?: string;
  operationRef?: string;
  path: string = '';
  method: string = '';
  parameters: LinkParameter[] = [];
  requestBodyRequired?: boolean;
  isReachable: boolean = false;
  unreachableReason?: string;
  server: LinkServerInfo;
  targetOperationPointer?: string;

  constructor(
    private parser: OpenAPIParser,
    name: string,
    infoOrRef: Referenced<OpenAPILink>,
    private operation: any,
    private response: any,
    private options: RedocNormalizedOptions,
  ) {
    makeObservable(this);

    const { resolved: linkInfo } = parser.deref(infoOrRef);

    this.name = name;
    this.description = linkInfo.description || '';
    this.operationId = linkInfo.operationId;
    this.operationRef = linkInfo.operationRef;

    this.resolveTargetOperation(linkInfo);
    this.server = this.resolveServer(linkInfo);
    this.parseParameters(linkInfo);
  }

  private resolveTargetOperation(linkInfo: OpenAPILink): void {
    if (linkInfo.operationId) {
      const foundOp = this.findOperationByOperationId(linkInfo.operationId);
      if (foundOp) {
        this.path = foundOp.path;
        this.method = foundOp.method;
        this.isReachable = true;
        this.targetOperationPointer = foundOp.pointer;
      } else {
        this.isReachable = false;
        this.unreachableReason = `Operation with ID "${linkInfo.operationId}" not found in current document`;
      }
    } else if (linkInfo.operationRef) {
      this.isReachable = false;
      this.unreachableReason = `External operation reference: ${linkInfo.operationRef}`;
      this.parseOperationRef(linkInfo.operationRef);
    }
  }

  private resolveServer(linkInfo: OpenAPILink): LinkServerInfo {
    const serverObj =
      linkInfo.server ||
      this.operation?.operationSpec?.servers?.[0] ||
      this.operation?.operationSpec?.pathServers?.[0] ||
      this.parser.spec.servers?.[0];

    return {
      url: serverObj?.url || '',
      description: serverObj?.description,
    };
  }

  private parseParameters(linkInfo: OpenAPILink): void {
    if (!linkInfo.parameters) {
      return;
    }

    Object.entries(linkInfo.parameters).forEach(([paramName, runtimeExpression]) => {
      const paramType = this.inferParameterType(runtimeExpression as string);
      this.parameters.push({
        name: paramName,
        in: paramType,
        required: paramType === 'path',
        description: `Runtime mapping from response`,
        runtimeExpression: runtimeExpression as string,
      });
    });
  }

  private inferParameterType(expression: string): 'path' | 'query' | 'header' | 'body' {
    if (expression.includes('$request.path')) return 'path';
    if (expression.includes('$request.query')) return 'query';
    if (expression.includes('$request.header')) return 'header';
    if (expression.includes('$request.body') || expression.includes('$response')) return 'body';
    return 'path';
  }

  private findOperationByOperationId(operationId: string): { path: string; method: string; pointer: string } | null {
    const paths = this.parser.spec.paths;
    for (const pathKey in paths) {
      const pathItem = paths[pathKey];
      for (const method of ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace']) {
        const op = pathItem[method as keyof typeof pathItem] as any;
        if (op?.operationId === operationId) {
          return {
            path: pathKey,
            method: method.toUpperCase(),
            pointer: `/paths/${encodeURIComponent(pathKey)}/${method}`,
          };
        }
      }
    }
    return null;
  }

  private parseOperationRef(ref: string): void {
    try {
      const match = ref.match(/\/paths\/(.+)\/(\w+)$/);
      if (match) {
        this.path = '/' + decodeURIComponent(match[1]).replace(/~1/g, '/');
        this.method = match[2].toUpperCase();
      }
    } catch (e) {
      // ignore parse errors
    }
  }

  @action
  toggleParameters(): void {
    this.parametersExpanded = !this.parametersExpanded;
  }
}
