export class TaskRegistry {
  constructor();
  static RUNNING: string;
  static CLOSING: string;
  static CLOSED: string;
  count: number;
  isRunning: boolean;
  isClosing: boolean;
  isClosed: boolean;
  tasks: TaskList;
  register(name: string): string;
  clear(token: string): void;
  perform(name: string, fn: Promise): Promise<any>;
  close(options: CloseOptions): void;
  reset(): void;
}

type TaskList = Array<TaskListEntry>;

type TaskListEntry = {
  name: Name;
  token: Token;
  timestamp: number;
};

type CloseOptions = {
  timeout: number;
};
