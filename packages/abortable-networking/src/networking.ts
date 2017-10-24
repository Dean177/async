import { Abortable } from 'abortable';
import * as request from 'superagent';
import { SuperAgentRequest, Response } from 'superagent';

type BearerToken = string;
type Milliseconds = number;
export type HttpVerb = 'delete' | 'get' | 'patch' | 'post' | 'put';

const defaultTimeout: Milliseconds = 60000;

export type ApiResponse<T> = Response & { body: T };
export type AbortableRequest<T> = request.SuperAgentRequest & Abortable<ApiResponse<T>>;

export const from = (apiBaseUrl: string = '/') => (url: string, method: HttpVerb = 'get'): SuperAgentRequest =>
  request[method](`${apiBaseUrl}${url}`);

export const withJsonBody = <T extends object>(body: T) => (req: SuperAgentRequest): SuperAgentRequest =>
  req
    .set('Content-Type', 'application/json')
    .send(body);

const withAuthorizationBearerHeader = (accessToken: BearerToken) => (req: SuperAgentRequest): SuperAgentRequest =>
  req
    .set('Authorization', `Bearer ${accessToken}`);

export const fetchJson = <T>(req: SuperAgentRequest): AbortableRequest<T> =>
  req
    .set('Accept', 'application/json')
    .set('Cache-Control', 'no-cache')
    .set('Pragma', 'no-cache')
    .timeout(defaultTimeout)
    .withCredentials()
  ;

export const fetchSecureJson = (accessToken: BearerToken) => <T>(req: SuperAgentRequest): AbortableRequest<T> =>
  fetchJson(withAuthorizationBearerHeader(accessToken)(req));
