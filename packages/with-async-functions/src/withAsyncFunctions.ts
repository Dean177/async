import { Abortable, AbortableLike } from 'abortable';
import { assign, mapValues, forEach, some } from 'lodash';
import { Component, ComponentClass, ComponentType, createElement } from 'react';

type TODO = any; // TODO remove
type Decorator<Props, EnhancedProps> =
  (component: ComponentType<EnhancedProps>) => ComponentType<Props>;

type StateItem<ResponseType> = {
  inProgress: boolean,
  result: ResponseType | null,
};

type Submission<OP, M, Result> =
  (props: OP) => (model: M) => Abortable<Result>;

type Submissions<OP, RequestTypes, ResponseTypes extends RequestTypes> = {
  [SubmissionAction in keyof RequestTypes]:
    Submission<OP, RequestTypes[SubmissionAction], Abortable<ResponseTypes[SubmissionAction]>>
}


export type AsyncSubmissionProps<RequestTypes, ResponseTypes extends RequestTypes> = {
  submit: {
    [SubmissionAction in keyof RequestTypes]:
      (model: RequestTypes[SubmissionAction]) => Abortable<ResponseTypes[SubmissionAction]>
  }
};

type State<RequestTypes, ResponseTypes extends RequestTypes> = {
  [SubmissionAction in keyof RequestTypes]: StateItem<ResponseTypes[SubmissionAction]>
};
export const withAsyncSubmission =
  <OP, RequestTypes, ResponseTypes extends RequestTypes>(submitRequest: Submissions<OP, RequestTypes, ResponseTypes>): Decorator<OP, OP & AsyncSubmissionProps<RequestTypes, ResponseTypes>> =>
    (WrappedComponent: ComponentType<OP & AsyncSubmissionProps<RequestTypes, ResponseTypes>>): ComponentClass<OP> =>
      class FormSubmissionWrapper extends Component<OP, State<RequestTypes, ResponseTypes>> {
        _isMounted = false;

        requests = mapValues(submitRequest, () => null) as TODO as
          { [ SubmissionAction in keyof RequestTypes]: Abortable<ResponseTypes[SubmissionAction]> | null };

        state = mapValues(submitRequest, () => ({
          inProgress: false,
          result: null,
        })) as TODO as State<RequestTypes, ResponseTypes>;

        onSubmission = <RequestType extends keyof RequestTypes>(submissionAction: RequestType) =>
          (formModel: RequestTypes[keyof RequestTypes]): Abortable<ResponseTypes[RequestType]> => {
            const request: Abortable<ResponseTypes[RequestType]> =
              submitRequest[submissionAction](this.props)(formModel);

            this.requests[submissionAction] = request;
            const newStateItem: StateItem<ResponseTypes[keyof RequestTypes]> = {
              result: null,
              inProgress: true,
            };

            this.setState({ [submissionAction as TODO]: newStateItem } as TODO);

            const stateItemFinished: StateItem<ResponseTypes[keyof RequestTypes]> = {
              inProgress: false,
              result: null,
            };

            request
              .then((response: ResponseTypes[RequestType]) => {
                if (this._isMounted) {
                  this.setState({[submissionAction as TODO]: stateItemFinished });
                }
              })
              .catch(error => {
                if (this._isMounted) {
                  this.setState({ [submissionAction as TODO]: stateItemFinished });
                }
              });

            return request;
          }

        componentDidMount() {
          this._isMounted = true;
        }

        componentWillUnmount() {
          this._isMounted = false;
          forEach(this.requests, (request: Abortable<{}> | null): void => {
            if (request != null) {
              request.abort();
            }
          });
        }

        render() {
          const submit = mapValues(submitRequest, (apiMethod, submissionAction: keyof RequestTypes) =>
            this.onSubmission(submissionAction));

          const enhancedProps: OP & AsyncSubmissionProps<RequestTypes, ResponseTypes> =
            assign({}, this.props, { submit }) as TODO;

          return createElement(WrappedComponent, enhancedProps);
        });
      };
