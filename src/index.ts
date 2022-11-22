import path from 'path';
import{ rollup } from 'rollup';

export const build = () => {
  rollup({
    input: path.resolve('../'),
  });
};
