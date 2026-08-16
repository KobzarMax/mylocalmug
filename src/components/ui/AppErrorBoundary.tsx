import { Component, ErrorInfo, ReactNode } from 'react';

import { StateView } from './StateView';

type Props = { children: ReactNode };
type State = { error: Error | null };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled Local Mug screen error', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <StateView
          kind="error"
          title="This screen could not open"
          message="Your data is safe. Try loading the screen again."
          onRetry={() => this.setState({ error: null })}
        />
      );
    }
    return this.props.children;
  }
}
