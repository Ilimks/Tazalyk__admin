import { vi } from 'vitest';

interface ProgressInfo {
  lengthComputable: boolean;
  loaded: number;
  total: number;
}

export class FakeUploadRequest {
  method = '';
  url = '';
  withCredentials = false;
  timeout = 0;
  responseType = '';
  status = 0;
  response: unknown = null;
  body: FormData | null = null;
  upload: { onprogress: ((event: ProgressInfo) => void) | null } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  ontimeout: (() => void) | null = null;

  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }

  send(body: FormData) {
    this.body = body;
  }

  progress(loaded: number, total: number) {
    this.upload.onprogress?.({ lengthComputable: true, loaded, total });
  }

  respond(status: number, data: unknown) {
    this.status = status;
    this.response = data;
    this.onload?.();
  }
}

export const mockUploads = () => {
  const sent: FakeUploadRequest[] = [];

  class UploadRequest extends FakeUploadRequest {
    send(body: FormData) {
      super.send(body);
      sent.push(this);
    }
  }

  vi.stubGlobal('XMLHttpRequest', UploadRequest);
  return sent;
};
