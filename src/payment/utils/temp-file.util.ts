import * as tmp from 'tmp';

export const createFile = (format: string, prefix: string) => {
  return tmp.fileSync({
    mode: parseInt('0600', 8),
    prefix: 'bulkTopup-' + prefix,
    postfix: format,
  });
};
